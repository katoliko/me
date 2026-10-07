import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const subscription = await request.json().catch(() => null) as {
    endpoint?: string;
    keys?: { p256dh?: string; auth?: string };
  } | null;
  if (
    !subscription?.endpoint ||
    subscription.endpoint.length > 2048 ||
    !subscription.keys?.p256dh ||
    !subscription.keys.auth
  ) {
    return NextResponse.json({ error: "Suscripción no válida" }, { status: 400 });
  }
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { error } = await supabase.from("notification_subscriptions").upsert({
    endpoint: subscription.endpoint,
    subscription,
    user_id: user?.id ?? null,
    enabled: true,
  }, { onConflict: "endpoint" });
  if (error) return NextResponse.json({ error: "No se pudo guardar la suscripción" }, { status: 500 });
  return NextResponse.json({ ok: true });
}
