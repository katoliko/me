import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/env";

export async function GET() {
  if (!hasSupabaseEnv()) {
    return NextResponse.json(
      { ok: false, configured: false, authenticated: false },
      { status: 503 },
    );
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getUser();
    const isUnauthenticated =
      error?.status === 401 || error?.name === "AuthSessionMissingError";

    if (error && !isUnauthenticated) {
      return NextResponse.json(
        { ok: false, configured: true, authenticated: false },
        { status: 503 },
      );
    }

    return NextResponse.json({
      ok: true,
      configured: true,
      authenticated: Boolean(data.user),
    });
  } catch {
    return NextResponse.json(
      { ok: false, configured: true, authenticated: false },
      { status: 503 },
    );
  }
}
