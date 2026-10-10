-- ====================================================================
-- Zynex WhatsApp Platform - Supabase Database Schema
-- ====================================================================

-- 1. Contacts Table
CREATE TABLE IF NOT EXISTS public.contacts (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    channel TEXT NOT NULL DEFAULT 'whatsapp' CHECK (channel IN ('whatsapp', 'messenger', 'instagram')),
    external_id TEXT,
    avatar_url TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'pending_human', 'resolved')),
    assigned_agent TEXT DEFAULT 'Unassigned',
    tags TEXT[] NOT NULL DEFAULT '{}',
    unread_count INTEGER NOT NULL DEFAULT 0,
    last_message_snippet TEXT DEFAULT '',
    last_message_time TEXT DEFAULT '',
    current_flow_node_id TEXT,
    is_bot_active BOOLEAN NOT NULL DEFAULT true,
    notes TEXT[] NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Messages Table
CREATE TABLE IF NOT EXISTS public.messages (
    id TEXT PRIMARY KEY,
    contact_id TEXT NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
    sender TEXT NOT NULL CHECK (sender IN ('customer', 'bot', 'agent')),
    sender_name TEXT,
    text TEXT NOT NULL,
    timestamp TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'delivered' CHECK (status IN ('sent', 'delivered', 'read', 'failed')),
    channel TEXT NOT NULL DEFAULT 'whatsapp' CHECK (channel IN ('whatsapp', 'messenger', 'instagram')),
    buttons JSONB,
    selected_button_id TEXT,
    media_url TEXT,
    media_type TEXT CHECK (media_type IN ('image', 'audio', 'document')),
    is_internal_note BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Flow Nodes Table
CREATE TABLE IF NOT EXISTS public.flow_nodes (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    trigger_keywords TEXT[] NOT NULL DEFAULT '{}',
    buttons JSONB NOT NULL DEFAULT '[]'::jsonb,
    next_node_id TEXT,
    fallback_node_id TEXT,
    position JSONB NOT NULL DEFAULT '{"x": 0, "y": 0}'::jsonb,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Meta Cloud API Configuration Table
CREATE TABLE IF NOT EXISTS public.meta_config (
    id TEXT PRIMARY KEY DEFAULT 'default',
    phone_number_id TEXT DEFAULT '',
    waba_id TEXT DEFAULT '',
    access_token TEXT DEFAULT '',
    verify_token TEXT DEFAULT 'zynex_meta_webhook_secret_2026',
    webhook_url TEXT DEFAULT '',
    is_connected BOOLEAN NOT NULL DEFAULT false,
    -- Facebook Messenger & Instagram Integration
    facebook_page_id TEXT DEFAULT '',
    facebook_page_name TEXT DEFAULT '',
    page_access_token TEXT DEFAULT '',
    is_messenger_connected BOOLEAN NOT NULL DEFAULT false,
    instagram_account_id TEXT DEFAULT '',
    instagram_username TEXT DEFAULT '',
    is_instagram_connected BOOLEAN NOT NULL DEFAULT false,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Migration helpers for existing databases:
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS channel TEXT NOT NULL DEFAULT 'whatsapp';
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS external_id TEXT;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS channel TEXT NOT NULL DEFAULT 'whatsapp';
ALTER TABLE public.meta_config ADD COLUMN IF NOT EXISTS facebook_page_id TEXT DEFAULT '';
ALTER TABLE public.meta_config ADD COLUMN IF NOT EXISTS facebook_page_name TEXT DEFAULT '';
ALTER TABLE public.meta_config ADD COLUMN IF NOT EXISTS page_access_token TEXT DEFAULT '';
ALTER TABLE public.meta_config ADD COLUMN IF NOT EXISTS is_messenger_connected BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.meta_config ADD COLUMN IF NOT EXISTS instagram_account_id TEXT DEFAULT '';
ALTER TABLE public.meta_config ADD COLUMN IF NOT EXISTS instagram_username TEXT DEFAULT '';
ALTER TABLE public.meta_config ADD COLUMN IF NOT EXISTS is_instagram_connected BOOLEAN NOT NULL DEFAULT false;

-- 5. Clients Table
CREATE TABLE IF NOT EXISTS public.clients (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    business_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone TEXT DEFAULT '',
    verify_token TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'pending')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Catalogs Table
CREATE TABLE IF NOT EXISTS public.catalogs (
    id TEXT PRIMARY KEY,
    client_id TEXT NOT NULL,
    name TEXT NOT NULL,
    catalog_id TEXT,
    description TEXT,
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_default BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Multi-Flows Table (Supports Multiple Flows per client)
CREATE TABLE IF NOT EXISTS public.flows (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT DEFAULT '',
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_default BOOLEAN NOT NULL DEFAULT false,
    nodes JSONB NOT NULL DEFAULT '[]'::jsonb,
    trigger_keywords TEXT[] NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for optimal query performance
CREATE INDEX IF NOT EXISTS idx_messages_contact_id ON public.messages(contact_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at);
CREATE INDEX IF NOT EXISTS idx_contacts_status ON public.contacts(status);
CREATE INDEX IF NOT EXISTS idx_contacts_phone ON public.contacts(phone);
CREATE INDEX IF NOT EXISTS idx_catalogs_client_id ON public.catalogs(client_id);
CREATE INDEX IF NOT EXISTS idx_flows_user_id ON public.flows(user_id);

-- Enable Row Level Security (RLS)
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flow_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meta_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.catalogs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flows ENABLE ROW LEVEL SECURITY;

-- Allow anon and authenticated clients full access for CRM operations
DO $$
BEGIN
    DROP POLICY IF EXISTS "Public access to contacts" ON public.contacts;
    DROP POLICY IF EXISTS "Public access to messages" ON public.messages;
    DROP POLICY IF EXISTS "Public access to flow_nodes" ON public.flow_nodes;
    DROP POLICY IF EXISTS "Public access to meta_config" ON public.meta_config;
    DROP POLICY IF EXISTS "Public access to clients" ON public.clients;
    DROP POLICY IF EXISTS "Allow anon full access on catalogs" ON public.catalogs;
    DROP POLICY IF EXISTS "Public access to catalogs" ON public.catalogs;
    DROP POLICY IF EXISTS "Public access to flows" ON public.flows;
END $$;

CREATE POLICY "Public access to contacts" ON public.contacts FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Public access to messages" ON public.messages FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Public access to flow_nodes" ON public.flow_nodes FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Public access to meta_config" ON public.meta_config FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Public access to clients" ON public.clients FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Public access to catalogs" ON public.catalogs FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Public access to flows" ON public.flows FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- Enable Supabase Realtime for instant synchronization across clients
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'contacts'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.contacts;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'messages'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'flow_nodes'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.flow_nodes;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'meta_config'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.meta_config;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'clients'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.clients;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'catalogs'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.catalogs;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'support_tickets'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.support_tickets;
    END IF;
END $$;

-- 7. Support Tickets Table
CREATE TABLE IF NOT EXISTS public.support_tickets (
    id TEXT PRIMARY KEY,
    client_id TEXT NOT NULL,
    client_name TEXT NOT NULL,
    business_name TEXT DEFAULT '',
    client_email TEXT NOT NULL,
    subject TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'technical',
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'waiting_client', 'resolved', 'closed')),
    description TEXT NOT NULL,
    messages JSONB NOT NULL DEFAULT '[]'::jsonb,
    assigned_admin TEXT DEFAULT 'Unassigned',
    resolution_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_support_tickets_client_id ON public.support_tickets(client_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON public.support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_created_at ON public.support_tickets(created_at);

-- 8. Catalog Orders Table (WhatsApp Commerce Orders)
CREATE TABLE IF NOT EXISTS public.catalog_orders (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    contact_id TEXT NOT NULL,
    contact_name TEXT NOT NULL,
    contact_phone TEXT NOT NULL,
    catalog_id TEXT,
    catalog_name TEXT,
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    subtotal NUMERIC NOT NULL DEFAULT 0,
    currency TEXT NOT NULL DEFAULT 'LKR',
    customer_note TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled')),
    shipping_address TEXT,
    tracking_number TEXT,
    whatsapp_message_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_catalog_orders_user_id ON public.catalog_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_catalog_orders_contact_id ON public.catalog_orders(contact_id);
CREATE INDEX IF NOT EXISTS idx_catalog_orders_status ON public.catalog_orders(status);
CREATE INDEX IF NOT EXISTS idx_catalog_orders_created_at ON public.catalog_orders(created_at);
