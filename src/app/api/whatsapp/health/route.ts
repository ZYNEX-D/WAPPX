import { NextRequest, NextResponse } from "next/server";
import { getPhoneNumberHealth } from "@/lib/meta-client";
import { supabaseAdmin } from "@/lib/supabase/server";

export async function GET() {
  try {
    const { data: config } = await supabaseAdmin
      .from("meta_config")
      .select("*")
      .eq("id", "default")
      .maybeSingle();

    if (!config || !config.phone_number_id || !config.access_token || config.access_token.startsWith("EAA...")) {
      return NextResponse.json({
        configured: false,
        status: "unconfigured",
      });
    }

    const health = await getPhoneNumberHealth({
      phoneNumberId: config.phone_number_id,
      accessToken: config.access_token,
    });

    return NextResponse.json({
      configured: true,
      status: health.success ? "connected" : "error",
      phoneDetails: health.success ? health.data : null,
      error: health.error,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Health check failed" },
      { status: 500 }
    );
  }
}
