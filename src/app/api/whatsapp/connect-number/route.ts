import { NextRequest, NextResponse } from "next/server";
import { subscribeWabaToApp, getPhoneNumberHealth } from "@/lib/meta-client";
import { supabaseAdmin } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const { wabaId, phoneNumberId, accessToken } = await req.json();

    if (!wabaId || !phoneNumberId || !accessToken) {
      return NextResponse.json(
        { error: "wabaId, phoneNumberId, and accessToken are all required" },
        { status: 400 }
      );
    }

    // 1. Auto-subscribe Meta Webhook to this WABA via Graph API
    const subResult = await subscribeWabaToApp({ wabaId, accessToken });
    const webhookSubscribed = subResult.success;

    // 2. Fetch Phone details (Display name, Quality rating, Tier)
    const healthResult = await getPhoneNumberHealth({ phoneNumberId, accessToken });
    const phoneDetails = healthResult.success ? healthResult.data : null;

    // 3. Save into Supabase meta_config
    const { error: dbError } = await supabaseAdmin.from("meta_config").upsert({
      id: "default",
      phone_number_id: phoneNumberId,
      waba_id: wabaId,
      access_token: accessToken,
      is_connected: true,
      updated_at: new Date().toISOString(),
    });

    if (dbError) {
      console.error("Failed to update meta_config in Supabase:", dbError);
    }

    return NextResponse.json({
      success: true,
      webhookSubscribed,
      phoneDetails,
      message: "WhatsApp number connected and configured automatically!",
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Connection failed" },
      { status: 500 }
    );
  }
}
