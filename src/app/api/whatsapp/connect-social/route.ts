import { NextRequest, NextResponse } from "next/server";
import { subscribePageToApp } from "@/lib/meta-client";
import { supabaseAdmin } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const {
      pageId,
      pageName,
      pageAccessToken,
      instagramAccountId,
      instagramUsername,
      userId = "client-1",
    } = await req.json();

    if (!pageId || !pageAccessToken) {
      return NextResponse.json(
        { error: "pageId and pageAccessToken are required" },
        { status: 400 }
      );
    }

    // 1. Auto-subscribe the Facebook Page & linked Instagram account to this Meta App's webhooks
    const subResult = await subscribePageToApp({ pageId, pageAccessToken });

    // 2. Persist configuration in Supabase meta_config
    const { data: existingCfg } = await supabaseAdmin
      .from("meta_config")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    const configId = existingCfg?.id || userId;

    const { error: dbError } = await supabaseAdmin.from("meta_config").upsert({
      id: configId,
      user_id: userId,
      facebook_page_id: pageId,
      facebook_page_name: pageName || "",
      page_access_token: pageAccessToken,
      is_messenger_connected: true,
      instagram_account_id: instagramAccountId || "",
      instagram_username: instagramUsername || "",
      is_instagram_connected: Boolean(instagramAccountId),
      updated_at: new Date().toISOString(),
    });

    if (dbError) {
      console.error("[Connect-Social] Database update error:", dbError);
    }

    return NextResponse.json({
      success: true,
      webhookSubscribed: subResult.success,
      webhookError: subResult.error,
      message: `Connected ${pageName || "Facebook Page"}${
        instagramUsername ? ` and Instagram (@${instagramUsername})` : ""
      }! Webhook subscribed automatically.`,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Social connection failed" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const userId = searchParams.get("userId") || "client-1";

    const { data: cfg } = await supabaseAdmin
      .from("meta_config")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (!cfg || !cfg.facebook_page_id || !cfg.page_access_token) {
      return NextResponse.json({
        configured: false,
        message: "No Facebook Page configured yet.",
      });
    }

    // Query Meta Graph API for subscribed apps on this page
    const res = await fetch(
      `https://graph.facebook.com/v21.0/${cfg.facebook_page_id}/subscribed_apps`,
      {
        headers: {
          Authorization: `Bearer ${cfg.page_access_token}`,
        },
      }
    );

    const data = await res.json();
    const appsList = Array.isArray(data?.data) ? data.data : [];
    const isSubscribed = appsList.some(
      (app: any) =>
        app.subscribed_fields?.includes("messages") ||
        app.id === "1410476257886677"
    );

    return NextResponse.json({
      configured: true,
      pageId: cfg.facebook_page_id,
      pageName: cfg.facebook_page_name,
      instagramAccountId: cfg.instagram_account_id,
      instagramUsername: cfg.instagram_username,
      isSubscribed,
      subscribedApps: appsList,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to check status" },
      { status: 500 }
    );
  }
}

