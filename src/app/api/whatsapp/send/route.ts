import { NextRequest, NextResponse } from "next/server";
import {
  sendMetaTextMessage,
  sendMetaInteractiveButtons,
  sendMetaImageMessage,
  sendMetaDocumentMessage,
  sendMetaCatalogOrShowcase,
  sendMessengerOrInstagramTextMessage,
  sendMessengerOrInstagramQuickReplies,
  sendMessengerOrInstagramImage,
} from "@/lib/meta-client";
import { supabaseAdmin } from "@/lib/supabase/server";
import { CatalogPayload, ChannelType } from "@/types/whatsapp";

export async function POST(req: NextRequest) {
  try {
    const {
      phoneNumberId: inputPhoneId,
      accessToken: inputToken,
      recipientPhone,
      recipientId,
      channel = "whatsapp",
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
      recipientId?: string;
      channel?: ChannelType;
      text?: string;
      buttons?: { id: string; title: string }[];
      catalog?: CatalogPayload;
      mediaUrl?: string;
      mediaType?: "image" | "audio" | "document";
      contactId?: string;
      messageId?: string;
      userId?: string;
    } = await req.json();

    const targetRecipient = recipientPhone || recipientId;

    if (!targetRecipient) {
      return NextResponse.json({ error: "recipientPhone or recipientId is required" }, { status: 400 });
    }

    // 1. Resolve active Meta credentials (from payload or fallback to meta_config table)
    let phoneNumberId = inputPhoneId;
    let accessToken = inputToken;
    let pageAccessToken: string | undefined = undefined;

    const { data: cfg } = await supabaseAdmin
      .from("meta_config")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (cfg) {
      if (!phoneNumberId || !accessToken || accessToken.startsWith("EAA...")) {
        phoneNumberId = cfg.phone_number_id;
        accessToken = cfg.access_token;
      }
      pageAccessToken = cfg.page_access_token || cfg.access_token;
    } else {
      const { data: defaultCfg } = await supabaseAdmin
        .from("meta_config")
        .select("*")
        .eq("id", "default")
        .maybeSingle();
      if (defaultCfg) {
        if (!phoneNumberId || !accessToken || accessToken.startsWith("EAA...")) {
          phoneNumberId = defaultCfg.phone_number_id;
          accessToken = defaultCfg.access_token;
        }
        pageAccessToken = defaultCfg.page_access_token || defaultCfg.access_token;
      }
    }

    let metaResult: { success: boolean; data?: any; error?: string; mode?: string } = {
      success: true,
      data: undefined,
    };

    // 2. Dispatch according to channel
    const isSocialChannel = channel === "messenger" || channel === "instagram";
    const activeSocialToken = pageAccessToken || accessToken;
    const hasValidCreds = isSocialChannel
      ? Boolean(activeSocialToken && !activeSocialToken.startsWith("EAA..."))
      : Boolean(phoneNumberId && accessToken && !accessToken.startsWith("EAA..."));

    if (isSocialChannel) {
      if (hasValidCreds) {
        if (mediaUrl && mediaType === "image") {
          metaResult = await sendMessengerOrInstagramImage({
            pageAccessToken: activeSocialToken!,
            recipientId: targetRecipient,
            imageUrl: mediaUrl,
          });
        } else if (buttons && buttons.length > 0) {
          metaResult = await sendMessengerOrInstagramQuickReplies({
            pageAccessToken: activeSocialToken!,
            recipientId: targetRecipient,
            text,
            buttons,
          });
        } else {
          metaResult = await sendMessengerOrInstagramTextMessage({
            pageAccessToken: activeSocialToken!,
            recipientId: targetRecipient,
            text,
          });
        }
      }
    } else {
      // Default: WhatsApp Cloud API
      if (hasValidCreds) {
        if (catalog) {
          metaResult = await sendMetaCatalogOrShowcase({
            phoneNumberId: phoneNumberId!,
            accessToken: accessToken!,
            recipientPhone: targetRecipient,
            catalog,
            fallbackText: text,
          });
        } else if (mediaUrl && mediaType === "image") {
          metaResult = await sendMetaImageMessage({
            phoneNumberId: phoneNumberId!,
            accessToken: accessToken!,
            recipientPhone: targetRecipient,
            imageUrl: mediaUrl,
            caption: text,
          });
        } else if (mediaUrl && mediaType === "document") {
          metaResult = await sendMetaDocumentMessage({
            phoneNumberId: phoneNumberId!,
            accessToken: accessToken!,
            recipientPhone: targetRecipient,
            documentUrl: mediaUrl,
            caption: text,
          });
        } else if (buttons && buttons.length > 0) {
          metaResult = await sendMetaInteractiveButtons({
            phoneNumberId: phoneNumberId!,
            accessToken: accessToken!,
            recipientPhone: targetRecipient,
            bodyText: text,
            buttons,
          });
        } else {
          metaResult = await sendMetaTextMessage({
            phoneNumberId: phoneNumberId!,
            accessToken: accessToken!,
            recipientPhone: targetRecipient,
            text,
          });
        }
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
        channel,
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

