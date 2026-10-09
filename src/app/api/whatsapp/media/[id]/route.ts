import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "Missing media ID" }, { status: 400 });
    }

    // Fetch Meta config for access token
    const { data: config } = await supabaseAdmin
      .from("meta_config")
      .select("access_token")
      .neq("access_token", "")
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const token = config?.access_token || process.env.META_ACCESS_TOKEN;
    if (!token) {
      return NextResponse.json({ error: "No Meta access token configured" }, { status: 500 });
    }

    // Step 1: Retrieve media metadata from Meta Graph API
    const metaRes = await fetch(`https://graph.facebook.com/v21.0/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!metaRes.ok) {
      const errText = await metaRes.text();
      console.error("[Media Proxy] Failed to get media info:", metaRes.status, errText);
      return NextResponse.json({ error: "Failed to resolve media metadata" }, { status: metaRes.status });
    }

    const metaData = await metaRes.json();
    const downloadUrl = metaData.url;
    const mimeType = metaData.mime_type || "application/octet-stream";

    if (!downloadUrl) {
      return NextResponse.json({ error: "No download URL returned by Meta" }, { status: 404 });
    }

    // Step 2: Download the binary file using the authenticated token
    const binaryRes = await fetch(downloadUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
        "User-Agent": "ZYNEX-WAPPX-Client",
      },
    });

    if (!binaryRes.ok) {
      const errText = await binaryRes.text();
      console.error("[Media Proxy] Failed to download media binary:", binaryRes.status, errText);
      return NextResponse.json({ error: "Failed to download media binary" }, { status: binaryRes.status });
    }

    const arrayBuffer = await binaryRes.arrayBuffer();

    return new NextResponse(arrayBuffer, {
      status: 200,
      headers: {
        "Content-Type": mimeType,
        "Cache-Control": "public, max-age=604800, immutable",
      },
    });
  } catch (error) {
    console.error("[Media Proxy] Unexpected exception:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
