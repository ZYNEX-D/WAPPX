import { CatalogPayload } from "@/types/whatsapp";

export interface MetaSendResponse {
  messaging_product: "whatsapp";
  contacts: [{ input: string; wa_id: string }];
  messages: [{ id: string }];
}

export interface DiscoveredPhoneNumber {
  id: string;
  displayPhoneNumber: string;
  verifiedName: string;
  qualityRating?: string;
  status?: string;
}

export interface DiscoveredWaba {
  wabaId: string;
  wabaName: string;
  phoneNumbers: DiscoveredPhoneNumber[];
}

export interface PhoneNumberHealth {
  id: string;
  displayPhoneNumber: string;
  verifiedName: string;
  qualityRating: string;
  messagingLimitTier?: string;
  codeVerificationStatus?: string;
}

export async function sendMetaTextMessage({
  phoneNumberId,
  accessToken,
  recipientPhone,
  text,
}: {
  phoneNumberId: string;
  accessToken: string;
  recipientPhone: string;
  text: string;
}): Promise<{ success: boolean; data?: MetaSendResponse; error?: string }> {
  try {
    const cleanPhone = recipientPhone.replace(/[^0-9]/g, "");
    const res = await fetch(`https://graph.facebook.com/v21.0/${phoneNumberId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: cleanPhone,
        type: "text",
        text: { preview_url: false, body: text },
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: data?.error?.message || "Failed to send message via Meta Cloud API" };
    }

    return { success: true, data };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Network error" };
  }
}

export async function sendMetaInteractiveButtons({
  phoneNumberId,
  accessToken,
  recipientPhone,
  bodyText,
  buttons,
}: {
  phoneNumberId: string;
  accessToken: string;
  recipientPhone: string;
  bodyText: string;
  buttons: { id: string; title: string }[];
}): Promise<{ success: boolean; data?: MetaSendResponse; error?: string }> {
  try {
    const cleanPhone = recipientPhone.replace(/[^0-9]/g, "");
    const formattedButtons = buttons.slice(0, 3).map((b) => ({
      type: "reply",
      reply: {
        id: b.id,
        title: b.title.slice(0, 20), // Meta max 20 chars per button title
      },
    }));

    const res = await fetch(`https://graph.facebook.com/v21.0/${phoneNumberId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: cleanPhone,
        type: "interactive",
        interactive: {
          type: "button",
          body: { text: bodyText },
          action: { buttons: formattedButtons },
        },
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: data?.error?.message || "Failed to send interactive buttons" };
    }

    return { success: true, data };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Network error" };
  }
}

/**
 * Sends a WhatsApp In-App Catalog message (View Catalog button)
 */
export async function sendMetaCatalogMessage({
  phoneNumberId,
  accessToken,
  recipientPhone,
  bodyText,
  footerText = "Explore our official product catalogue",
  thumbnailProductRetailerId,
}: {
  phoneNumberId: string;
  accessToken: string;
  recipientPhone: string;
  bodyText: string;
  footerText?: string;
  thumbnailProductRetailerId?: string;
}): Promise<{ success: boolean; data?: MetaSendResponse; error?: string }> {
  try {
    const cleanPhone = recipientPhone.replace(/[^0-9]/g, "");
    const res = await fetch(`https://graph.facebook.com/v21.0/${phoneNumberId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: cleanPhone,
        type: "interactive",
        interactive: {
          type: "catalog_message",
          body: { text: bodyText },
          footer: footerText ? { text: footerText } : undefined,
          action: {
            name: "catalog_message",
            parameters: thumbnailProductRetailerId
              ? { thumbnail_product_retailer_id: thumbnailProductRetailerId }
              : {},
          },
        },
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: data?.error?.message || "Failed to send catalog message" };
    }
    return { success: true, data };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Network error" };
  }
}

/**
 * Sends a single WhatsApp product card (Meta Commerce Catalog)
 */
export async function sendMetaProductMessage({
  phoneNumberId,
  accessToken,
  recipientPhone,
  catalogId,
  productRetailerId,
  bodyText,
  footerText,
}: {
  phoneNumberId: string;
  accessToken: string;
  recipientPhone: string;
  catalogId: string;
  productRetailerId: string;
  bodyText: string;
  footerText?: string;
}): Promise<{ success: boolean; data?: MetaSendResponse; error?: string }> {
  try {
    const cleanPhone = recipientPhone.replace(/[^0-9]/g, "");
    const res = await fetch(`https://graph.facebook.com/v21.0/${phoneNumberId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: cleanPhone,
        type: "interactive",
        interactive: {
          type: "product",
          body: { text: bodyText },
          footer: footerText ? { text: footerText } : undefined,
          action: {
            catalog_id: catalogId,
            product_retailer_id: productRetailerId,
          },
        },
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: data?.error?.message || "Failed to send product card" };
    }
    return { success: true, data };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Network error" };
  }
}

/**
 * Sends a WhatsApp Multi-Product interactive message (sections of products)
 */
export async function sendMetaProductListMessage({
  phoneNumberId,
  accessToken,
  recipientPhone,
  catalogId,
  headerText = "Catalog Collection",
  bodyText,
  footerText = "WhatsApp In-App Commerce",
  sections,
}: {
  phoneNumberId: string;
  accessToken: string;
  recipientPhone: string;
  catalogId: string;
  headerText?: string;
  bodyText: string;
  footerText?: string;
  sections: { title: string; productRetailerIds: string[] }[];
}): Promise<{ success: boolean; data?: MetaSendResponse; error?: string }> {
  try {
    const cleanPhone = recipientPhone.replace(/[^0-9]/g, "");
    const formattedSections = sections.map((sec) => ({
      title: sec.title.slice(0, 24),
      product_items: sec.productRetailerIds.map((id) => ({ product_retailer_id: id })),
    }));

    const res = await fetch(`https://graph.facebook.com/v21.0/${phoneNumberId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: cleanPhone,
        type: "interactive",
        interactive: {
          type: "product_list",
          header: { type: "text", text: headerText },
          body: { text: bodyText },
          footer: footerText ? { text: footerText } : undefined,
          action: {
            catalog_id: catalogId,
            sections: formattedSections,
          },
        },
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: data?.error?.message || "Failed to send product list" };
    }
    return { success: true, data };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Network error" };
  }
}

/**
 * Sends a single WhatsApp Image message with optional caption
 */
export async function sendMetaImageMessage({
  phoneNumberId,
  accessToken,
  recipientPhone,
  imageUrl,
  caption,
}: {
  phoneNumberId: string;
  accessToken: string;
  recipientPhone: string;
  imageUrl: string;
  caption?: string;
}): Promise<{ success: boolean; data?: MetaSendResponse; error?: string }> {
  try {
    const cleanPhone = recipientPhone.replace(/[^0-9]/g, "");
    const res = await fetch(`https://graph.facebook.com/v21.0/${phoneNumberId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: cleanPhone,
        type: "image",
        image: {
          link: imageUrl,
          caption: caption || undefined,
        },
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: data?.error?.message || "Failed to send image message" };
    }
    return { success: true, data };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Network error" };
  }
}

/**
 * Sends a WhatsApp Document / PDF message
 */
export async function sendMetaDocumentMessage({
  phoneNumberId,
  accessToken,
  recipientPhone,
  documentUrl,
  caption,
  filename,
}: {
  phoneNumberId: string;
  accessToken: string;
  recipientPhone: string;
  documentUrl: string;
  caption?: string;
  filename?: string;
}): Promise<{ success: boolean; data?: MetaSendResponse; error?: string }> {
  try {
    const cleanPhone = recipientPhone.replace(/[^0-9]/g, "");
    const res = await fetch(`https://graph.facebook.com/v21.0/${phoneNumberId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: cleanPhone,
        type: "document",
        document: {
          link: documentUrl,
          caption: caption || undefined,
          filename: filename || "Catalog.pdf",
        },
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: data?.error?.message || "Failed to send document message" };
    }
    return { success: true, data };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Network error" };
  }
}

/**
 * Intelligently delivers a WhatsApp Catalog to the client.
 * Tries official Meta Commerce Catalog interactive message first;
 * if the WABA does not have a linked Commerce catalog (Meta code 131009),
 * automatically delivers a rich showcase with high-res product photos, pricing, descriptions, and interactive reply buttons.
 */
export async function sendMetaCatalogOrShowcase({
  phoneNumberId,
  accessToken,
  recipientPhone,
  catalog,
  fallbackText,
}: {
  phoneNumberId: string;
  accessToken: string;
  recipientPhone: string;
  catalog: CatalogPayload;
  fallbackText?: string;
}): Promise<{ success: boolean; data?: MetaSendResponse; error?: string; mode?: string }> {
  // 1. PDF Catalog Mode
  if (catalog.type === "pdf") {
    const docUrl = catalog.thumbnailProductId || catalog.products?.[0]?.url;
    if (docUrl && (docUrl.startsWith("http://") || docUrl.startsWith("https://"))) {
      const docRes = await sendMetaDocumentMessage({
        phoneNumberId,
        accessToken,
        recipientPhone,
        documentUrl: docUrl,
        caption: `📄 *${catalog.catalogName || "Official Catalog"}*\n\n${catalog.bodyText || "Tap above to download our full catalog."}`,
        filename: `${(catalog.catalogName || "Catalog").replace(/[^a-zA-Z0-9_-]/g, "_")}.pdf`,
      });
      if (docRes.success) return { ...docRes, mode: "pdf_document" };
    }

    const textRes = await sendMetaTextMessage({
      phoneNumberId,
      accessToken,
      recipientPhone,
      text: fallbackText || `📄 *${catalog.catalogName || "Catalog"}*\n\n${catalog.bodyText || ""}\n\n🔗 ${docUrl || ""}`,
    });
    return { ...textRes, mode: "pdf_text" };
  }

  // 2. Single Product Card Mode
  if (catalog.type === "product") {
    const prod = catalog.products?.[0];
    const sku = catalog.thumbnailProductId || prod?.retailerId;

    // Try native Meta Commerce product card if catalogId and sku exist
    if (catalog.catalogId && sku) {
      const nativeRes = await sendMetaProductMessage({
        phoneNumberId,
        accessToken,
        recipientPhone,
        catalogId: catalog.catalogId,
        productRetailerId: sku,
        bodyText: catalog.bodyText || prod?.description || `Product: ${prod?.title || ""}`,
        footerText: catalog.footerText || "Official WhatsApp Commerce Card",
      });
      if (nativeRes.success) return { ...nativeRes, mode: "native_product" };
      console.warn("[Meta Client] Native product card not available on WABA, falling back to showcase:", nativeRes.error);
    }

    // Showcase fallback: If product image is available, send high-res product photo with full card details!
    if (prod?.imageUrl && (prod.imageUrl.startsWith("http://") || prod.imageUrl.startsWith("https://"))) {
      const captionText = `🛍️ *${prod.title || catalog.catalogName || "Product"}*${
        prod.price ? ` (${prod.price})` : ""
      }\n\n${prod.description || catalog.bodyText || ""}\n\n_Official WhatsApp Business Product_`;

      const imgRes = await sendMetaImageMessage({
        phoneNumberId,
        accessToken,
        recipientPhone,
        imageUrl: prod.imageUrl,
        caption: captionText,
      });

      // Follow up with interactive action buttons
      await sendMetaInteractiveButtons({
        phoneNumberId,
        accessToken,
        recipientPhone,
        bodyText: `Interested in *${prod.title || "this package"}*? Choose an option below:`,
        buttons: [
          { id: "btn-pricing", title: "💼 Packages & Pricing" },
          { id: "btn-agent", title: "👤 Talk to Agent" },
        ],
      });

      if (imgRes.success) return { ...imgRes, mode: "showcase_image" };
    }

    // Showcase fallback: Rich interactive button card with product details
    const productCardText = `🛍️ *${prod?.title || catalog.catalogName || "Featured Product"}*${
      prod?.price ? ` (${prod.price})` : ""
    }\n\n${prod?.description || catalog.bodyText || ""}\n\n_Official WhatsApp Business Product_`;

    const productButtons = await sendMetaInteractiveButtons({
      phoneNumberId,
      accessToken,
      recipientPhone,
      bodyText: productCardText,
      buttons: [
        { id: "btn-pricing", title: "💼 Packages & Pricing" },
        { id: "btn-agent", title: "👤 Talk to Agent" },
      ],
    });

    if (productButtons.success) return { ...productButtons, mode: "showcase_buttons" };

    // Text fallback
    const text = `🛍️ *${prod?.title || catalog.catalogName || "Product"}*${prod?.price ? ` (${prod.price})` : ""}\n\n${prod?.description || catalog.bodyText || ""}`;
    const textRes = await sendMetaTextMessage({
      phoneNumberId,
      accessToken,
      recipientPhone,
      text,
    });
    return { ...textRes, mode: "showcase_text" };
  }

  // 3. Multi-Product Section List Mode (product_list)
  if (catalog.type === "product_list" && catalog.catalogId) {
    const skus = (catalog.products || [])
      .map((p) => p.retailerId || p.id)
      .filter(Boolean);

    if (skus.length > 0) {
      const listRes = await sendMetaProductListMessage({
        phoneNumberId,
        accessToken,
        recipientPhone,
        catalogId: catalog.catalogId,
        headerText: (catalog.catalogName || "Catalog Collection").slice(0, 60),
        bodyText: catalog.bodyText || "Explore our products directly on WhatsApp:",
        footerText: catalog.footerText || "Tap 'View items' to open catalog",
        sections: [
          {
            title: (catalog.catalogName || "Featured Items").slice(0, 24),
            productRetailerIds: skus.slice(0, 30),
          },
        ],
      });
      if (listRes.success) return { ...listRes, mode: "native_product_list" };
      console.warn("[Meta Client] Native product_list not delivered, trying in-app catalog_message:", listRes.error);
    }
  }

  // 4. Native In-App Store Catalog Mode (catalog_message)
  const sku = catalog.thumbnailProductId || catalog.products?.[0]?.retailerId;
  const nativeRes = await sendMetaCatalogMessage({
    phoneNumberId,
    accessToken,
    recipientPhone,
    bodyText: catalog.bodyText || "Browse our official product catalog directly within WhatsApp:",
    footerText: catalog.footerText || "Tap 'View Catalog' to open store",
    thumbnailProductRetailerId: sku,
  });

  if (nativeRes.success) {
    return { ...nativeRes, mode: "native_catalog" };
  }

  console.warn(
    "[Meta Client] Native catalog message not linked to WABA in Meta Commerce Settings (code 131009), delivering via Rich Interactive Showcase:",
    nativeRes.error
  );

  // Fallback: Rich WhatsApp Showcase with Hero Photo & Interactive Buttons
  const itemsList = catalog.products && catalog.products.length > 0 ? catalog.products : [];
  
  // Send hero photo if available
  const heroImage = itemsList.find((i) => i.imageUrl && (i.imageUrl.startsWith("http://") || i.imageUrl.startsWith("https://")))?.imageUrl;
  if (heroImage) {
    await sendMetaImageMessage({
      phoneNumberId,
      accessToken,
      recipientPhone,
      imageUrl: heroImage,
      caption: `🛍️ *${catalog.catalogName || "Official Product Catalog"}*\n${catalog.bodyText || "Explore our featured products and services."}`,
    });
  }

  let showcaseText = `🛍️ *${catalog.catalogName || "Official Product Catalog"}*\n\n${catalog.bodyText || "Explore our collection of packages and products:"}\n\n`;

  if (itemsList.length > 0) {
    itemsList.slice(0, 5).forEach((item, idx) => {
      showcaseText += `${idx + 1}. *${item.title}*${item.price ? ` - ${item.price}` : ""}\n`;
      if (item.description) {
        showcaseText += `   _${item.description.slice(0, 95)}${item.description.length > 95 ? "..." : ""}_\n`;
      }
      showcaseText += "\n";
    });
  }

  showcaseText += `_Tap below to inquire or speak with our team:_`;

  const buttonsRes = await sendMetaInteractiveButtons({
    phoneNumberId,
    accessToken,
    recipientPhone,
    bodyText: showcaseText,
    buttons: [
      { id: "btn-catalog", title: "🛍️ View Full Catalog" },
      { id: "btn-agent", title: "👤 Talk to Agent" },
    ],
  });

  if (buttonsRes.success) return { ...buttonsRes, mode: "showcase_buttons" };

  const fallbackRes = await sendMetaTextMessage({
    phoneNumberId,
    accessToken,
    recipientPhone,
    text: showcaseText,
  });
  return { ...fallbackRes, mode: "showcase_text" };
}

/**
 * Automatically auto-subscribes this Meta App's webhook to the user's WhatsApp Business Account
 */
export async function subscribeWabaToApp({
  wabaId,
  accessToken,
}: {
  wabaId: string;
  accessToken: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch(`https://graph.facebook.com/v21.0/${wabaId}/subscribed_apps`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });

    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: data?.error?.message || "Failed to auto-subscribe webhook to WABA" };
    }

    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Network error" };
  }
}

/**
 * Queries real-time health, quality rating, and display name for a connected Phone Number
 */
export async function getPhoneNumberHealth({
  phoneNumberId,
  accessToken,
}: {
  phoneNumberId: string;
  accessToken: string;
}): Promise<{ success: boolean; data?: PhoneNumberHealth; error?: string }> {
  try {
    const res = await fetch(
      `https://graph.facebook.com/v21.0/${phoneNumberId}?fields=id,display_phone_number,verified_name,quality_rating,code_verification_status,messaging_limit_tier`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: data?.error?.message || "Failed to fetch phone number details" };
    }

    return {
      success: true,
      data: {
        id: data.id,
        displayPhoneNumber: data.display_phone_number || "",
        verifiedName: data.verified_name || "WhatsApp Business",
        qualityRating: data.quality_rating || "UNKNOWN",
        messagingLimitTier: data.messaging_limit_tier || "TIER_250",
        codeVerificationStatus: data.code_verification_status || "VERIFIED",
      },
    };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Network error" };
  }
}

/**
 * Auto-discovers all WhatsApp Business Accounts (WABAs) and Phone Numbers
 * linked to a given Access Token by probing Meta Graph API
 */
export async function discoverMetaAccounts(
  accessToken: string,
  hintWabaId?: string
): Promise<{ success: boolean; wabas?: DiscoveredWaba[]; error?: string }> {
  try {
    const discovered: DiscoveredWaba[] = [];
    const wabaIds = new Set<string>();

    // Ignore mock WABA ID from initial seed
    if (hintWabaId && hintWabaId.trim().length > 3 && hintWabaId.trim() !== "249018249081234") {
      wabaIds.add(hintWabaId.trim());
    }

    // 1. Proactively probe debug_token to get granular_scopes and target_ids (the WABAs granted to this token!)
    try {
      const debugRes = await fetch(
        `https://graph.facebook.com/v21.0/debug_token?input_token=${accessToken}&access_token=${accessToken}`
      );
      const debugData = await debugRes.json();
      console.log("[Auto-Discover] Debug token payload:", JSON.stringify(debugData));

      if (debugData?.data?.granular_scopes && Array.isArray(debugData.data.granular_scopes)) {
        for (const scopeObj of debugData.data.granular_scopes) {
          if (scopeObj.target_ids && Array.isArray(scopeObj.target_ids)) {
            for (const tid of scopeObj.target_ids) {
              if (String(tid) !== "249018249081234") {
                wabaIds.add(String(tid));
              }
            }
          }
        }
      }

      if (debugData?.data?.app_id) {
        try {
          const appWabaRes = await fetch(
            `https://graph.facebook.com/v21.0/${debugData.data.app_id}/whatsapp_business_accounts`,
            { headers: { Authorization: `Bearer ${accessToken}` } }
          );
          const appWabaData = await appWabaRes.json();
          if (appWabaData?.data && Array.isArray(appWabaData.data)) {
            for (const w of appWabaData.data) {
              if (w.id !== "249018249081234") {
                wabaIds.add(w.id);
              }
            }
          }
        } catch {}
      }
    } catch (e) {
      console.warn("[Auto-Discover] debug_token probe failed:", e);
    }

    // 2. Try finding WABAs via businesses
    try {
      const bizRes = await fetch("https://graph.facebook.com/v21.0/me/businesses?fields=id,name", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const bizData = await bizRes.json();

      if (bizData.data && Array.isArray(bizData.data)) {
        for (const biz of bizData.data) {
          for (const edge of ["owned_whatsapp_business_accounts", "client_whatsapp_business_accounts"]) {
            try {
              const wabaRes = await fetch(
                `https://graph.facebook.com/v21.0/${biz.id}/${edge}?fields=id,name`,
                { headers: { Authorization: `Bearer ${accessToken}` } }
              );
              const wabaData = await wabaRes.json();
              if (wabaData.data && Array.isArray(wabaData.data)) {
                for (const w of wabaData.data) {
                  if (w.id !== "249018249081234") {
                    wabaIds.add(w.id);
                  }
                }
              }
            } catch {
              // ignore edge failures
            }
          }
        }
      }
    } catch {
      // ignore
    }

    // 3. Try direct /me/assigned_whatsapp_business_accounts
    try {
      const assignedRes = await fetch(
        "https://graph.facebook.com/v21.0/me/assigned_whatsapp_business_accounts?fields=id,name",
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      const assignedData = await assignedRes.json();
      if (assignedData.data && Array.isArray(assignedData.data)) {
        for (const w of assignedData.data) {
          if (w.id !== "249018249081234") {
            wabaIds.add(w.id);
          }
        }
      }
    } catch {
      // ignore
    }

    // 4. Try direct /me?fields=whatsapp_business_accounts
    try {
      const meRes = await fetch(
        "https://graph.facebook.com/v21.0/me?fields=id,name,whatsapp_business_accounts{id,name}",
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      const meData = await meRes.json();
      if (meData.whatsapp_business_accounts?.data && Array.isArray(meData.whatsapp_business_accounts.data)) {
        for (const w of meData.whatsapp_business_accounts.data) {
          if (w.id !== "249018249081234") {
            wabaIds.add(w.id);
          }
        }
      }
    } catch {
      // ignore
    }

    // 3. For each WABA ID found (or hint), fetch its phone numbers
    for (const wId of wabaIds) {
      try {
        const phoneRes = await fetch(
          `https://graph.facebook.com/v21.0/${wId}/phone_numbers?fields=id,display_phone_number,verified_name,quality_rating,code_verification_status`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        const phoneData = await phoneRes.json();

        // Also fetch WABA name
        const wabaInfoRes = await fetch(`https://graph.facebook.com/v21.0/${wId}?fields=id,name`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        const wabaInfo = await wabaInfoRes.json();

        const phoneNumbers: DiscoveredPhoneNumber[] = [];
        if (phoneData.data && Array.isArray(phoneData.data)) {
          for (const p of phoneData.data) {
            phoneNumbers.push({
              id: p.id,
              displayPhoneNumber: p.display_phone_number || "",
              verifiedName: p.verified_name || "WhatsApp Business",
              qualityRating: p.quality_rating,
              status: p.code_verification_status,
            });
          }
        }

        discovered.push({
          wabaId: wId,
          wabaName: wabaInfo.name || `WhatsApp Business Account (${wId})`,
          phoneNumbers,
        });
      } catch {
        // continue
      }
    }

    if (discovered.length === 0) {
      return {
        success: false,
        error:
          "No WhatsApp Business Accounts found for this token. Make sure the System User has 'whatsapp_business_messaging' and 'whatsapp_business_management' permissions.",
      };
    }

    return { success: true, wabas: discovered };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Discovery request failed" };
  }
}
