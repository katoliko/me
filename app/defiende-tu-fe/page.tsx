import Link from "next/link";
import Image from "next/image";
import { BookOpen, ChevronRight, ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { AppHeader } from "@/components/layout/app-header";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { Card, CardContent } from "@/components/ui/card";
import { stripRichText } from "@/lib/content";

export const instant = false;

export default async function DefiendeTuFePage() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("articulos")
    .select(
      "id, titulo, slug, contenido, imagen_url, fecha, categoria, pregunta, respuesta_breve, citas_biblicas, fuentes, destacado, created_at",
    )
    .eq("status", "published")
    .order("destacado", { ascending: false })
    .order("fecha", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false, nullsFirst: false })
    .order("id", { ascending: false });

  if (error) {
    throw new Error(`No se pudieron cargar los artículos: ${error.message}`);
  }

  return (
    <div className="min-h-screen bg-background pb-24 lg:pb-0">
      <AppHeader />

      <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6 md:py-16">
        <div className="max-w-3xl">
          <div className="flex items-center gap-3 text-accent">
            <ShieldCheck aria-hidden="true" className="size-5" />
            <p className="text-xs font-semibold uppercase tracking-[0.18em]">
              Formación y comunidad
            </p>
          </div>
          <h1 className="mt-3 font-serif text-4xl font-semibold tracking-tight sm:text-5xl">
            Defiende tu fe
          </h1>
          <p className="mt-4 text-base leading-7 text-muted-foreground sm:text-lg">
            Preguntas, respuestas y artículos para comprender y explicar la fe
            católica con claridad, respeto y esperanza.
          </p>
        </div>

        {data.length > 0 ? (
          <div className="mt-10 grid gap-5 md:grid-cols-2">
            {data.map((articulo) => (
              <ArticleCard
                key={articulo.id}
                slug={articulo.slug}
                title={articulo.titulo}
                imageUrl={articulo.imagen_url}
                date={articulo.fecha}
                category={articulo.categoria}
                content={articulo.contenido}
                featured={Boolean(articulo.destacado)}
              />
            ))}
          </div>
        ) : (
          <Card className="mt-10">
            <CardContent className="p-6 sm:p-8">
              <h2 className="font-serif text-2xl font-semibold">
                Próximamente encontrarás nuevos temas
              </h2>
              <p className="mt-3 leading-7 text-muted-foreground">
                Estamos preparando respuestas y recursos para ayudarte a
                profundizar en tu fe.
              </p>
            </CardContent>
          </Card>
        )}
      </main>

      <MobileBottomNav />
    </div>
  );
}

function ArticleCard({
  slug,
  title,
  imageUrl,
  date,
  category,
  content,
  featured,
}: {
  slug: string | null;
  title: string | null;
  imageUrl: string | null;
  date: string | null;
  category: string | null;
  content: string | null;
  featured: boolean;
}) {
  const excerpt = content ? stripRichText(content) : null;

  return (
    <Card className={featured ? "border-gold/40 bg-gold/10" : undefined}>
      <CardContent className="flex h-full flex-col p-0">
        {imageUrl ? (
          // Article images can be hosted outside the configured Next.js image domains.
          <Image
            src={imageUrl}
            alt={title ? `Imagen de ${title}` : "Imagen del artículo"}
            width={640}
            height={360}
            unoptimized
            className="h-56 w-full rounded-t-2xl object-cover"
          />
        ) : null}

        <div className="flex h-full flex-col p-6 sm:p-7">
        <div className="flex items-center gap-3 text-accent">
          <BookOpen aria-hidden="true" className="size-5" />
          <span className="text-xs font-semibold uppercase tracking-[0.16em]">
            {category || "Apologética"}
          </span>
          {featured ? <span className="text-xs font-semibold uppercase tracking-[0.16em]">Destacado</span> : null}
        </div>
        <h2 className="mt-5 font-serif text-2xl font-semibold">
          {title || "Artículo de apologética"}
        </h2>
        {date ? <p className="mt-5 text-sm text-muted-foreground">Fecha: {date}</p> : null}
        {excerpt ? (
          <p className="mt-4 line-clamp-3 leading-7 text-muted-foreground">
            {excerpt}
          </p>
        ) : null}
        {slug ? (
          <Link
            href={`/defiende-tu-fe/${slug}`}
            className="mt-6 inline-flex min-h-11 items-center gap-2 self-start rounded-xl border border-input px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-secondary"
          >
            Leer artículo
            <ChevronRight aria-hidden="true" className="size-4" />
          </Link>
        ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
