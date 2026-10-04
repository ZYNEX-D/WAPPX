import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";

export interface DiagnosticCheckItem {
  id: string;
  category: "auth" | "phone" | "waba" | "webhook" | "catalog" | "database" | "profile";
  name: string;
  status: "success" | "warning" | "error" | "pending";
  summary: string;
  details?: Record<string, any>;
  actionUrl?: string;
  actionText?: string;
  recommendation?: string;
}

export interface DiagnosticsResponse {
  timestamp: string;
  overallStatus: "healthy" | "partial" | "critical";
  scorePercentage: number;
  totalChecks: number;
  passedChecks: number;
  checks: DiagnosticCheckItem[];
  environment: {
    appUrl: string;
    hasVerifyToken: boolean;
    hasSupabase: boolean;
  };
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const clientId = searchParams.get("clientId") || "client-1";

    const checks: DiagnosticCheckItem[] = [];

    // 1. Supabase Database & Config Check
    let config: any = null;
    try {
      const { data, error } = await supabaseAdmin
        .from("meta_config")
        .select("*")
        .or(`id.eq.${clientId},user_id.eq.${clientId}`)
        .limit(1)
        .maybeSingle();

      if (error) {
        checks.push({
          id: "db_config",
          category: "database",
          name: "Supabase Database & Meta Config",
          status: "error",
          summary: `Database error querying meta_config: ${error.message}`,
          recommendation: "Ensure Supabase tables are created and service role key is valid in .env.local",
        });
      } else if (!data) {
        // Fallback to default
        const { data: defaultData } = await supabaseAdmin
          .from("meta_config")
          .select("*")
          .eq("id", "default")
          .maybeSingle();

        config = defaultData;
        checks.push({
          id: "db_config",
          category: "database",
          name: "Supabase Database & Meta Config",
          status: defaultData ? "warning" : "error",
          summary: defaultData
            ? "Using default meta_config row for this workspace"
            : `No meta_config record found for client '${clientId}'`,
          recommendation: defaultData ? undefined : "Save your Meta credentials in the Settings tab to initialize your workspace.",
        });
      } else {
        config = data;
        checks.push({
          id: "db_config",
          category: "database",
          name: "Supabase Database & Meta Config",
          status: "success",
          summary: `Connected to Supabase. Workspace credentials loaded for '${clientId}'.`,
          details: {
            workspaceId: clientId,
            configRowId: data.id,
            updatedAt: data.updated_at,
          },
        });
      }
    } catch (dbErr: any) {
      checks.push({
        id: "db_config",
        category: "database",
        name: "Supabase Database & Meta Config",
        status: "error",
        summary: `Exception connecting to Supabase: ${dbErr?.message || "Unknown error"}`,
      });
    }

    const token = config?.access_token || "";
    const phoneId = config?.phone_number_id || "";
    const wabaId = config?.waba_id || "";

    // 2. Meta Permanent Access Token Check
    if (!token || token.startsWith("EAA...")) {
      checks.push({
        id: "meta_token",
        category: "auth",
        name: "Meta Permanent Access Token",
        status: "error",
        summary: "No valid Meta Access Token configured or using placeholder value.",
        recommendation: "Generate a System User Permanent Token in Meta Business Suite with 'whatsapp_business_messaging' and 'whatsapp_business_management' permissions.",
        actionUrl: "https://business.facebook.com/settings/system-users",
        actionText: "Meta System Users",
      });
    } else {
      try {
        const debugRes = await fetch(
          `https://graph.facebook.com/v21.0/debug_token?input_token=${token}&access_token=${token}`,
          { cache: "no-store" }
        );
        const debugData = await debugRes.json();

        if (debugRes.ok && debugData?.data?.is_valid) {
          const d = debugData.data;
          const scopes: string[] = d.scopes || [];
          const hasMessaging = scopes.includes("whatsapp_business_messaging");
          const hasManagement = scopes.includes("whatsapp_business_management");
          const hasCatalog = scopes.includes("catalog_management");

          const isExpiring = d.expires_at && d.expires_at > 0;
          const expiresFormatted = isExpiring
            ? new Date(d.expires_at * 1000).toLocaleDateString()
            : "Never (Permanent System User Token)";

          const missingPermissions: string[] = [];
          if (!hasMessaging) missingPermissions.push("whatsapp_business_messaging");
          if (!hasManagement) missingPermissions.push("whatsapp_business_management");

          checks.push({
            id: "meta_token",
            category: "auth",
            name: "Meta Access Token",
            status: missingPermissions.length > 0 ? "warning" : "success",
            summary: missingPermissions.length > 0
              ? `Token is valid but missing permissions: ${missingPermissions.join(", ")}`
              : `Token is valid & verified with Meta. (${expiresFormatted})`,
            details: {
              appId: d.app_id,
              application: d.application,
              type: d.type,
              expires: expiresFormatted,
              scopes: scopes,
              hasCatalogManagement: hasCatalog,
            },
            recommendation: missingPermissions.length > 0
              ? "Re-generate the token in Meta Business Suite adding the missing permissions."
              : undefined,
          });
        } else {
          // Fallback check via /me
          const meRes = await fetch(`https://graph.facebook.com/v21.0/me?access_token=${token}`, {
            cache: "no-store",
          });
          const meData = await meRes.json();
          if (meRes.ok && meData.id) {
            checks.push({
              id: "meta_token",
              category: "auth",
              name: "Meta Access Token",
              status: "success",
              summary: `Token verified successfully with Meta (User / App ID: ${meData.id}, Name: ${meData.name || "System User"}).`,
              details: { id: meData.id, name: meData.name },
            });
          } else {
            checks.push({
              id: "meta_token",
              category: "auth",
              name: "Meta Access Token",
              status: "error",
              summary: debugData?.error?.message || meData?.error?.message || "Invalid or expired Meta Access Token.",
              recommendation: "Generate a new permanent token in Meta Business Manager and update settings.",
              actionUrl: "https://business.facebook.com/settings/system-users",
              actionText: "Meta System Users",
            });
          }
        }
      } catch (err: any) {
        checks.push({
          id: "meta_token",
          category: "auth",
          name: "Meta Access Token",
          status: "error",
          summary: `Network error verifying token: ${err?.message}`,
        });
      }
    }

    // 3. WhatsApp Phone Number Check
    if (!phoneId) {
      checks.push({
        id: "phone_number",
        category: "phone",
        name: "WhatsApp Phone Number",
        status: "error",
        summary: "Phone Number ID is missing in configuration.",
        recommendation: "Use the 1-Click Auto Setup to auto-detect your WhatsApp phone number, or paste your Phone Number ID in Manual Settings.",
      });
    } else if (token && !token.startsWith("EAA...")) {
      try {
        const phoneRes = await fetch(
          `https://graph.facebook.com/v21.0/${phoneId}?fields=id,display_phone_number,verified_name,quality_rating,code_verification_status,messaging_limit_tier`,
          {
            headers: { Authorization: `Bearer ${token}` },
            cache: "no-store",
          }
        );
        const phoneData = await phoneRes.json();

        if (phoneRes.ok && phoneData.id) {
          const isVerified = phoneData.code_verification_status === "VERIFIED";
          const quality = phoneData.quality_rating || "UNKNOWN";
          const tier = phoneData.messaging_limit_tier || "TIER_250";

          checks.push({
            id: "phone_number",
            category: "phone",
            name: "WhatsApp Phone Number",
            status: quality === "RED" ? "warning" : "success",
            summary: `${phoneData.display_phone_number} (${phoneData.verified_name || "WhatsApp Business"})`,
            details: {
              phoneId: phoneData.id,
              displayNumber: phoneData.display_phone_number,
              verifiedName: phoneData.verified_name,
              qualityRating: quality,
              messagingTier: tier,
              verificationStatus: phoneData.code_verification_status,
            },
            recommendation: quality === "RED"
              ? "Meta quality rating is low. Limit bulk messaging to protect your phone number reputation."
              : undefined,
          });
        } else {
          checks.push({
            id: "phone_number",
            category: "phone",
            name: "WhatsApp Phone Number",
            status: "error",
            summary: phoneData?.error?.message || `Could not find phone number with ID ${phoneId} on Meta.`,
            recommendation: "Verify your Phone Number ID in WhatsApp Manager > API Setup.",
          });
        }
      } catch (err: any) {
        checks.push({
          id: "phone_number",
          category: "phone",
          name: "WhatsApp Phone Number",
          status: "error",
          summary: `Network error verifying phone number: ${err?.message}`,
        });
      }
    }

    // 4. WhatsApp Business Account (WABA) Check
    if (!wabaId) {
      checks.push({
        id: "waba_account",
        category: "waba",
        name: "WhatsApp Business Account (WABA)",
        status: "warning",
        summary: "WABA ID is not configured. Some advanced catalog and template features may require it.",
        recommendation: "Provide your WABA ID from WhatsApp Manager.",
      });
    } else if (token && !token.startsWith("EAA...")) {
      try {
        const wabaRes = await fetch(
          `https://graph.facebook.com/v21.0/${wabaId}?fields=id,name,currency,timezone_id,message_template_namespace`,
          {
            headers: { Authorization: `Bearer ${token}` },
            cache: "no-store",
          }
        );
        const wabaData = await wabaRes.json();

        if (wabaRes.ok && wabaData.id) {
          checks.push({
            id: "waba_account",
            category: "waba",
            name: "WhatsApp Business Account (WABA)",
            status: "success",
            summary: `WABA ID ${wabaData.id} (${wabaData.name || "Active WABA"}) is linked & verified.`,
            details: {
              wabaId: wabaData.id,
              name: wabaData.name,
              currency: wabaData.currency,
              timezone: wabaData.timezone_id,
              templateNamespace: wabaData.message_template_namespace,
            },
          });
        } else {
          checks.push({
            id: "waba_account",
            category: "waba",
            name: "WhatsApp Business Account (WABA)",
            status: "warning",
            summary: wabaData?.error?.message || `Could not verify WABA ID ${wabaId} on Meta.`,
            recommendation: "Ensure your System User has access to this WABA in Meta Business Settings.",
          });
        }
      } catch (err: any) {
        checks.push({
          id: "waba_account",
          category: "waba",
          name: "WhatsApp Business Account (WABA)",
          status: "warning",
          summary: `Could not verify WABA: ${err?.message}`,
        });
      }
    }

    // 5. WhatsApp Business Profile Check
    if (phoneId && token && !token.startsWith("EAA...")) {
      try {
        const profileRes = await fetch(
          `https://graph.facebook.com/v21.0/${phoneId}/whatsapp_business_profile?fields=about,address,description,email,profile_picture_url,websites,vertical`,
          {
            headers: { Authorization: `Bearer ${token}` },
            cache: "no-store",
          }
        );
        const profileData = await profileRes.json();
        const p = profileData?.data?.[0];

        if (profileRes.ok && p) {
          checks.push({
            id: "business_profile",
            category: "profile",
            name: "WhatsApp Public Business Profile",
            status: "success",
            summary: `Profile active on WhatsApp (${p.vertical || "TECH"}). Email: ${p.email || "Set"}, About: ${p.about ? `"${p.about.slice(0, 30)}..."` : "Set"}`,
            details: {
              email: p.email,
              vertical: p.vertical,
              about: p.about,
              websites: p.websites,
              hasProfilePic: !!p.profile_picture_url,
            },
          });
        } else {
          checks.push({
            id: "business_profile",
            category: "profile",
            name: "WhatsApp Public Business Profile",
            status: "warning",
            summary: "Profile details not configured or not yet published on WhatsApp.",
            recommendation: "Update your Business Profile in the settings page to establish credibility with customers.",
          });
        }
      } catch (err) {
        // Ignored
      }
    }

    // 6. Webhook & Subscribed Apps Check
    const envVerifyToken = process.env.META_VERIFY_TOKEN || "";
    const activeVerifyToken = config?.verify_token || envVerifyToken || "zynex_meta_webhook_secret_2026";
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://wappx.zynexdev.com";
    const webhookEndpoint = `${appUrl}/api/webhook`;

    let isWabaSubscribed = false;
    let subscriptionNotice = "";

    if (wabaId && token && !token.startsWith("EAA...")) {
      try {
        const subRes = await fetch(
          `https://graph.facebook.com/v21.0/${wabaId}/subscribed_apps`,
          {
            headers: { Authorization: `Bearer ${token}` },
            cache: "no-store",
          }
        );
        const subData = await subRes.json();
        if (subRes.ok && Array.isArray(subData?.data) && subData.data.length > 0) {
          isWabaSubscribed = true;
          subscriptionNotice = `WABA is actively subscribed to ${subData.data.length} Meta App(s).`;
        } else {
          subscriptionNotice = "WABA has not yet subscribed to app webhooks.";
        }
      } catch (err: any) {
        subscriptionNotice = `Could not probe subscribed_apps: ${err?.message}`;
      }
    }

    checks.push({
      id: "webhook_status",
      category: "webhook",
      name: "Webhook & Event Listener",
      status: isWabaSubscribed ? "success" : "warning",
      summary: isWabaSubscribed
        ? `Webhook endpoint live at ${webhookEndpoint}. ${subscriptionNotice}`
        : `Webhook configured. Verify URL: ${webhookEndpoint}. ${subscriptionNotice}`,
      details: {
        webhookUrl: webhookEndpoint,
        verifyTokenSet: !!activeVerifyToken,
        isWabaSubscribed,
      },
      recommendation: !isWabaSubscribed
        ? "Go to Meta Developer Dashboard > WhatsApp > Configuration > Webhook, and click 'Subscribe to this object' for 'messages'."
        : undefined,
      actionUrl: "https://developers.facebook.com/apps",
      actionText: "Meta Developer Dashboard",
    });

    // 7. Meta Commerce Catalog Check
    try {
      const { data: dbCatalogs } = await supabaseAdmin
        .from("catalogs")
        .select("id, name, catalog_id, items")
        .eq("client_id", clientId);

      let metaConnectedCatalogs: any[] = [];
      if (wabaId && token && !token.startsWith("EAA...")) {
        try {
          const catRes = await fetch(
            `https://graph.facebook.com/v21.0/${wabaId}/product_catalogs`,
            {
              headers: { Authorization: `Bearer ${token}` },
              cache: "no-store",
            }
          );
          const catData = await catRes.json();
          if (catRes.ok && Array.isArray(catData?.data)) {
            metaConnectedCatalogs = catData.data;
          }
        } catch (e) {}
      }

      const totalItems = (dbCatalogs || []).reduce((acc: number, c: any) => acc + (c.items?.length || 0), 0);
      const hasMetaCatalog = metaConnectedCatalogs.length > 0 || (dbCatalogs || []).some((c: any) => c.catalog_id && /^\d+$/.test(c.catalog_id));

      checks.push({
        id: "catalog_status",
        category: "catalog",
        name: "WhatsApp Commerce Catalog",
        status: hasMetaCatalog ? "success" : "warning",
        summary: hasMetaCatalog
          ? `Official Meta Catalog connected (${metaConnectedCatalogs.length} on WABA, ${dbCatalogs?.length || 0} local, ${totalItems} products).`
          : `No official Meta Catalog linked yet (${dbCatalogs?.length || 0} local catalogs, ${totalItems} products). Hybrid showcase active.`,
        details: {
          wabaConnectedCatalogs: metaConnectedCatalogs,
          localCatalogsCount: dbCatalogs?.length || 0,
          totalProductsCount: totalItems,
        },
        recommendation: !hasMetaCatalog
          ? "Connect a Meta Catalog ID in the Catalog Manager to unlock native in-app shopping cart features."
          : undefined,
      });
    } catch (err: any) {
      checks.push({
        id: "catalog_status",
        category: "catalog",
        name: "WhatsApp Commerce Catalog",
        status: "warning",
        summary: `Could not verify catalog status: ${err?.message}`,
      });
    }

    // Calculate score
    const totalChecks = checks.length;
    const passedChecks = checks.filter((c) => c.status === "success").length;
    const hasErrors = checks.some((c) => c.status === "error");
    const scorePercentage = Math.round((passedChecks / totalChecks) * 100);

    const overallStatus: "healthy" | "partial" | "critical" =
      hasErrors
        ? "critical"
        : scorePercentage >= 80
        ? "healthy"
        : "partial";

    const response: DiagnosticsResponse = {
      timestamp: new Date().toISOString(),
      overallStatus,
      scorePercentage,
      totalChecks,
      passedChecks,
      checks,
      environment: {
        appUrl,
        hasVerifyToken: !!activeVerifyToken,
        hasSupabase: !!config,
      },
    };

    return NextResponse.json(response);
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Internal diagnostics error" },
      { status: 500 }
    );
  }
}
