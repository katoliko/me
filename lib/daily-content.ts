import { createClient } from "@/lib/supabase/server";
import { stripRichText } from "@/lib/content";
import {
  generateAiReflection,
  getExternalReading,
  getExternalSaint,
  isBibleCitation,
  translateReference,
} from "@/lib/external-daily-content";

function readingExcerpt(value: string | null) {
  const text = stripRichText(value || "");
  return (isBibleCitation(text) ? translateReference(text) : text).slice(0, 220);
}

function currentDate() {
  return new Intl.DateTimeFormat("en-CA", {
    day: "2-digit", month: "2-digit", year: "numeric",
    timeZone: "America/Mexico_City",
  }).format(new Date());
}

export async function getDailyContent() {
  const supabase = await createClient();
  const date = currentDate();
  const [{ data: reading }, { data: reflection }, { data: saint }] = await Promise.all([
    supabase.from("lecturas").select("tiempo_liturgico, evangelio, primera_lectura").eq("fecha", date).eq("status", "published").limit(1).maybeSingle(),
    supabase.from("reflexiones").select("titulo, contenido").eq("fecha", date).eq("status", "published").limit(1).maybeSingle(),
    supabase.from("santos").select("nombre, biografia").eq("fecha", date).eq("status", "published").limit(1).maybeSingle(),
  ]);
  const externalReading = reading ? null : await getExternalReading(date);
  const externalSaint = saint ? null : await getExternalSaint(date);
  const generatedReflection = reflection || !externalReading ? null : await generateAiReflection(externalReading);
  return {
    date,
    reading: reading
      ? { time: reading.tiempo_liturgico, excerpt: readingExcerpt(reading.evangelio || reading.primera_lectura) }
      : externalReading
        ? { time: externalReading.tiempo_liturgico, excerpt: (externalReading.evangelio || externalReading.primera_lectura || "").slice(0, 220), external: true }
        : null,
    reflection: reflection
      ? { title: reflection.titulo, excerpt: stripRichText(reflection.contenido || "").slice(0, 220) }
      : generatedReflection
        ? { title: generatedReflection.titulo, excerpt: generatedReflection.contenido.slice(0, 220), external: true }
        : null,
    saint: saint
      ? { name: saint.nombre, excerpt: stripRichText(saint.biografia || "").slice(0, 220) }
      : externalSaint
        ? { name: externalSaint.nombre, excerpt: externalSaint.biografia.slice(0, 220), imageUrl: externalSaint.imagen_url, external: true }
        : null,
  };
}
