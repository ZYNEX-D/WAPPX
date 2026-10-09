import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { CatalogItem, MetaReviewStatus } from "@/types/whatsapp";

/**
 * GET /api/whatsapp/catalog/sync?clientId=client-1
 * Fetches real-time Meta Commerce Review & Approval statuses for all products
 * in the active catalog and synchronizes the local database.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const clientId = searchParams.get("clientId") || "client-1";

    // 1. Get client's Meta configuration
    const { data: config } = await supabaseAdmin
      .from("meta_config")
      .select("*")
      .eq("user_id", clientId)
      .maybeSingle();

    if (!config || !config.access_token) {
      return NextResponse.json(
        { error: "Meta configuration or access token not found." },
        { status: 400 }
      );
    }

    const token = config.access_token;

    // 2. Get active catalog for this client
    const { data: catalogs, error: catError } = await supabaseAdmin
      .from("catalogs")
      .select("*")
      .eq("client_id", clientId);

    if (catError || !catalogs || catalogs.length === 0) {
      return NextResponse.json(
        { error: "No catalogs found for this workspace." },
        { status: 404 }
      );
    }

    const activeCat = catalogs.find((c) => c.is_default) || catalogs[0];
    const catalogId = activeCat.catalog_id;

    if (!catalogId) {
      return NextResponse.json(
        { error: "Active catalog does not have a linked Meta Catalog ID." },
        { status: 400 }
      );
    }

    // 3. Query Meta Graph API for products in this catalog
    const metaRes = await fetch(
      `https://graph.facebook.com/v21.0/${catalogId}/products?fields=id,retailer_id,name,capability_to_review_status,review_status,availability,visibility,price,currency,image_url`,
      {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      }
    );

    const metaData = await metaRes.json();

    if (!metaRes.ok) {
      return NextResponse.json(
        {
          error: metaData?.error?.message || "Failed to query Meta Commerce catalog products.",
          details: metaData?.error,
        },
        { status: 502 }
      );
    }

    const metaProducts: any[] = Array.isArray(metaData.data) ? metaData.data : [];

    // Map Meta products by retailer_id
    const metaMap = new Map<string, any>();
    metaProducts.forEach((p) => {
      if (p.retailer_id) metaMap.set(p.retailer_id, p);
    });

    const localItems: CatalogItem[] = Array.isArray(activeCat.items)
      ? (activeCat.items as unknown as CatalogItem[])
      : [];

    let approvedCount = 0;
    let pendingCount = 0;
    let rejectedCount = 0;
    let notSyncedCount = 0;

    const updatedItems = localItems.map((item) => {
      const metaItem = item.retailerId ? metaMap.get(item.retailerId) : undefined;
      if (!metaItem) {
        notSyncedCount++;
        return {
          ...item,
          reviewStatus: "NOT_SYNCED" as MetaReviewStatus,
        };
      }

      const whatsappCap = metaItem.capability_to_review_status?.find(
        (c: any) => c.key === "WHATSAPP"
      );

      let status: MetaReviewStatus = "PENDING";
      const val = (whatsappCap?.value || metaItem.review_status || "").toUpperCase();

      if (val === "APPROVED") {
        status = "APPROVED";
        approvedCount++;
      } else if (val === "REJECTED") {
        status = "REJECTED";
        rejectedCount++;
      } else if (val === "OUTDATED") {
        status = "OUTDATED";
        approvedCount++; // Outdated items still deliver while edits re-index
      } else if (val === "NO_REVIEW" || val === "PENDING" || !val) {
        status = "PENDING";
        pendingCount++;
      }

      return {
        ...item,
        metaProductId: metaItem.id,
        reviewStatus: status,
      };
    });

    // Save updated items back to Supabase
    await supabaseAdmin
      .from("catalogs")
      .update({
        items: updatedItems as any,
        updated_at: new Date().toISOString(),
      })
      .eq("id", activeCat.id);

    return NextResponse.json({
      success: true,
      catalogId,
      catalogName: activeCat.name,
      totalProducts: updatedItems.length,
      approvedCount,
      pendingCount,
      rejectedCount,
      notSyncedCount,
      items: updatedItems,
    });
  } catch (err: any) {
    console.error("GET /api/whatsapp/catalog/sync error:", err);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/whatsapp/catalog/sync
 * Pushes any un-synced local items to Meta Commerce Manager, then updates review statuses.
 */
export async function POST(req: NextRequest) {
  try {
    const { clientId = "client-1" } = await req.json();

    // 1. Get client's Meta configuration
    const { data: config } = await supabaseAdmin
      .from("meta_config")
      .select("*")
      .eq("user_id", clientId)
      .maybeSingle();

    if (!config || !config.access_token) {
      return NextResponse.json(
        { error: "Meta configuration or access token not found." },
        { status: 400 }
      );
    }

    const token = config.access_token;

    // 2. Get active catalog
    const { data: catalogs } = await supabaseAdmin
      .from("catalogs")
      .select("*")
      .eq("client_id", clientId);

    const activeCat = catalogs?.find((c) => c.is_default) || catalogs?.[0];
    const catalogId = activeCat?.catalog_id;

    if (!catalogId) {
      return NextResponse.json(
        { error: "Active catalog does not have a linked Meta Catalog ID." },
        { status: 400 }
      );
    }

    // 3. Query existing Meta items
    const existingRes = await fetch(
      `https://graph.facebook.com/v21.0/${catalogId}/products?fields=id,retailer_id`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const existingData = await existingRes.json();
    const existingSkus = new Set(
      Array.isArray(existingData?.data) ? existingData.data.map((p: any) => p.retailer_id) : []
    );

    const localItems: CatalogItem[] = Array.isArray(activeCat.items)
      ? (activeCat.items as unknown as CatalogItem[])
      : [];

    let uploadedCount = 0;

    // 4. Upload any missing products to Meta Commerce Catalog
    for (const item of localItems) {
      if (!item.retailerId || existingSkus.has(item.retailerId)) continue;

      // Clean price: parse numbers
      const numericPrice = parseFloat((item.price || "0").replace(/[^0-9.]/g, "")) || 10;
      const priceInCents = Math.round(numericPrice * 100);
      const currency = item.currency || "LKR";

      const uploadBody = {
        name: item.title,
        description: item.description || `Official product: ${item.title}`,
        retailer_id: item.retailerId,
        price: priceInCents,
        currency,
        availability: "in stock",
        condition: "new",
        url: item.url || "https://wappx.zynexdev.com",
        image_url:
          item.imageUrl ||
          "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=600&q=80",
        category: "Software",
        brand: "ZYNEX",
      };

      try {
        const createRes = await fetch(
          `https://graph.facebook.com/v21.0/${catalogId}/products`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(uploadBody),
          }
        );
        const createData = await createRes.json();
        if (createRes.ok && createData.id) {
          uploadedCount++;
          item.metaProductId = createData.id;
          item.reviewStatus = "PENDING";
        }
      } catch (uploadErr) {
        console.warn(`Failed to upload ${item.retailerId} to Meta:`, uploadErr);
      }
    }

    // Now re-fetch statuses via GET logic
    const syncRes = await fetch(
      `${req.nextUrl.origin}/api/whatsapp/catalog/sync?clientId=${clientId}`,
      { cache: "no-store" }
    );
    const syncData = await syncRes.json();

    return NextResponse.json({
      success: true,
      uploadedCount,
      ...syncData,
    });
  } catch (err: any) {
    console.error("POST /api/whatsapp/catalog/sync error:", err);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}
