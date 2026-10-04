import { NextRequest, NextResponse } from "next/server";
import {
  sendMetaTextMessage,
  sendMetaInteractiveButtons,
  sendMetaImageMessage,
  sendMetaDocumentMessage,
  sendMetaCatalogOrShowcase,
} from "@/lib/meta-client";
import { supabaseAdmin } from "@/lib/supabase/server";
import { CatalogPayload } from "@/types/whatsapp";

export async function POST(req: NextRequest) {
  try {
    const {
      phoneNumberId: inputPhoneId,
      accessToken: inputToken,
      recipientPhone,
      text = "",
      buttons,
      catalog,
      mediaUrl,
      mediaType,
      contactId,
      messageId,
      userId = "client-1",
    }: {
      phoneNumberId?: string;
      accessToken?: string;
      recipientPhone?: string;
      text?: string;
      buttons?: { id: string; title: string }[];
      catalog?: CatalogPayload;
      mediaUrl?: string;
      mediaType?: "image" | "audio" | "document";
      contactId?: string;
      messageId?: string;
      userId?: string;
    } = await req.json();

    if (!recipientPhone) {
      return NextResponse.json({ error: "recipientPhone is required" }, { status: 400 });
    }

    // 1. Resolve active Meta credentials (from payload or fallback to meta_config table)
    let phoneNumberId = inputPhoneId;
    let accessToken = inputToken;

    if (!phoneNumberId || !accessToken || accessToken.startsWith("EAA...")) {
      const { data: cfg } = await supabaseAdmin
        .from("meta_config")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (cfg && cfg.access_token && cfg.phone_number_id) {
        phoneNumberId = cfg.phone_number_id;
        accessToken = cfg.access_token;
      } else {
        const { data: defaultCfg } = await supabaseAdmin
          .from("meta_config")
          .select("*")
          .eq("id", "default")
          .maybeSingle();
        if (defaultCfg && defaultCfg.access_token && defaultCfg.phone_number_id) {
          phoneNumberId = defaultCfg.phone_number_id;
          accessToken = defaultCfg.access_token;
        }
      }
    }

    let metaResult: { success: boolean; data?: any; error?: string; mode?: string } = {
      success: true,
      data: undefined,
    };

    // 2. Dispatch to Meta Cloud API if valid credentials exist
    const hasValidCreds = Boolean(
      phoneNumberId && accessToken && !accessToken.startsWith("EAA...")
    );

    if (hasValidCreds) {
      if (catalog) {
        metaResult = await sendMetaCatalogOrShowcase({
          phoneNumberId: phoneNumberId!,
          accessToken: accessToken!,
          recipientPhone,
          catalog,
          fallbackText: text,
        });
      } else if (mediaUrl && mediaType === "image") {
        metaResult = await sendMetaImageMessage({
          phoneNumberId: phoneNumberId!,
          accessToken: accessToken!,
          recipientPhone,
          imageUrl: mediaUrl,
          caption: text,
        });
      } else if (mediaUrl && mediaType === "document") {
        metaResult = await sendMetaDocumentMessage({
          phoneNumberId: phoneNumberId!,
          accessToken: accessToken!,
          recipientPhone,
          documentUrl: mediaUrl,
          caption: text,
        });
      } else if (buttons && buttons.length > 0) {
        metaResult = await sendMetaInteractiveButtons({
          phoneNumberId: phoneNumberId!,
          accessToken: accessToken!,
          recipientPhone,
          bodyText: text,
          buttons,
        });
      } else {
        metaResult = await sendMetaTextMessage({
          phoneNumberId: phoneNumberId!,
          accessToken: accessToken!,
          recipientPhone,
          text,
        });
      }
    }

    // 3. Persist or update message status in Supabase
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

    if (messageId) {
      // Update existing message status
      await supabaseAdmin
        .from("messages")
        .update({
          status: metaResult.success ? "delivered" : "failed",
        })
        .eq("id", messageId);
    } else if (contactId) {
      // Create new message record
      await supabaseAdmin.from("messages").insert({
        id: `msg-${Date.now()}`,
        contact_id: contactId,
        user_id: userId,
        sender: "agent",
        sender_name: "Agent",
        text,
        timestamp: timeStr,
        status: metaResult.success ? "delivered" : "failed",
        buttons: buttons ? (buttons as any) : null,
        catalog: catalog ? (catalog as any) : null,
        media_url: mediaUrl || null,
        media_type: mediaType || null,
        is_internal_note: false,
      });
    }

    if (contactId) {
      const snippet = catalog
        ? `🛍️ ${catalog.catalogName || "WhatsApp Catalog"}`
        : text || "Sent attachment";

      await supabaseAdmin
        .from("contacts")
        .update({
          last_message_snippet: snippet,
          last_message_time: timeStr,
          updated_at: new Date().toISOString(),
        })
        .eq("id", contactId);
    }

    return NextResponse.json({
      success: metaResult.success,
      data: metaResult.data,
      mode: metaResult.mode,
      error: metaResult.error,
      simulation: !hasValidCreds,
    });
  } catch (error) {
    console.error("[WhatsApp Send Route] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to process request" },
      { status: 500 }
    );
  }
}

