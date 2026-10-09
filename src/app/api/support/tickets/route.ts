import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { mapTicketFromRow } from "@/lib/supabase/service";
import { SupportTicket, TicketMessage } from "@/types/whatsapp";

/**
 * GET /api/support/tickets?clientId=client-1
 * Fetches tickets for a specific client workspace or all tickets for admin.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const clientId = searchParams.get("clientId");

    let query = supabaseAdmin
      .from("support_tickets")
      .select("*")
      .order("created_at", { ascending: false });

    if (clientId && clientId !== "all" && clientId !== "admin") {
      query = query.eq("client_id", clientId);
    }

    const { data, error } = await query;

    if (error) {
      console.error("GET /api/support/tickets error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const tickets: SupportTicket[] = (data || []).map(mapTicketFromRow);
    return NextResponse.json({ success: true, tickets });
  } catch (err: any) {
    console.error("GET /api/support/tickets exception:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}

/**
 * POST /api/support/tickets
 * Creates a new support ticket submitted by a client.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      clientId = "client-1",
      clientName = "Client",
      businessName = "",
      clientEmail,
      subject,
      category = "technical",
      priority = "medium",
      description,
    } = body;

    if (!subject?.trim() || !description?.trim() || !clientEmail?.trim()) {
      return NextResponse.json(
        { error: "Subject, description, and client email are required." },
        { status: 400 }
      );
    }

    const id = `TICK-${Date.now().toString().slice(-6)}`;
    const now = new Date().toISOString();

    const initialMessage: TicketMessage = {
      id: `msg-${Date.now()}`,
      sender: "client",
      senderName: clientName,
      senderEmail: clientEmail,
      text: description.trim(),
      timestamp: now,
    };

    const newTicketRow = {
      id,
      client_id: clientId,
      client_name: clientName,
      business_name: businessName,
      client_email: clientEmail.trim(),
      subject: subject.trim(),
      category,
      priority,
      status: "open",
      description: description.trim(),
      messages: [initialMessage] as any,
      assigned_admin: "Unassigned",
      created_at: now,
      updated_at: now,
    };

    const { data, error } = await supabaseAdmin
      .from("support_tickets")
      .insert(newTicketRow)
      .select()
      .single();

    if (error) {
      console.error("POST /api/support/tickets insert error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      ticket: mapTicketFromRow(data),
    });
  } catch (err: any) {
    console.error("POST /api/support/tickets exception:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}

/**
 * PATCH /api/support/tickets
 * Updates status, priority, assigns admin, or adds a reply message.
 */
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      ticketId,
      status,
      priority,
      category,
      assignedAdmin,
      resolutionNotes,
      replyMessage,
    } = body;

    if (!ticketId) {
      return NextResponse.json({ error: "ticketId is required" }, { status: 400 });
    }

    // 1. Fetch current ticket
    const { data: ticket, error: fetchErr } = await supabaseAdmin
      .from("support_tickets")
      .select("*")
      .eq("id", ticketId)
      .single();

    if (fetchErr || !ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    const updates: any = {
      updated_at: new Date().toISOString(),
    };

    if (status) updates.status = status;
    if (priority) updates.priority = priority;
    if (category) updates.category = category;
    if (assignedAdmin !== undefined) updates.assigned_admin = assignedAdmin;
    if (resolutionNotes !== undefined) updates.resolution_notes = resolutionNotes;

    // Append reply if provided
    if (replyMessage && replyMessage.text?.trim()) {
      const currentMessages: TicketMessage[] = Array.isArray(ticket.messages)
        ? (ticket.messages as unknown as TicketMessage[])
        : [];
      const newMsg: TicketMessage = {
        id: `msg-${Date.now()}`,
        sender: replyMessage.sender || "admin",
        senderName: replyMessage.senderName || (replyMessage.sender === "admin" ? "Platform Support" : ticket.client_name),
        senderEmail: replyMessage.senderEmail,
        text: replyMessage.text.trim(),
        timestamp: new Date().toISOString(),
        attachments: replyMessage.attachments || [],
      };
      updates.messages = [...currentMessages, newMsg];

      // Auto update status if client replies to waiting ticket
      if (replyMessage.sender === "client" && ticket.status === "waiting_client") {
        updates.status = "in_progress";
      }
      // Auto update status if admin replies to open ticket
      if (replyMessage.sender === "admin" && ticket.status === "open") {
        updates.status = "in_progress";
      }
    }

    const { data: updated, error: updateErr } = await supabaseAdmin
      .from("support_tickets")
      .update(updates)
      .eq("id", ticketId)
      .select()
      .single();

    if (updateErr) {
      console.error("PATCH /api/support/tickets error:", updateErr);
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      ticket: mapTicketFromRow(updated),
    });
  } catch (err: any) {
    console.error("PATCH /api/support/tickets exception:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
