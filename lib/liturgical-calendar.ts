export type LiturgicalDay = { celebration: string; season: string; color: string; source: "api" | "local" | "fallback" };

function fallbackLiturgicalDay(date: Date): LiturgicalDay {
  const month = Number(new Intl.DateTimeFormat("en-US", { timeZone: "America/Mexico_City", month: "numeric" }).format(date));
  const day = Number(new Intl.DateTimeFormat("en-US", { timeZone: "America/Mexico_City", day: "numeric" }).format(date));

  if ((month === 12 && day >= 17) || (month === 1 && day <= 13)) {
    return { celebration: "Tiempo de Navidad", season: "Navidad", color: "Blanco", source: "fallback" };
  }
  if (month === 12 || (month === 1 && day <= 6)) {
    return { celebration: "Tiempo de Adviento", season: "Adviento", color: "Morado", source: "fallback" };
  }
  return { celebration: "Tiempo litúrgico del día", season: "Tiempo Ordinario", color: "Verde", source: "fallback" };
}

export async function getLiturgicalDay(date = new Date()): Promise<LiturgicalDay | null> {
  const dateValue = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Mexico_City" }).format(date);
  const endpoint = process.env.LITURGICAL_CALENDAR_API_URL || "https://litcal.johnromanodorazio.com";
  try {
      const response = await fetch(`${endpoint.replace(/\/$/, "")}/calendar/roman/nation/MX/${dateValue.slice(0, 4)}.json?locale=es_MX`, { headers: { accept: "application/json" }, next: { revalidate: 86400 } });
      if (response.ok) {
        const payload = await response.json() as { litcal?: Record<string, { name?: string; liturgical_season?: string; color?: string }>; [key: string]: unknown };
        const item = payload.litcal?.[dateValue] ?? (payload[dateValue] as { name?: string; liturgical_season?: string; color?: string } | undefined);
        if (item) return { celebration: item.name || "Celebración del día", season: item.liturgical_season || "Tiempo litúrgico", color: item.color || "Verde", source: "api" };
      }
    } catch {
      // Use the local catalogue when the external service is unavailable.
    }
  const supabase = await (await import("@/lib/supabase/server")).createClient();
  const { data } = await supabase.from("liturgical_calendar").select("celebracion, tiempo_liturgico, color").eq("fecha", dateValue).eq("activo", true).limit(1).maybeSingle();
  return data
    ? { celebration: data.celebracion, season: data.tiempo_liturgico, color: data.color, source: "local" }
    : fallbackLiturgicalDay(date);
}
