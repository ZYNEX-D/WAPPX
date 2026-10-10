import { NextRequest, NextResponse } from "next/server";
import { discoverPagesAndInstagram } from "@/lib/meta-client";

export async function POST(req: NextRequest) {
  try {
    const { accessToken } = await req.json();

    if (!accessToken || typeof accessToken !== "string") {
      return NextResponse.json({ error: "Access Token is required" }, { status: 400 });
    }

    const result = await discoverPagesAndInstagram(accessToken.trim());
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Social discovery failed" },
      { status: 500 }
    );
  }
}
