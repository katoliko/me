import { Heart, UserRound } from "lucide-react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { AppHeader } from "@/components/layout/app-header";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { Card, CardContent } from "@/components/ui/card";
import {
  getExternalSaint,
  getWikipediaSummary,
  translateCelebrationName,
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

export default async function SantoPage() {
  const supabase = await createClient();
  const fechaActual = getCurrentDate();
  const { data, error } = await supabase
    .from("santos")
    .select("id, fecha, nombre, biografia, virtudes, patronazgo, imagen_url, created_at")
    .eq("fecha", fechaActual)
    .eq("status", "published")
    .order("id", { ascending: true })
    .limit(1);

  if (error) throw new Error(`No se pudo cargar el santo del día: ${error.message}`);
  const localSaint = data?.[0] ?? null;
  const externalSaint = localSaint ? null : await getExternalSaint(fechaActual);
  const translatedLocalName = localSaint
    ? translateCelebrationName(localSaint.nombre)
    : null;
  const localSupplement = localSaint && (!localSaint.imagen_url || !localSaint.biografia)
    ? await getWikipediaSummary(translatedLocalName || localSaint.nombre)
    : null;
  const santo = localSaint
    ? {
      ...localSaint,
      nombre: translatedLocalName || "Santo del día",
      biografia: localSaint.biografia || localSupplement?.extract || "Información biográfica no disponible.",
      virtudes: localSaint.virtudes || null,
      patronazgo: localSaint.patronazgo || null,
      imagen_url: localSaint.imagen_url || localSupplement?.thumbnail?.source || null,
      tipo: "SAINT",
    }
    : externalSaint;

  return (
    <div className="min-h-screen bg-background pb-24 lg:pb-0">
      <AppHeader />
      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 md:py-16">
        <div className="flex items-center gap-3 text-accent">
          <UserRound aria-hidden="true" className="size-5" />
          <p className="text-xs font-semibold uppercase tracking-[0.18em]">Testimonio de santidad</p>
        </div>
        <h1 className="mt-3 font-serif text-4xl font-semibold tracking-tight sm:text-5xl">
          {santo?.tipo === "SUNDAY" ? "Celebración litúrgica de hoy" : "Santo del día"}
        </h1>
        <p className="mt-4 text-muted-foreground">
          {new Intl.DateTimeFormat("es-MX", { dateStyle: "long", timeZone: "America/Mexico_City" }).format(new Date())}
        </p>
        {santo ? (
          <article className="mt-8 space-y-4">
            <Card className="border-gold/30 bg-gold/10">
              <CardContent className="p-6 sm:p-8">
                {santo.imagen_url ? (
                  <Image src={santo.imagen_url} alt={`Imagen de ${santo.nombre}`} width={1200} height={630} unoptimized className="mb-6 max-h-80 w-full rounded-xl object-cover" />
                ) : null}
                <h2 className="font-serif text-3xl font-semibold">{santo.nombre}</h2>
                <p className="mt-5 whitespace-pre-line text-lg leading-8 text-foreground/85">{santo.biografia}</p>
                {!data?.[0] ? <p className="mt-4 text-xs text-muted-foreground">Información obtenida de una fuente externa.</p> : null}
              </CardContent>
            </Card>
            <SaintSection title="Virtudes" content={santo.virtudes} />
            <SaintSection title="Patronazgo" content={santo.patronazgo} icon />
          </article>
        ) : (
          <Card className="mt-8">
            <CardContent className="p-6 sm:p-8">
              <h2 className="font-serif text-2xl font-semibold">Aún no hay un santo registrado para hoy</h2>
              <p className="mt-3 leading-7 text-muted-foreground">Vuelve más tarde para conocer al santo que la Iglesia celebra el {fechaActual}.</p>
            </CardContent>
          </Card>
        )}
      </main>
      <MobileBottomNav />
    </div>
  );
}

function SaintSection({ title, content, icon = false }: { title: string; content: string | null; icon?: boolean }) {
  if (!content) return null;
  return (
    <Card>
      <CardContent className="p-6 sm:p-8">
        <div className="flex items-center gap-3">
          {icon ? <Heart aria-hidden="true" className="size-5 text-accent" /> : null}
          <h2 className="font-serif text-2xl font-semibold">{title}</h2>
        </div>
        <p className="mt-4 whitespace-pre-line leading-8 text-muted-foreground">{content}</p>
      </CardContent>
    </Card>
  );
}
