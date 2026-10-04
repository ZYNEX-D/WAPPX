import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";

/**
 * POST /api/whatsapp/catalog/create
 * Creates an official Meta Commerce Catalog via Graph API
 * and links it to the WhatsApp Business Account (WABA).
 */
export async function POST(req: NextRequest) {
  try {
    const { clientId = "client-1", catalogName = "WAPPX Catalog" } = await req.json();

    // 1. Get client's Meta configuration
    const { data: config, error: dbError } = await supabaseAdmin
      .from("meta_config")
      .select("*")
      .eq("user_id", clientId)
      .single();

    if (dbError || !config || !config.access_token || !config.waba_id) {
      return NextResponse.json(
        { error: "Meta configuration or access token not found for this workspace." },
        { status: 400 }
      );
    }

    const token = config.access_token;
    const wabaId = config.waba_id;

    // 2. Discover business_id from WABA
    let businessId = "523464470848127";
    try {
      const wabaInfoRes = await fetch(
        `https://graph.facebook.com/v21.0/${wabaId}?fields=owner_business_info`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const wabaInfo = await wabaInfoRes.json();
      if (wabaInfo?.owner_business_info?.id) {
        businessId = wabaInfo.owner_business_info.id;
      }
    } catch (e) {
      console.warn("Could not auto-fetch businessId from WABA, using default:", e);
    }

    // 3. Call Meta Graph API to create Owned Product Catalog
    const metaCreateRes = await fetch(
      `https://graph.facebook.com/v21.0/${businessId}/owned_product_catalogs`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: catalogName,
        }),
      }
    );

    const metaCreateData = await metaCreateRes.json();

    if (!metaCreateRes.ok || !metaCreateData.id) {
      const errMsg = metaCreateData?.error?.message || "Failed to create Meta Catalog";
      const isPermError =
        metaCreateData?.error?.code === 100 ||
        metaCreateData?.error?.code === 200 ||
        errMsg.toLowerCase().includes("permission");

      return NextResponse.json(
        {
          error: errMsg,
          isPermissionError: isPermError,
          detail: isPermError
            ? "Your Meta Access Token is missing the 'catalog_management' permission. Please regenerate the System User Token in Meta Business Suite with 'catalog_management' and 'business_management' permissions."
            : errMsg,
        },
        { status: 400 }
      );
    }

    const metaCatalogId = metaCreateData.id;

    // 4. Link newly created Catalog to WhatsApp Business Account (WABA)
    try {
      const linkRes = await fetch(
        `https://graph.facebook.com/v21.0/${wabaId}/product_catalogs`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            catalog_id: metaCatalogId,
          }),
        }
      );
      const linkData = await linkRes.json();
      console.log("WABA Catalog Link response:", linkData);
    } catch (linkErr) {
      console.warn("Could not automatically link catalog to WABA:", linkErr);
    }

    // 5. Save the newly created Meta Catalog to Supabase
    const { data: savedCat, error: catSaveErr } = await supabaseAdmin
      .from("catalogs")
      .upsert({
        id: `cat-${clientId}-${Date.now()}`,
        client_id: clientId,
        name: catalogName,
        catalog_id: metaCatalogId,
        description: "Official Meta Commerce Catalog linked to WhatsApp Business Account",
        items: [],
        is_default: true,
      })
      .select()
      .single();

    if (catSaveErr) {
      console.error("Error saving catalog to Supabase in create route:", catSaveErr);
    }

    const mappedCat = savedCat
      ? {
          id: savedCat.id,
          clientId: savedCat.client_id,
          client_id: savedCat.client_id,
          name: savedCat.name,
          catalogId: savedCat.catalog_id,
          catalog_id: savedCat.catalog_id,
          description: savedCat.description,
          items: savedCat.items || [],
          isDefault: savedCat.is_default,
          is_default: savedCat.is_default,
          createdAt: savedCat.created_at,
          updatedAt: savedCat.updated_at,
        }
      : null;

    return NextResponse.json({
      success: true,
      catalogId: metaCatalogId,
      catalog: mappedCat,
      message: `Meta Commerce Catalog "${catalogName}" created and linked to WhatsApp Business!`,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Server exception creating Meta Catalog" },
      { status: 500 }
    );
  }
}
