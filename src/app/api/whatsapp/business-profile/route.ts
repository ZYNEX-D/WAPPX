import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";

// Official Meta WhatsApp Business API vertical allowed values:
// {OTHER, AUTO, BEAUTY, APPAREL, EDU, ENTERTAIN, EVENT_PLAN, FINANCE, GROCERY, GOVT, HOTEL, HEALTH, NONPROFIT, PROF_SERVICES, RETAIL, TRAVEL, RESTAURANT, ALCOHOL}
const META_VERTICAL_MAP: Record<string, string> = {
  TECH: "PROF_SERVICES",
  SERVICES: "PROF_SERVICES",
  PROF_SERVICES: "PROF_SERVICES",
  RETAIL: "RETAIL",
  FINANCE: "FINANCE",
  HEALTHCARE: "HEALTH",
  HEALTH: "HEALTH",
  EDUCATION: "EDU",
  EDU: "EDU",
  HOSPITALITY: "HOTEL",
  HOTEL: "HOTEL",
  OTHER: "OTHER",
};

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId") || "client-1";

    // 1. Fetch from Supabase
    const { data: config } = await supabaseAdmin
      .from("meta_config")
      .select("*")
      .or(`id.eq.${userId},user_id.eq.${userId}`)
      .limit(1)
      .maybeSingle();

    let metaProfilePic: string | null = null;

    // 2. If connected to live Meta API, also check live profile from Meta
    if (
      config &&
      config.phone_number_id &&
      config.access_token &&
      !config.access_token.startsWith("EAA...")
    ) {
      try {
        const metaRes = await fetch(
          `https://graph.facebook.com/v21.0/${config.phone_number_id}/whatsapp_business_profile?fields=about,address,description,email,profile_picture_url,websites,vertical`,
          {
            headers: { Authorization: `Bearer ${config.access_token}` },
            cache: "no-store",
          }
        );
        if (metaRes.ok) {
          const metaJson = await metaRes.json();
          const p = metaJson?.data?.[0];
          if (p?.profile_picture_url) {
            metaProfilePic = p.profile_picture_url;
          }
        }
      } catch (e) {
        // Meta fetch fallback
      }
    }

    return NextResponse.json({
      success: true,
      profile: {
        businessName: config?.business_name || "W A P P X",
        businessCategory: config?.business_category || "TECH",
        aboutText:
          config?.about_text || "Merge your ideas with our Digital Creativity",
        businessEmail: config?.business_email || "support@zynexdev.lk",
        businessWebsite:
          config?.business_website || "https://wappx.zynexdev.com",
        businessAddress: config?.business_address || "Colombo, Sri Lanka",
        profileImage:
          metaProfilePic || config?.profile_image || "/icon.png",
        autoCutoffEnabled:
          typeof config?.auto_cutoff_enabled === "boolean"
            ? config.auto_cutoff_enabled
            : true,
        cutoffThreshold: config?.cutoff_threshold || 95,
      },
    });
  } catch (error) {
    return NextResponse.json({
      success: true,
      profile: {
        businessName: "W A P P X",
        businessCategory: "TECH",
        aboutText: "Merge your ideas with our Digital Creativity",
        businessEmail: "support@zynexdev.lk",
        businessWebsite: "https://wappx.zynexdev.com",
        businessAddress: "Colombo, Sri Lanka",
        profileImage: "/icon.png",
        autoCutoffEnabled: true,
        cutoffThreshold: 95,
      },
    });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      userId = "client-1",
      businessName,
      businessCategory = "TECH",
      aboutText,
      businessEmail,
      businessWebsite,
      businessAddress,
      profileImage,
      autoCutoffEnabled = true,
      cutoffThreshold = 95,
    } = body;

    let metaSynced = false;
    let metaPhotoSynced = false;
    let metaError: string | null = null;

    // 1. Fetch current meta config
    const { data: config } = await supabaseAdmin
      .from("meta_config")
      .select("*")
      .or(`id.eq.${userId},user_id.eq.${userId}`)
      .limit(1)
      .maybeSingle();

    const targetId = config?.id || userId;
    const metaVertical =
      META_VERTICAL_MAP[businessCategory.toUpperCase()] || "PROF_SERVICES";

    // 2. Sync to Meta Cloud API if live credentials exist
    if (
      config &&
      config.phone_number_id &&
      config.access_token &&
      !config.access_token.startsWith("EAA...")
    ) {
      try {
        // Sync Business Profile Details
        const metaRes = await fetch(
          `https://graph.facebook.com/v21.0/${config.phone_number_id}/whatsapp_business_profile`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${config.access_token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              messaging_product: "whatsapp",
              about: aboutText || "Merge your ideas with our Digital Creativity",
              address: businessAddress || "Colombo, Sri Lanka",
              description:
                aboutText || "Merge your ideas with our Digital Creativity",
              email: businessEmail || "support@zynexdev.lk",
              vertical: metaVertical,
              websites: businessWebsite
                ? [businessWebsite]
                : ["https://wappx.zynexdev.com"],
            }),
          }
        );

        const metaData = await metaRes.json();
        if (metaRes.ok && metaData.success) {
          metaSynced = true;
        } else {
          metaError =
            metaData?.error?.message || "Meta API rejected profile update";
        }

        // Sync Profile Picture to Meta if uploaded (data URL or base64)
        if (profileImage && profileImage.startsWith("data:image/")) {
          try {
            const matches = profileImage.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
            if (matches && matches.length === 3) {
              const mimeType = matches[1];
              const imgBuffer = Buffer.from(matches[2], "base64");
              const appId = "1738152774148921";

              // Step A: Init resumable upload session on Meta
              const initRes = await fetch(
                `https://graph.facebook.com/v21.0/${appId}/uploads?file_length=${imgBuffer.length}&file_type=${mimeType}`,
                {
                  method: "POST",
                  headers: { Authorization: `Bearer ${config.access_token}` },
                }
              );
              const initData = await initRes.json();

              if (initData?.id) {
                // Step B: Send file buffer
                const uploadRes = await fetch(
                  `https://graph.facebook.com/v21.0/${initData.id}`,
                  {
                    method: "POST",
                    headers: {
                      Authorization: `OAuth ${config.access_token}`,
                      file_offset: "0",
                    },
                    body: imgBuffer,
                  }
                );
                const uploadData = await uploadRes.json();

                if (uploadData?.h) {
                  // Step C: Attach photo handle to WhatsApp profile
                  const picRes = await fetch(
                    `https://graph.facebook.com/v21.0/${config.phone_number_id}/whatsapp_business_profile`,
                    {
                      method: "POST",
                      headers: {
                        Authorization: `Bearer ${config.access_token}`,
                        "Content-Type": "application/json",
                      },
                      body: JSON.stringify({
                        messaging_product: "whatsapp",
                        profile_picture_handle: uploadData.h,
                      }),
                    }
                  );
                  const picData = await picRes.json();
                  if (picRes.ok && picData?.success) {
                    metaPhotoSynced = true;
                  }
                }
              }
            }
          } catch (e) {
            console.warn("Meta Photo Upload error:", e);
          }
        }
      } catch (e) {
        metaError = e instanceof Error ? e.message : "Meta API connection error";
      }
    }

    // 3. Persist ALL fields to Supabase PostgreSQL database
    const updatePayload: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };
    if (businessName) updatePayload.business_name = businessName;
    if (businessCategory) updatePayload.business_category = businessCategory;
    if (aboutText) updatePayload.about_text = aboutText;
    if (businessEmail) updatePayload.business_email = businessEmail;
    if (businessWebsite) updatePayload.business_website = businessWebsite;
    if (businessAddress) updatePayload.business_address = businessAddress;
    if (profileImage) updatePayload.profile_image = profileImage;
    if (typeof autoCutoffEnabled === "boolean")
      updatePayload.auto_cutoff_enabled = autoCutoffEnabled;
    if (typeof cutoffThreshold === "number")
      updatePayload.cutoff_threshold = cutoffThreshold;

    await supabaseAdmin
      .from("meta_config")
      .update(updatePayload as any)
      .eq("id", targetId);

    // Also update client business_name and email in clients table
    if (businessName || businessEmail) {
      await supabaseAdmin
        .from("clients")
        .update({
          business_name: businessName,
          email: businessEmail,
          updated_at: new Date().toISOString(),
        })
        .eq("id", targetId);
    }

    return NextResponse.json({
      success: true,
      metaSynced,
      metaPhotoSynced,
      metaError,
      profile: {
        businessName,
        businessCategory,
        aboutText,
        businessEmail,
        businessWebsite,
        businessAddress,
        profileImage,
        autoCutoffEnabled,
        cutoffThreshold,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to save profile" },
      { status: 500 }
    );
  }
}
