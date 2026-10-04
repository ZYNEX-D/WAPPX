import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://cnttyvtpdmbbtdkkpjxn.supabase.co";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const userId = (formData.get("userId") as string) || "shared";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Determine type
    const mimeType = file.type;
    let mediaType: "image" | "audio" | "document" = "document";
    if (mimeType.startsWith("image/")) mediaType = "image";
    else if (mimeType.startsWith("audio/")) mediaType = "audio";

    const ext = file.name.split(".").pop() || "bin";
    const fileName = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const bucket = "media-uploads";

    // Use service role key for server-side uploads
    const adminClient = createClient(supabaseUrl, supabaseServiceKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "");

    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    let { error: uploadError } = await adminClient.storage
      .from(bucket)
      .upload(fileName, buffer, {
        contentType: mimeType,
        upsert: false,
      });

    // If bucket doesn't exist, auto-create it with public access and retry
    if (uploadError && uploadError.message?.toLowerCase().includes("bucket not found")) {
      console.log(`[Upload] Bucket "${bucket}" not found. Creating public bucket...`);
      await adminClient.storage.createBucket(bucket, {
        public: true,
        fileSizeLimit: 52428800, // 50 MB
      });

      const retryRes = await adminClient.storage
        .from(bucket)
        .upload(fileName, buffer, {
          contentType: mimeType,
          upsert: false,
        });
      uploadError = retryRes.error;
    }

    if (uploadError) {
      console.error("[Upload] Supabase storage error:", uploadError);
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    const { data: publicUrlData } = adminClient.storage
      .from(bucket)
      .getPublicUrl(fileName);

    return NextResponse.json({
      success: true,
      url: publicUrlData.publicUrl,
      mediaType,
      fileName: file.name,
      size: file.size,
      mimeType,
    });
  } catch (err) {
    console.error("[Upload] Unhandled error:", err);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
