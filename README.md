# WAPPX

WAPPX is a WhatsApp Business automation and CRM. It connects the Meta WhatsApp Cloud API, Facebook Messenger, and Instagram to a workspace for live chat, visual flow automation, catalogs, orders, campaigns, templates, contacts, and support tickets.

Client workspaces live at `/app`. Super-admin client and ticket management lives at `/admin`. Inbound Meta events arrive at `/api/webhook`.

## Stack

- [Next.js](https://nextjs.org) 16 (App Router) and React 19
- TypeScript
- Tailwind CSS 4
- [Supabase](https://supabase.com) (`@supabase/supabase-js`) for data, Auth, Storage uploads, and realtime
- Meta Graph API v21.0 (`src/lib/meta-client.ts`)
- [`@xyflow/react`](https://reactflow.dev) for the flow builder
- Recharts for dashboard charts
- Three.js, OGL, AOS, and Lenis on the landing page
- Lucide React icons

## Workspace

The client sidebar covers Dashboard, Live Inbox, Order Management, Catalog, Campaigns, Templates, Integrations, Flows & Automations, Simulator, Contacts, and Settings. Support tickets are available from the workspace. Admin mode lists clients and tickets.

Public routes:

| Path | Purpose |
| --- | --- |
| `/` | Landing page and sign-in |
| `/login` | Email and password sign-in (Supabase Auth) |
| `/app` | Client workspace |
| `/admin` | Super-admin clients and tickets |
| `/privacy` | Privacy policy |
| `/data-deletion` | Data deletion instructions |

Sign-in stores the session in the browser (`src/lib/auth-session.ts`).

## Setup

1. Install dependencies (this repo uses the npm lockfile):

   ```bash
   npm install
   ```

2. Copy the env template and fill in your own values. Do not commit `.env.local`.

   ```bash
   cp .env.example .env.local
   ```

3. In the Supabase SQL editor, run `supabase/schema.sql`. That creates contacts, messages, flows, catalogs, orders, clients, Meta config, and support tickets, and enables realtime on those tables. Optional demo rows are in `supabase/seed.sql`.

4. Start the app:

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

5. In the Meta Developer console, set the WhatsApp (and Messenger / Instagram) webhook callback to `{NEXT_PUBLIC_APP_URL}/api/webhook`. Use the same verify token as `META_VERIFY_TOKEN`. Per-client phone numbers, access tokens, and verify tokens are saved in the `meta_config` table from Settings. `GET /api/webhook` checks those rows before the env fallback.

## Environment variables

The app reads these variables (see `.env.example`):

| Variable | Where it is used |
| --- | --- |
| `NEXT_PUBLIC_APP_URL` | Site metadata, sitemap, robots, and the webhook URL shown in Settings |
| `NEXT_PUBLIC_SUPABASE_URL` | Browser and server Supabase clients, and uploads |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Browser Supabase client; server fallback when the service role key is unset |
| `SUPABASE_SERVICE_ROLE_KEY` | Server admin client (`src/lib/supabase/server.ts`) and uploads |
| `META_VERIFY_TOKEN` | Fallback `hub.verify_token` for `GET /api/webhook` and diagnostics |
| `META_ACCESS_TOKEN` | Fallback Graph token for `GET /api/whatsapp/media/[id]` when `meta_config` has no access token |

## Scripts

| Script | Command |
| --- | --- |
| Development server | `npm run dev` |
| Production build | `npm run build` |
| Production server | `npm start` |
| Lint | `npm run lint` |

## Layout

- `src/app` — pages and route handlers (`api/webhook`, WhatsApp, catalog, admin, support, upload)
- `src/components` — landing, workspace, inbox, flow builder, catalog, campaigns, settings
- `src/lib` — Supabase clients, Meta client, bot engine, auth session
- `supabase/schema.sql` and `supabase/seed.sql` — database schema and optional seed data
