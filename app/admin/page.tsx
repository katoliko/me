import Link from "next/link";
import { ArrowRight, BarChart3, BookOpen, CalendarDays, Heart, History, Image, Lightbulb, Settings, ShieldCheck, Sparkles, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { requireAdminPanel } from "@/lib/auth";

type ResourceCard = {
  slug: string;
  label: string;
  description: string;
  icon: typeof ShieldCheck;
};

const resources: ResourceCard[] = [
  { slug: "articulos", label: "Artículos", description: "Publica formación, apologética y Defiende tu fe.", icon: ShieldCheck },
  { slug: "lecturas", label: "Lecturas", description: "Organiza la Palabra según el tiempo litúrgico.", icon: BookOpen },
  { slug: "reflexiones", label: "Reflexiones", description: "Acompaña cada día con una reflexión.", icon: Lightbulb },
  { slug: "santos", label: "Santos", description: "Presenta la vida y virtudes de cada santo.", icon: Heart },
  { slug: "oraciones", label: "Oraciones", description: "Reúne oraciones para la comunidad.", icon: Sparkles },
  { slug: "categorias", label: "Categorías", description: "Organiza los artículos con categorías administrables.", icon: BookOpen },
  { slug: "fuentes", label: "Fuentes", description: "Administra biblias, catecismo y referencias reutilizables.", icon: BookOpen },
  { slug: "calendario-liturgico", label: "Calendario litúrgico", description: "Organiza celebraciones y sus asociaciones de contenido.", icon: CalendarDays },
  { slug: "configuracion", label: "Configuración y apariencia", description: "Personaliza identidad, portada, redes y colores seguros.", icon: Settings },
  { slug: "archivos", label: "Archivos", description: "Centraliza imágenes y documentos reutilizables.", icon: Image },
  { slug: "estadisticas", label: "Estadísticas", description: "Consulta visitas y crecimiento del contenido.", icon: BarChart3 },
  { slug: "historial", label: "Historial", description: "Consulta quién creó, modificó o eliminó cada registro.", icon: History },
  { slug: "papelera", label: "Papelera", description: "Restaura contenido archivado o elimínalo definitivamente.", icon: Trash2 },
];

export default async function AdminPage() {
  const role = await requireAdminPanel();
  const visibleResources = role === "author"
    ? resources.filter(({ slug }) => ["articulos", "lecturas", "reflexiones", "santos", "oraciones"].includes(slug))
    : resources;
  return (
    <>
      <div className="max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">Espacio de edición</p>
        <h1 className="mt-3 font-serif text-4xl font-semibold tracking-tight sm:text-5xl">¿Qué quieres preparar hoy?</h1>
        <p className="mt-4 text-base leading-7 text-muted-foreground">
          Elige una sección para crear contenido. Puedes guardarlo como borrador y publicarlo cuando esté listo.
        </p>
      </div>
      <Card className="mt-8 border-gold/30 bg-gold/10">
        <CardContent className="flex gap-3 p-5 sm:p-6">
          <Sparkles className="mt-0.5 size-5 shrink-0 text-accent" />
          <div>
            <h2 className="font-semibold">Consejo para empezar</h2>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">Completa primero el título y el contenido. Guarda como borrador si aún necesitas revisar el texto.</p>
          </div>
        </CardContent>
      </Card>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {visibleResources.map(({ slug, label, description, icon: Icon }) => (
          <Link key={slug} href={`/admin/${slug}`} className="group">
            <Card className="h-full border-border/80 transition-all hover:-translate-y-0.5 hover:border-accent hover:shadow-md">
              <CardContent className="flex h-full flex-col p-5 sm:p-6">
                <div className="flex size-11 items-center justify-center rounded-xl bg-accent/10 text-accent"><Icon className="size-5" /></div>
                <h2 className="mt-5 font-serif text-2xl font-semibold">{label}</h2>
                <p className="mt-2 flex-1 text-sm leading-6 text-muted-foreground">{description}</p>
                <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-accent">Administrar <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" /></span>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </>
  );
}
