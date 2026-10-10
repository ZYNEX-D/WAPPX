import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { processBotInteraction } from "@/lib/bot-engine";
import {
  sendMetaTextMessage,
  sendMetaInteractiveButtons,
  sendMetaCatalogOrShowcase,
  sendMessengerOrInstagramTextMessage,
  sendMessengerOrInstagramQuickReplies,
  fetchMessengerUserProfile,
  fetchInstagramUserProfile,
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
                const { replyMessage, additionalMessages, updatedContact } = botResult;
                const allMessagesToSend = [replyMessage, ...(additionalMessages || [])];

                // Dispatch out to Meta Cloud API using this user's token and phone number ID
                const activeToken = targetConfig?.access_token;
                const activePhoneId = targetConfig?.phone_number_id || incomingPhoneNumberId;

                for (const msgToSend of allMessagesToSend) {
                  // Save bot response to messages
                  await supabaseAdmin.from("messages").insert({
                    id: msgToSend.id,
                    user_id: targetUserId,
                    contact_id: existingContact.id,
                    sender: msgToSend.isInternalNote ? "agent" : "bot",
                    sender_name: msgToSend.senderName || (msgToSend.isInternalNote ? "Team Alert" : "Automated Bot"),
                    text: msgToSend.text,
                    timestamp: msgToSend.timestamp,
                    status: "delivered",
                    buttons: msgToSend.buttons ? (msgToSend.buttons as any) : null,
                    catalog: msgToSend.catalog ? (msgToSend.catalog as any) : null,
                    media_url: msgToSend.mediaUrl || null,
                    media_type: msgToSend.mediaType || null,
                    is_internal_note: !!msgToSend.isInternalNote,
                  });

                  if (!msgToSend.isInternalNote && activePhoneId && activeToken && !activeToken.startsWith("EAA...")) {
                    try {
                      if (msgToSend.catalog) {
                        await sendMetaCatalogOrShowcase({
                          phoneNumberId: activePhoneId,
                          accessToken: activeToken,
                          recipientPhone: normalizedPhone,
                          catalog: msgToSend.catalog,
                          fallbackText: msgToSend.text || "View our product catalog",
                        });
                      } else if (msgToSend.buttons && msgToSend.buttons.length > 0) {
                        await sendMetaInteractiveButtons({
                          phoneNumberId: activePhoneId,
                          accessToken: activeToken,
                          recipientPhone: normalizedPhone,
                          bodyText: msgToSend.text || "Please select an option:",
                          buttons: msgToSend.buttons,
                        });
                      } else if (msgToSend.text && msgToSend.text.trim().length > 0) {
                        await sendMetaTextMessage({
                          phoneNumberId: activePhoneId,
                          accessToken: activeToken,
                          recipientPhone: normalizedPhone,
                          text: msgToSend.text,
                        });
                      }
                    } catch (dispatchErr) {
                      console.error("[Meta Webhook] Error sending outbound message to Meta:", dispatchErr);
                    }

                    // Small pause between outbound messages to ensure correct arrival sequence on client's WhatsApp
                    if (allMessagesToSend.length > 1) {
                      await new Promise((resolve) => setTimeout(resolve, 600));
                    }
                  }
                }

                // Update contact state (status, is_bot_active, snippet, notes, tags)
                const lastMsg = allMessagesToSend.filter((m) => !m.isInternalNote).slice(-1)[0] || allMessagesToSend[allMessagesToSend.length - 1];
                const snippet = lastMsg?.catalog
                  ? `🛍️ ${lastMsg.catalog.catalogName || "WhatsApp Catalog"}`
                  : lastMsg?.text || "Interactive Flow";

                await supabaseAdmin
                  .from("contacts")
                  .update({
                    status: updatedContact.status,
                    is_bot_active: updatedContact.isBotActive,
                    assigned_agent: updatedContact.assignedAgent || null,
                    tags: updatedContact.tags || [],
                    last_message_snippet: snippet,
                    last_message_time: lastMsg?.timestamp || replyMessage.timestamp,
                    current_flow_node_id: updatedContact.currentFlowNodeId || null,
                    notes: updatedContact.notes || [],
                    updated_at: new Date().toISOString(),
                  })
                  .eq("id", existingContact.id);
              }
            }
          }
        }

      // Meta requires returning an immediate 200 OK within 3 seconds
      return NextResponse.json({ status: "EVENT_RECEIVED" }, { status: 200 });
    }

    // Verify if it is Facebook Messenger or Instagram Direct webhook event
    if (body.object === "page" || body.object === "instagram") {
      const channel = body.object === "page" ? "messenger" : "instagram";
      const entries = Array.isArray(body.entry) ? body.entry : [];

      for (const entry of entries) {
        const events = Array.isArray(entry.messaging)
          ? entry.messaging
          : Array.isArray(entry.standby)
          ? entry.standby
          : [];

        for (const messagingEvent of events) {
          const senderId = messagingEvent.sender?.id; // PSID or IGSID
          const recipientPageOrIgId = messagingEvent.recipient?.id;
          const messageObj = messagingEvent.message;
          const postbackObj = messagingEvent.postback;

          // Skip echo / delivery receipts / read receipts
          if (messageObj?.is_echo || (!messageObj && !postbackObj) || !senderId) {
            continue;
          }

          // 1. Locate specific user/tenant in meta_config
          let targetUserId = "client-1";
          let targetConfig: any = null;

          if (recipientPageOrIgId) {
            const matchField = channel === "messenger" ? "facebook_page_id" : "instagram_account_id";
            const { data: configs } = await supabaseAdmin
              .from("meta_config")
              .select("*")
              .eq(matchField, recipientPageOrIgId);

            if (configs && configs.length > 0) {
              targetConfig = configs.find((c) => c.user_id && c.user_id !== "default") || configs[0];
              targetUserId = targetConfig.user_id || targetConfig.id || "client-1";
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

          const pageAccessToken = targetConfig?.page_access_token || targetConfig?.access_token;

          // 2. Parse text, attachments, or button payload
          let incomingText = messageObj?.text || "";
          let buttonId: string | undefined = undefined;
          let incomingMediaUrl: string | undefined = undefined;
          let incomingMediaType: "image" | "audio" | "document" | undefined = undefined;

          if (messageObj?.attachments && messageObj.attachments.length > 0) {
            const att = messageObj.attachments[0];
            if (att.type === "image") incomingMediaType = "image";
            else if (att.type === "audio") incomingMediaType = "audio";
            else if (att.type === "file") incomingMediaType = "document";
            else if (att.type === "video") incomingMediaType = "image";
            incomingMediaUrl = att.payload?.url;
            if (!incomingText) {
              incomingText = incomingMediaType === "image" ? "Photo" : incomingMediaType === "audio" ? "Audio message" : "Attachment";
            }
          }

          if (messageObj?.quick_reply?.payload) {
            buttonId = messageObj.quick_reply.payload;
          } else if (postbackObj?.payload) {
            buttonId = postbackObj.payload;
            if (!incomingText) incomingText = postbackObj.title || "";
          }

          // 3. Resolve Contact record
          const contactId = `${channel}-${senderId}`;
          const { data: existingContactRow } = await supabaseAdmin
            .from("contacts")
            .select("*")
            .eq("id", contactId)
            .maybeSingle();

          let existingContact = existingContactRow ? mapContactFromRow(existingContactRow) : null;

          if (!existingContact) {
            // Attempt to fetch profile info via Meta Graph API
            let customerName = channel === "instagram" ? `Instagram User (@${senderId.slice(-4)})` : `Messenger User (${senderId.slice(-4)})`;
            let avatarUrl: string | undefined = undefined;

            if (pageAccessToken && !pageAccessToken.startsWith("EAA...")) {
              if (channel === "messenger") {
                const profile = await fetchMessengerUserProfile(senderId, pageAccessToken);
                if (profile?.name) customerName = profile.name;
                if (profile?.profilePic) avatarUrl = profile.profilePic;
              } else {
                const profile = await fetchInstagramUserProfile(senderId, pageAccessToken);
                if (profile?.name) customerName = profile.name;
                if (profile?.profilePic) avatarUrl = profile.profilePic;
              }
            }

            const now = new Date();
            const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

            const newContactPayload = {
              id: contactId,
              user_id: targetUserId,
              name: customerName,
              phone: senderId,
              channel,
              external_id: senderId,
              avatar_url: avatarUrl || null,
              status: "active" as const,
              assigned_agent: "Unassigned",
              tags: [channel === "messenger" ? "Messenger" : "Instagram"],
              unread_count: 1,
              last_message_snippet: incomingText,
              last_message_time: timeStr,
              is_bot_active: true,
              notes: [],
              created_at: now.toISOString(),
              updated_at: now.toISOString(),
            };

            const { data: inserted, error: insertErr } = await supabaseAdmin
              .from("contacts")
              .insert(newContactPayload)
              .select()
              .single();

            if (!insertErr && inserted) {
              existingContact = mapContactFromRow(inserted);
            } else {
              console.error(`[Meta Webhook] Failed to create ${channel} contact:`, insertErr);
            }
          } else {
            // Increment unread count & update snippet
            const now = new Date();
            const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
            await supabaseAdmin
              .from("contacts")
              .update({
                unread_count: (existingContact.unreadCount || 0) + 1,
                last_message_snippet: incomingText,
                last_message_time: timeStr,
                updated_at: now.toISOString(),
              })
              .eq("id", existingContact.id);
          }

          // 4. Save Customer Message
          const now = new Date();
          const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
          const customerMsgId = messageObj?.mid || `msg-${Date.now()}`;

          await supabaseAdmin.from("messages").insert({
            id: customerMsgId,
            contact_id: contactId,
            user_id: targetUserId,
            sender: "customer",
            sender_name: existingContact?.name || `${channel} User`,
            text: incomingText,
            timestamp: timeStr,
            status: "read",
            channel,
            selected_button_id: buttonId || null,
            media_url: incomingMediaUrl || null,
            media_type: incomingMediaType || null,
            is_internal_note: false,
          });

        // 5. Bot Flow Evaluation
        if (existingContact && existingContact.isBotActive) {
          let userFlowNodes: FlowNode[] = [];
          const { data: activeFlow } = await supabaseAdmin
            .from("flows")
            .select("*")
            .eq("user_id", targetUserId)
            .eq("is_active", true)
            .order("is_default", { ascending: false })
            .limit(1)
            .maybeSingle();

          if (activeFlow && Array.isArray(activeFlow.nodes) && activeFlow.nodes.length > 0) {
            userFlowNodes = activeFlow.nodes.map((n: any) =>
              n.data ? { ...n.data, id: n.id, position: n.position || { x: 0, y: 0 } } : n
            );
          }

          if (userFlowNodes.length === 0) {
            const { data: dbNodes } = await supabaseAdmin
              .from("flow_nodes")
              .select("*")
              .eq("user_id", targetUserId);
            if (dbNodes && dbNodes.length > 0) {
              userFlowNodes = dbNodes.map(mapFlowNodeFromRow);
            }
          }

          const botResult = processBotInteraction({
            incomingText,
            buttonId,
            contact: existingContact,
            nodes: userFlowNodes,
          });

          if (botResult) {
            const { replyMessage, additionalMessages = [], updatedContact } = botResult;
            const allMessagesToSend = [replyMessage, ...additionalMessages];

            for (const msgToSend of allMessagesToSend) {
              await supabaseAdmin.from("messages").insert({
                id: msgToSend.id,
                contact_id: contactId,
                user_id: targetUserId,
                sender: msgToSend.sender,
                sender_name: msgToSend.senderName || "Automated Bot",
                text: msgToSend.text,
                timestamp: msgToSend.timestamp,
                status: "delivered",
                channel,
                buttons: msgToSend.buttons ? (msgToSend.buttons as any) : null,
                media_url: msgToSend.mediaUrl || null,
                media_type: msgToSend.mediaType || null,
                is_internal_note: msgToSend.isInternalNote || false,
              });

              if (pageAccessToken && !pageAccessToken.startsWith("EAA...")) {
                try {
                  if (msgToSend.buttons && msgToSend.buttons.length > 0) {
                    await sendMessengerOrInstagramQuickReplies({
                      pageAccessToken,
                      recipientId: senderId,
                      text: msgToSend.text,
                      buttons: msgToSend.buttons,
                    });
                  } else {
                    await sendMessengerOrInstagramTextMessage({
                      pageAccessToken,
                      recipientId: senderId,
                      text: msgToSend.text,
                    });
                  }
                } catch (dispatchErr) {
                  console.error(`[Meta Webhook] Error sending ${channel} bot reply:`, dispatchErr);
                }
              }
            }

            const lastMsg = allMessagesToSend.slice(-1)[0];
            await supabaseAdmin
              .from("contacts")
              .update({
                status: updatedContact.status,
                is_bot_active: updatedContact.isBotActive,
                assigned_agent: updatedContact.assignedAgent || null,
                tags: updatedContact.tags || [],
                last_message_snippet: lastMsg?.text || "Interactive Flow",
                last_message_time: lastMsg?.timestamp || replyMessage.timestamp,
                current_flow_node_id: updatedContact.currentFlowNodeId || null,
                notes: updatedContact.notes || [],
                updated_at: new Date().toISOString(),
              })
              .eq("id", existingContact.id);
          }
        }
      }
    }

      return NextResponse.json({ status: "EVENT_RECEIVED" }, { status: 200 });
    }

    return NextResponse.json({ status: "EVENT_IGNORED" }, { status: 200 });
  } catch (error) {
    console.error("[Meta Webhook] Error processing event:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
