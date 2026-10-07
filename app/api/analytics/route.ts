import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as {
    eventName?: string;
    path?: string;
    contentType?: string;
    contentId?: number;
  } | null;
  if (!body || !["page_view", "content_view", "install"].includes(body.eventName ?? "") || !body.path || body.path.length > 500) {
    return NextResponse.json({ error: "Evento no válido" }, { status: 400 });
  }
  const supabase = await createClient();
  const { error } = await supabase.from("analytics_events").insert({
    event_name: body.eventName,
    path: body.path,
    content_type: body.contentType ?? null,
    content_id: Number.isInteger(body.contentId) ? body.contentId : null,
  });
  if (error) return NextResponse.json({ error: "No se pudo registrar el evento" }, { status: 500 });
  return NextResponse.json({ ok: true });
}
