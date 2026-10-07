import { BookOpen, Church } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { AppHeader } from "@/components/layout/app-header";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { Card, CardContent } from "@/components/ui/card";
import {
  getExternalReading,
  isBibleCitation,
  translateReference,
} from "@/lib/external-daily-content";

export const instant = false;

function getCurrentDate() {
  return new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "America/Mexico_City",
    year: "numeric",
  }).format(new Date());
}

export default async function LecturasPage() {
  const supabase = await createClient();
  const fechaActual = getCurrentDate();
  const { data, error } = await supabase
    .from("lecturas")
    .select("id, fecha, tiempo_liturgico, primera_lectura, salmo, segunda_lectura, evangelio, created_at")
    .eq("fecha", fechaActual)
    .eq("status", "published")
    .order("id", { ascending: true })
    .limit(1);

  if (error) throw new Error(`No se pudieron cargar las lecturas: ${error.message}`);
  const localReading = data?.[0] ?? null;
  const externalReading = localReading ? null : await getExternalReading(fechaActual);
  const lectura = localReading ?? externalReading;
  const readingSections = lectura
    ? (await Promise.all([
      resolveReadingSection("Primera lectura", lectura.primera_lectura, externalReading?.texto_primera_lectura),
      resolveReadingSection("Salmo", lectura.salmo, externalReading?.texto_salmo),
      resolveReadingSection("Segunda lectura", lectura.segunda_lectura, externalReading?.texto_segunda_lectura),
      resolveReadingSection("Evangelio", lectura.evangelio, externalReading?.texto_evangelio),
    ])).filter((section): section is NonNullable<typeof section> => section !== null)
    : [];

  return (
    <div className="min-h-screen bg-background pb-24 lg:pb-0">
      <AppHeader />
      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 md:py-16">
        <div className="flex items-center gap-3 text-accent">
          <BookOpen aria-hidden="true" className="size-5" />
          <p className="text-xs font-semibold uppercase tracking-[0.18em]">Palabra de hoy</p>
        </div>
        <h1 className="mt-3 font-serif text-4xl font-semibold tracking-tight sm:text-5xl">Lecturas del día</h1>
        <p className="mt-4 text-muted-foreground">
          {new Intl.DateTimeFormat("es-MX", { dateStyle: "long", timeZone: "America/Mexico_City" }).format(new Date())}
        </p>
        {lectura ? (
          <div className="mt-8 space-y-4">
            <Card className="border-gold/30 bg-gold/10">
              <CardContent className="p-6 sm:p-8">
                <div className="flex items-center gap-3">
                  <Church aria-hidden="true" className="size-5 text-accent" />
                  <h2 className="font-serif text-2xl font-semibold">{lectura.tiempo_liturgico ?? "Tiempo litúrgico"}</h2>
                </div>
                <p className="mt-3 text-sm text-muted-foreground">Lecturas correspondientes al {lectura.fecha}{!data?.[0] ? " · Fuente externa" : ""}.</p>
              </CardContent>
            </Card>
            {readingSections.map((section) => <ReadingSection key={section.title} {...section} />)}
          </div>
        ) : (
          <Card className="mt-8">
            <CardContent className="p-6 sm:p-8">
              <h2 className="font-serif text-2xl font-semibold">No hay lecturas para hoy</h2>
              <p className="mt-3 leading-7 text-muted-foreground">Todavía no se ha registrado contenido para el {fechaActual}.</p>
            </CardContent>
          </Card>
        )}
      </main>
      <MobileBottomNav />
    </div>
  );
}

async function resolveReadingSection(
  title: string,
  value: string | null,
  externalText: string | null | undefined
) {
  if (!value && !externalText) return null;
  const isReference = isBibleCitation(value);
  const text = externalText ?? (isReference ? null : value);
  return {
    title,
    reference: isReference ? translateReference(value!) : null,
    content: text,
  };
}

function ReadingSection({ title, reference, content }: { title: string; reference: string | null; content: string | null }) {
  if (!reference && !content) return null;
  return (
    <Card>
      <CardContent className="p-6 sm:p-8">
        <h2 className="font-serif text-2xl font-semibold">{title}</h2>
        {reference ? <p className="mt-2 text-sm font-medium text-accent">{reference}</p> : null}
        <p className="mt-4 whitespace-pre-line leading-8 text-muted-foreground">        {content || "La cita está disponible; el texto completo se mostrará cuando se configure una fuente bíblica católica autorizada."}</p>
      </CardContent>
    </Card>
  );
}
