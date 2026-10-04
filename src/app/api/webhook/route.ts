import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { processBotInteraction } from "@/lib/bot-engine";
import {
  sendMetaTextMessage,
  sendMetaInteractiveButtons,
  sendMetaCatalogOrShowcase,
} from "@/lib/meta-client";
import { mapContactFromRow, mapFlowNodeFromRow } from "@/lib/supabase/service";
import { FlowNode, CatalogOrder, CatalogOrderItem } from "@/types/whatsapp";

// Fallback verify token (matches the one in initial-data & .env.local)
const DEFAULT_VERIFY_TOKEN = "zynex_meta_webhook_secret_2026";

/**
 * Meta Webhook Verification (GET request by Meta Cloud API)
 * Dynamically checks against any user's unique verify_token in meta_config table!
 */
export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token) {
    // 1. Check if token matches ANY user in meta_config table
    try {
      const { data: matchedConfig } = await supabaseAdmin
        .from("meta_config")
        .select("id, user_id, verify_token")
        .eq("verify_token", token)
        .maybeSingle();

      if (matchedConfig) {
        console.log(`[Meta Webhook] Successfully verified for user/tenant: ${matchedConfig.user_id}`);
        return new NextResponse(challenge, { status: 200 });
      }
    } catch (err) {
      console.warn("[Meta Webhook] Error checking user verify_token:", err);
    }

    // 2. Fallback check against process.env.META_VERIFY_TOKEN
    const expectedToken = process.env.META_VERIFY_TOKEN || DEFAULT_VERIFY_TOKEN;
    if (token === expectedToken) {
      console.log("Meta Webhook verified via fallback environment token!");
      return new NextResponse(challenge, { status: 200 });
    }
  }

  return NextResponse.json({ error: "Verification token mismatch" }, { status: 403 });
}

/**
 * Meta Webhook Inbound Event Ingestion (POST request by Meta Cloud API)
 * Automatically routes messages to the specific user/tenant who owns the phone_number_id!
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Verify it is a WhatsApp webhook event
    if (body.object === "whatsapp_business_account") {
      const entry = body.entry?.[0];
      const change = entry?.changes?.[0]?.value;

      if (change?.messages && Array.isArray(change.messages) && change.messages.length > 0) {
        const message = change.messages[0];
        const rawFrom = message.from; // Customer's phone number without +
        const normalizedPhone = rawFrom.startsWith("+") ? rawFrom : `+${rawFrom}`;
        const messageType = message.type;
        const customerProfileName = change.contacts?.[0]?.profile?.name || `Customer (${normalizedPhone})`;
        const incomingPhoneNumberId = change.metadata?.phone_number_id;

        // 1. Locate the specific user/tenant who owns this phone_number_id!
        let targetUserId = "client-1";
        let targetConfig: any = null;

        if (incomingPhoneNumberId) {
          const { data: configs } = await supabaseAdmin
            .from("meta_config")
            .select("*")
            .eq("phone_number_id", incomingPhoneNumberId);

          if (configs && configs.length > 0) {
            // Prioritize specific client/workspace config over 'default'
            const specificConfig = configs.find((c) => c.user_id && c.user_id !== "default") || configs[0];
            targetConfig = specificConfig;
            targetUserId = specificConfig.user_id || specificConfig.id || "client-1";
          }
        }

        if (!targetConfig) {
          const { data: fallbackConfig } = await supabaseAdmin
            .from("meta_config")
            .select("*")
            .limit(1)
            .maybeSingle();
          if (fallbackConfig) {
            targetConfig = fallbackConfig;
            targetUserId = fallbackConfig.user_id || fallbackConfig.id || "client-1";
          }
        }

        let incomingText = "";
        let buttonId: string | undefined = undefined;
        let orderPayload: CatalogOrder | undefined = undefined;
        let incomingMediaUrl: string | undefined = undefined;
        let incomingMediaType: "image" | "audio" | "document" | undefined = undefined;

        if (messageType === "text") {
          incomingText = message.text?.body || "";
        } else if (messageType === "image" && message.image) {
          incomingMediaType = "image";
          incomingMediaUrl = message.image.id ? `/api/whatsapp/media/${message.image.id}` : undefined;
          incomingText = message.image.caption || "";
        } else if ((messageType === "audio" || messageType === "voice") && (message.audio || message.voice)) {
          incomingMediaType = "audio";
          const audioObj = message.audio || message.voice;
          incomingMediaUrl = audioObj?.id ? `/api/whatsapp/media/${audioObj.id}` : undefined;
          incomingText = "";
        } else if (messageType === "document" && message.document) {
          incomingMediaType = "document";
          incomingMediaUrl = message.document.id ? `/api/whatsapp/media/${message.document.id}` : undefined;
          incomingText = message.document.filename || message.document.caption || "Document";
        } else if (messageType === "video" && message.video) {
          incomingMediaType = "image";
          incomingMediaUrl = message.video.id ? `/api/whatsapp/media/${message.video.id}` : undefined;
          incomingText = message.video.caption || "";
        } else if (messageType === "sticker" && message.sticker) {
          incomingMediaType = "image";
          incomingMediaUrl = message.sticker.id ? `/api/whatsapp/media/${message.sticker.id}` : undefined;
          incomingText = "";
        } else if (messageType === "interactive") {
          if (message.interactive?.type === "button_reply") {
            buttonId = message.interactive?.button_reply?.id;
            incomingText = message.interactive?.button_reply?.title || "";
          } else if (message.interactive?.type === "list_reply") {
            buttonId = message.interactive?.list_reply?.id;
            incomingText = message.interactive?.list_reply?.title || "";
          }
        } else if (messageType === "order" || message.order) {
          // Meta WhatsApp Cloud API Catalog Order message
          const rawOrder = message.order;
          const catalogId = rawOrder?.catalog_id;
          const customerNote = rawOrder?.text || "";
          const productItems = Array.isArray(rawOrder?.product_items)
            ? rawOrder.product_items
            : [];

          let subtotal = 0;
          let currency = "LKR";
          const items: CatalogOrderItem[] = productItems.map((item: any, idx: number) => {
            const qty = Number(item.quantity) || 1;
            const price = Number(item.item_price) || 0;
            if (item.currency) currency = item.currency;
            subtotal += qty * price;
            return {
              productId: item.product_retailer_id || `item-${idx + 1}`,
              name: item.name || item.product_retailer_id || `Product #${idx + 1}`,
              quantity: qty,
              unitPrice: price,
              currency: item.currency || currency,
            };
          });

          // Enrich product names and catalog name from database if available
          let resolvedCatalogName: string | undefined = undefined;
          try {
            const { data: dbCatalogs } = await supabaseAdmin
              .from("catalogs")
              .select("*")
              .or(`client_id.eq.${targetUserId},client_id.eq.default,client_id.eq.client-1`);

            if (dbCatalogs && dbCatalogs.length > 0) {
              const matchedCat = dbCatalogs.find((c) => c.catalog_id === catalogId) || dbCatalogs[0];
              if (matchedCat) {
                resolvedCatalogName = matchedCat.name;
                const catItems: any[] = Array.isArray(matchedCat.items) ? matchedCat.items : [];
                for (const it of items) {
                  const matchProd = catItems.find(
                    (p) =>
                      p.retailerId === it.productId ||
                      p.id === it.productId ||
                      p.metaProductId === it.productId
                  );
                  if (matchProd) {
                    if (matchProd.title) it.name = matchProd.title;
                    if (matchProd.imageUrl) it.imageUrl = matchProd.imageUrl;
                  }
                }
              }
            }
          } catch (enrichErr) {
            console.warn("[Webhook] Catalog enrichment error:", enrichErr);
          }

          const orderId = `ORD-${Date.now().toString().slice(-6)}`;
          incomingText = `🛍️ WhatsApp Catalog Order #${orderId}\n` +
            items.map((i) => `• ${i.quantity}x ${i.name} (${currency} ${i.unitPrice})`).join("\n") +
            `\nSubtotal: ${currency} ${subtotal.toLocaleString()}` +
            (customerNote ? `\nNote: "${customerNote}"` : "");

          orderPayload = {
            id: orderId,
            userId: targetUserId,
            contactId: "",
            contactName: customerProfileName,
            contactPhone: normalizedPhone,
            catalogId,
            catalogName: resolvedCatalogName,
            items,
            subtotal,
            currency,
            customerNote: customerNote || undefined,
            status: "pending",
            whatsappMessageId: message.id,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
        }

        const now = new Date();
        const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
        const msgId = message.id || `msg-${Date.now()}`;

        // 2. Fetch or create contact in Supabase
        const { data: contactList } = await supabaseAdmin
          .from("contacts")
          .select("*")
          .eq("phone", normalizedPhone);

        // Prioritize contact assigned to targetUserId, or fallback to first match
        let existingContact =
          contactList?.find((c) => c.user_id === targetUserId) ||
          contactList?.[0] ||
          null;

        if (!existingContact) {
          const newContactId = `c-${Date.now()}`;
          const { data: createdContact, error: contactErr } = await supabaseAdmin
            .from("contacts")
            .insert({
              id: newContactId,
              user_id: targetUserId,
              name: customerProfileName,
              phone: normalizedPhone,
              status: "active",
              assigned_agent: "Bot Engine",
              tags: ["Inbound"],
              unread_count: 1,
              last_message_snippet: incomingText,
              last_message_time: timeStr,
              is_bot_active: true,
              notes: [],
            })
            .select()
            .single();

          if (contactErr) {
            console.error("[Meta Webhook] Error creating contact:", contactErr.message);
          }
          if (createdContact) {
            existingContact = createdContact;
          }
        } else {
          const contactSnippet = orderPayload
            ? `🛍️ Order #${orderPayload.id} (${orderPayload.currency} ${orderPayload.subtotal.toLocaleString()})`
            : incomingMediaType === "image"
            ? (incomingText ? `📷 ${incomingText}` : "📷 Photo")
            : incomingMediaType === "audio"
            ? "🎵 Audio message"
            : incomingMediaType === "document"
            ? `📄 ${incomingText}`
            : incomingText;

          // Update contact timestamp, snippet, and ensure it is assigned to targetUserId
          await supabaseAdmin
            .from("contacts")
            .update({
              user_id: targetUserId,
              name:
                existingContact.name && !existingContact.name.startsWith("Customer (")
                  ? existingContact.name
                  : customerProfileName,
              last_message_snippet: contactSnippet,
              last_message_time: timeStr,
              unread_count: (existingContact.unread_count || 0) + 1,
              updated_at: new Date().toISOString(),
            })
            .eq("id", existingContact.id);
        }

        if (existingContact) {
          // If this was an order message, persist to catalog_orders table
          if (orderPayload) {
            orderPayload.contactId = existingContact.id;
            try {
              await supabaseAdmin.from("catalog_orders").insert({
                id: orderPayload.id,
                user_id: targetUserId,
                contact_id: existingContact.id,
                contact_name: customerProfileName,
                contact_phone: normalizedPhone,
                catalog_id: orderPayload.catalogId || null,
                catalog_name: orderPayload.catalogName || null,
                items: orderPayload.items as any,
                subtotal: orderPayload.subtotal,
                currency: orderPayload.currency,
                customer_note: orderPayload.customerNote || null,
                status: "pending",
                whatsapp_message_id: message.id || null,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              });
            } catch (orderErr) {
              console.error("[Meta Webhook] Error persisting catalog order:", orderErr);
            }
          }

          // 3. Persist customer incoming message scoped to this user/tenant
          await supabaseAdmin.from("messages").insert({
            id: msgId,
            user_id: targetUserId,
            contact_id: existingContact.id,
            sender: "customer",
            text: incomingText,
            timestamp: timeStr,
            status: "delivered",
            selected_button_id: buttonId || null,
            buttons: orderPayload ? ({ order: orderPayload } as any) : null,
            media_url: incomingMediaUrl || null,
            media_type: incomingMediaType || null,
            is_internal_note: false,
          });

          // 4. Handle Order Auto-Confirmation and Automated Bot Flows
          if (existingContact.is_bot_active) {
            let flowNodes: FlowNode[] = [];

            // 4a. Fetch all active flows for this user from the multi-flow table
            try {
              const { data: activeFlowRows } = await supabaseAdmin
                .from("flows")
                .select("nodes")
                .eq("user_id", targetUserId)
                .eq("is_active", true);

              if (activeFlowRows && activeFlowRows.length > 0) {
                for (const fRow of activeFlowRows) {
                  if (Array.isArray(fRow.nodes)) {
                    flowNodes.push(...(fRow.nodes as any));
                  }
                }
              }
            } catch (err) {
              console.warn("Could not query flows table, falling back to flow_nodes:", err);
            }

            // 4b. Fallback to legacy flow_nodes table if no multi-flows found
            if (flowNodes.length === 0) {
              const { data: nodeRows } = await supabaseAdmin
                .from("flow_nodes")
                .select("*")
                .eq("user_id", targetUserId)
                .order("id", { ascending: true });

              if (nodeRows && nodeRows.length > 0) {
                flowNodes = nodeRows.map(mapFlowNodeFromRow);
              } else {
                const { data: fallbackRows } = await supabaseAdmin
                  .from("flow_nodes")
                  .select("*")
                  .or("user_id.eq.client-1,user_id.eq.default")
                  .order("id", { ascending: true });
                if (fallbackRows && fallbackRows.length > 0) {
                  flowNodes = fallbackRows.map(mapFlowNodeFromRow);
                }
              }
            }

            const botResult = processBotInteraction({
              incomingText,
              buttonId,
              contact: mapContactFromRow(existingContact),
              nodes: flowNodes,
              order: orderPayload,
            });

              if (botResult) {
                const { replyMessage, updatedContact } = botResult;

                // Save bot response to messages
                await supabaseAdmin.from("messages").insert({
                  id: replyMessage.id,
                  user_id: targetUserId,
                  contact_id: existingContact.id,
                  sender: "bot",
                  sender_name: replyMessage.senderName || "Automated Bot",
                  text: replyMessage.text,
                  timestamp: replyMessage.timestamp,
                  status: "delivered",
                  buttons: replyMessage.buttons ? (replyMessage.buttons as any) : null,
                  catalog: replyMessage.catalog ? (replyMessage.catalog as any) : null,
                  is_internal_note: false,
                });

                // Update contact state (status, is_bot_active, snippet)
                const snippet = replyMessage.catalog
                  ? `🛍️ ${replyMessage.catalog.catalogName || "WhatsApp Catalog"}`
                  : replyMessage.text;

                await supabaseAdmin
                  .from("contacts")
                  .update({
                    status: updatedContact.status,
                    is_bot_active: updatedContact.isBotActive,
                    assigned_agent: updatedContact.assignedAgent || null,
                    last_message_snippet: snippet,
                    last_message_time: replyMessage.timestamp,
                    current_flow_node_id: updatedContact.currentFlowNodeId || null,
                    updated_at: new Date().toISOString(),
                  })
                  .eq("id", existingContact.id);

                // Dispatch out to Meta Cloud API using this user's token and phone number ID
                const activeToken = targetConfig?.access_token;
                const activePhoneId = targetConfig?.phone_number_id || incomingPhoneNumberId;

                if (activePhoneId && activeToken && !activeToken.startsWith("EAA...")) {
                  if (replyMessage.catalog) {
                    await sendMetaCatalogOrShowcase({
                      phoneNumberId: activePhoneId,
                      accessToken: activeToken,
                      recipientPhone: normalizedPhone,
                      catalog: replyMessage.catalog,
                      fallbackText: replyMessage.text,
                    });
                  } else if (replyMessage.buttons && replyMessage.buttons.length > 0) {
                    await sendMetaInteractiveButtons({
                      phoneNumberId: activePhoneId,
                      accessToken: activeToken,
                      recipientPhone: normalizedPhone,
                      bodyText: replyMessage.text,
                      buttons: replyMessage.buttons,
                    });
                  } else {
                    await sendMetaTextMessage({
                      phoneNumberId: activePhoneId,
                      accessToken: activeToken,
                      recipientPhone: normalizedPhone,
                      text: replyMessage.text,
                    });
                  }
                }
              }
            }
          }
        }

      // Meta requires returning an immediate 200 OK within 3 seconds
      return NextResponse.json({ status: "EVENT_RECEIVED" }, { status: 200 });
    }

    return NextResponse.json({ status: "NOT_WHATSAPP_EVENT" }, { status: 404 });
  } catch (error) {
    console.error("[Meta Webhook] Error processing event:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
