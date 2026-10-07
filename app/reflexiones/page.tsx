import { Heart, Lightbulb } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { AppHeader } from "@/components/layout/app-header";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { Card, CardContent } from "@/components/ui/card";
import { getExternalReading, generateAiReflection } from "@/lib/external-daily-content";

export const instant = false;

function getCurrentDate() {
  return new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "America/Mexico_City",
    year: "numeric",
  }).format(new Date());
}

export default async function ReflexionesPage() {
  const supabase = await createClient();
  const fechaActual = getCurrentDate();

  const { data, error } = await supabase
    .from("reflexiones")
    .select(
      "id, fecha, titulo, contenido, pregunta, oracion, proposito, created_at",
    )
    .eq("fecha", fechaActual)
    .eq("status", "published")
    .order("id", { ascending: true })
    .limit(1);

  if (error) {
    throw new Error(`No se pudo cargar la reflexión: ${error.message}`);
  }

  let reflexion = data?.[0];
  let generated = false;
  let generatedByAi = false;
  if (!reflexion) {
    const reading = await getExternalReading(fechaActual);
    const generatedReflection = reading ? await generateAiReflection(reading) : null;
    if (generatedReflection) {
      reflexion = { id: "external", created_at: null, fecha: fechaActual, ...generatedReflection };
      generated = true;
      generatedByAi = generatedReflection.source === "gemini";
    }
  }

  return (
    <div className="min-h-screen bg-background pb-24 lg:pb-0">
      <AppHeader />

      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 md:py-16">
        <div className="flex items-center gap-3 text-accent">
          <Lightbulb aria-hidden="true" className="size-5" />
          <p className="text-xs font-semibold uppercase tracking-[0.18em]">
            Un momento para el alma
          </p>
        </div>
        <h1 className="mt-3 font-serif text-4xl font-semibold tracking-tight sm:text-5xl">
          Reflexión del día
        </h1>
        <p className="mt-4 text-muted-foreground">
          {new Intl.DateTimeFormat("es-MX", {
            dateStyle: "long",
            timeZone: "America/Mexico_City",
          }).format(new Date())}
        </p>

        {reflexion ? (
          <article className="mt-8 space-y-4">
            <Card className="border-gold/30 bg-gold/10">
              <CardContent className="p-6 sm:p-8">
                <h2 className="font-serif text-3xl font-semibold">
                  {reflexion.titulo}{generated ? generatedByAi ? " · Generada con IA" : " · Generada automáticamente" : ""}
                </h2>
                <p className="mt-5 whitespace-pre-line text-lg leading-8 text-foreground/85">
                  {reflexion.contenido}
                </p>
                {generated ? <p className="mt-4 text-xs text-muted-foreground">Reflexión generada a partir de las referencias de las lecturas del día. Revisa el contenido antes de publicarlo.</p> : null}
              </CardContent>
            </Card>

            <ReflectionSection
              title="Pregunta para meditar"
              content={reflexion.pregunta}
            />
            <ReflectionSection title="Oración" content={reflexion.oracion} icon />
            <ReflectionSection
              title="Propósito del día"
              content={reflexion.proposito}
            />
          </article>
        ) : (
          <Card className="mt-8">
            <CardContent className="p-6 sm:p-8">
              <h2 className="font-serif text-2xl font-semibold">
                Aún no hay una reflexión para hoy
              </h2>
              <p className="mt-3 leading-7 text-muted-foreground">
                Vuelve más tarde para encontrar una palabra que acompañe tu
                día.
              </p>
            </CardContent>
          </Card>
        )}
      </main>

      <MobileBottomNav />
    </div>
  );
}

function ReflectionSection({
  title,
  content,
  icon = false,
}: {
  title: string;
  content: string | null;
  icon?: boolean;
}) {
  if (!content) {
    return null;
  }

  return (
    <Card>
      <CardContent className="p-6 sm:p-8">
        <div className="flex items-center gap-3">
          {icon ? (
            <Heart aria-hidden="true" className="size-5 text-accent" />
          ) : null}
          <h2 className="font-serif text-2xl font-semibold">{title}</h2>
        </div>
        <p className="mt-4 whitespace-pre-line leading-8 text-muted-foreground">
          {content}
        </p>
      </CardContent>
    </Card>
  );
}
