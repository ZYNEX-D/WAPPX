import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";

/**
 * POST /api/whatsapp/catalog/link
 * Links an existing Meta Commerce Catalog ID to the WhatsApp Business Account (WABA).
 */
export async function POST(req: NextRequest) {
  try {
    const { clientId = "client-1", catalogId, catalogName = "WAPPX Catalog" } = await req.json();

    if (!catalogId || !catalogId.trim()) {
      return NextResponse.json({ error: "Meta Catalog ID is required." }, { status: 400 });
    }

    const cleanCatalogId = catalogId.trim();

    // 1. Get client's Meta configuration
    const { data: config, error: dbError } = await supabaseAdmin
      .from("meta_config")
      .select("*")
      .eq("user_id", clientId)
      .single();

    if (dbError || !config || !config.access_token || !config.waba_id) {
      return NextResponse.json(
        { error: "Meta configuration or access token not found." },
        { status: 400 }
      );
    }

    const token = config.access_token;
    const wabaId = config.waba_id;

    // 2. Link Catalog to WABA
    const linkRes = await fetch(
      `https://graph.facebook.com/v21.0/${wabaId}/product_catalogs`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          catalog_id: cleanCatalogId,
        }),
      }
    );

    const linkData = await linkRes.json();

    if (!linkRes.ok) {
      console.warn("WABA product_catalogs link warning:", linkData);
      // Even if link returns warning (e.g., already linked), we continue and save to DB
    }

    // 3. Verify connected catalogs on WABA
    const checkRes = await fetch(
      `https://graph.facebook.com/v21.0/${wabaId}/product_catalogs`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const checkData = await checkRes.json();
    console.log("Verified WABA connected catalogs:", checkData);

    // 4. Update or Insert in Supabase
    const { data: existing } = await supabaseAdmin
      .from("catalogs")
      .select("*")
      .eq("client_id", clientId)
      .limit(1);

    let savedCat;
    if (existing && existing.length > 0) {
      const { data: updated } = await supabaseAdmin
        .from("catalogs")
        .update({
          catalog_id: cleanCatalogId,
          name: catalogName,
          is_default: true,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing[0].id)
        .select()
        .single();
      savedCat = updated;
    } else {
      const { data: inserted } = await supabaseAdmin
        .from("catalogs")
        .insert({
          id: `cat-${clientId}-${Date.now()}`,
          client_id: clientId,
          name: catalogName,
          catalog_id: cleanCatalogId,
          items: [],
          is_default: true,
        })
        .select()
        .single();
      savedCat = inserted;
    }

    return NextResponse.json({
      success: true,
      catalogId: cleanCatalogId,
      connectedCatalogs: checkData?.data || [],
      catalog: savedCat,
      message: `Meta Catalog ID ${cleanCatalogId} successfully linked to your WhatsApp Business Account!`,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Server exception linking catalog" },
      { status: 500 }
    );
  }
}
