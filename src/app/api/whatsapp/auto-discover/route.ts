import { NextRequest, NextResponse } from "next/server";
import { discoverMetaAccounts } from "@/lib/meta-client";

export async function POST(req: NextRequest) {
  try {
    const { accessToken, hintWabaId } = await req.json();

    if (!accessToken || typeof accessToken !== "string") {
      return NextResponse.json({ error: "Access Token is required" }, { status: 400 });
    }

    const result = await discoverMetaAccounts(accessToken.trim(), hintWabaId);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Auto-discovery failed" },
      { status: 500 }
    );
  }
}
