import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, BookOpen } from "lucide-react";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppHeader } from "@/components/layout/app-header";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { sanitizeRichText } from "@/lib/content";

export const instant = false;

type ArticlePageProps = {
  params: Promise<{ slug: string }>;
};

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: article, error } = await supabase
    .from("articulos")
    .select(
      "id, titulo, contenido, imagen_url, fecha, categoria, pregunta, respuesta_breve, citas_biblicas, fuentes, destacado, created_at, slug",
    )
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (error) {
    throw new Error(`No se pudo cargar el artículo: ${error.message}`);
  }

  if (!article) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-background pb-24 lg:pb-0">
      <AppHeader />
      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 md:py-16">
        <Link
          href="/defiende-tu-fe"
          className="inline-flex items-center gap-2 text-sm font-semibold text-accent hover:underline"
        >
          <ArrowLeft aria-hidden="true" className="size-4" />
          Volver a Defiende tu fe
        </Link>

        <article className="mt-8">
          <div className="flex items-center gap-3 text-accent">
            <BookOpen aria-hidden="true" className="size-5" />
            <p className="text-xs font-semibold uppercase tracking-[0.18em]">
              {article.categoria || "Formación"}
            </p>
          </div>
          <h1 className="mt-4 font-serif text-4xl font-semibold tracking-tight sm:text-5xl">
            {article.titulo || "Artículo"}
          </h1>
          {article.fecha ? (
            <p className="mt-4 text-sm text-muted-foreground">
              {formatDate(article.fecha)}
            </p>
          ) : null}

          {article.imagen_url ? (
            // Article images can be hosted outside the configured Next.js image domains.
            <Image
              src={article.imagen_url}
              alt={article.titulo ? `Imagen de ${article.titulo}` : "Imagen del artículo"}
              width={1200}
              height={630}
              unoptimized
              className="mt-8 max-h-96 w-full rounded-2xl object-cover"
            />
          ) : null}

          {article.pregunta ? (
            <ArticleSection title="Pregunta" content={article.pregunta} />
          ) : null}
          {article.respuesta_breve ? (
            <Card className="mt-8 border-gold/40 bg-gold/10">
              <CardContent className="p-6 sm:p-8">
                <h2 className="font-serif text-2xl font-semibold">
                  Respuesta breve
                </h2>
                <div className="prose prose-stone mt-4 max-w-none text-lg leading-8 text-foreground/85" dangerouslySetInnerHTML={{ __html: sanitizeRichText(article.respuesta_breve) }} />
              </CardContent>
            </Card>
          ) : null}
          {article.contenido ? (
            <ArticleSection title="Contenido" content={article.contenido} />
          ) : null}
          {article.citas_biblicas ? (
            <ArticleSection title="Citas bíblicas" content={article.citas_biblicas} />
          ) : null}
          {article.fuentes ? (
            <ArticleSection title="Fuentes" content={article.fuentes} />
          ) : null}
        </article>

        <Button asChild variant="outline" className="mt-10">
          <Link href="/defiende-tu-fe">
            <ArrowLeft aria-hidden="true" />
            Volver a Defiende tu fe
          </Link>
        </Button>
      </main>
      <MobileBottomNav />
    </div>
  );
}

function ArticleSection({ title, content }: { title: string; content: string }) {
  return (
    <section className="mt-8">
      <h2 className="font-serif text-2xl font-semibold">{title}</h2>
      <div className="prose prose-stone mt-4 max-w-none leading-8 text-muted-foreground" dangerouslySetInnerHTML={{ __html: sanitizeRichText(content) }} />
    </section>
  );
}

function formatDate(value: string) {
  const date = new Date(`${value}T12:00:00`);
  return new Intl.DateTimeFormat("es-MX", { dateStyle: "long" }).format(date);
}
