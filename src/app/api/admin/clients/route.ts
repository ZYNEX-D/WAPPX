import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, businessName, email, phone, password } = body;

    if (!name || !businessName || !email) {
      return NextResponse.json(
        { error: "Name, businessName, and email are required" },
        { status: 400 }
      );
    }

    const trimmedEmail = email.trim().toLowerCase();
    const userPassword = password && password.trim() ? password.trim() : "ZynexClient2026!";
    const clientId = `client-${Date.now()}`;
    const randomStr = Math.random().toString(36).substring(2, 8);
    const verifyToken = `zynex_vt_${clientId}_${randomStr}`;

    // 1. Insert into clients table
    const { data: createdClient, error: clientError } = await supabaseAdmin
      .from("clients")
      .insert({
        id: clientId,
        name: name.trim(),
        business_name: businessName.trim(),
        email: trimmedEmail,
        phone: phone?.trim() || "",
        verify_token: verifyToken,
        status: "active",
      })
      .select()
      .single();

    if (clientError) {
      console.error("[Create Client] Database error:", clientError);
      return NextResponse.json({ error: clientError.message }, { status: 500 });
    }

    // 2. Initialize default meta_config for this client
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://wappx.zynexdev.com";
    await supabaseAdmin.from("meta_config").insert({
      id: clientId,
      user_id: clientId,
      business_name: businessName.trim(),
      phone_number_id: "",
      waba_id: "",
      access_token: "",
      verify_token: verifyToken,
      webhook_url: `${appUrl}/api/webhook`,
      is_connected: false,
    });

    // 3. Create or update user in Supabase Auth so they can log in
    try {
      const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
      const existingUser = existingUsers?.users?.find(
        (u) => u.email?.toLowerCase() === trimmedEmail
      );

      if (existingUser) {
        await supabaseAdmin.auth.admin.updateUserById(existingUser.id, {
          password: userPassword,
          user_metadata: {
            name: name.trim(),
            business_name: businessName.trim(),
            role: "client",
            clientId: clientId,
          },
        });
        console.log(`[Create Client] Updated existing auth user for ${trimmedEmail}`);
      } else {
        await supabaseAdmin.auth.admin.createUser({
          email: trimmedEmail,
          password: userPassword,
          email_confirm: true,
          user_metadata: {
            name: name.trim(),
            business_name: businessName.trim(),
            role: "client",
            clientId: clientId,
          },
        });
        console.log(`[Create Client] Created new auth user for ${trimmedEmail}`);
      }
    } catch (authError) {
      console.warn("[Create Client] Auth creation warning (non-fatal):", authError);
    }

    return NextResponse.json({
      success: true,
      client: createdClient,
      initialPassword: userPassword,
    });
  } catch (error) {
    console.error("[Create Client] Unexpected error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create client" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const clientId = searchParams.get("clientId");

    if (!clientId) {
      return NextResponse.json({ error: "clientId is required" }, { status: 400 });
    }

    // Get client email to delete auth user
    const { data: client } = await supabaseAdmin
      .from("clients")
      .select("email")
      .eq("id", clientId)
      .maybeSingle();

    if (client?.email) {
      try {
        const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
        const existing = existingUsers?.users?.find(
          (u) => u.email?.toLowerCase() === client.email.toLowerCase()
        );
        if (existing) {
          await supabaseAdmin.auth.admin.deleteUser(existing.id);
        }
      } catch (authErr) {
        console.warn("[Delete Client] Auth deletion error:", authErr);
      }
    }

    // Delete records from database
    await supabaseAdmin.from("clients").delete().eq("id", clientId);
    await supabaseAdmin.from("meta_config").delete().eq("user_id", clientId);
    await supabaseAdmin.from("contacts").delete().eq("user_id", clientId);
    await supabaseAdmin.from("messages").delete().eq("user_id", clientId);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete client" },
      { status: 500 }
    );
  }
}
