import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { RichTextEditor } from "@/components/admin/rich-text-editor";
import { SlugField } from "@/components/admin/slug-field";
import { getCurrentUser, requireAdminPanel } from "@/lib/auth";
import { deleteContent, saveContent } from "../actions";

export const instant = false;

const longTextFields = new Set([
  "contenido", "biografia", "primera_lectura", "salmo", "segunda_lectura",
  "evangelio", "pregunta", "respuesta_breve", "citas_biblicas", "fuentes",
  "virtudes", "patronazgo", "oracion", "proposito",
]);

const resources: Record<string, { label: string; help: string; fields: string[] }> = {
  articulos: {
    label: "Artículos",
    help: "Publica artículos de formación, apologética y contenido para Defiende tu fe.",
    fields: ["titulo", "slug", "contenido", "imagen_url", "fecha", "categoria", "pregunta", "respuesta_breve", "citas_biblicas", "fuentes"],
  },
  lecturas: {
    label: "Lecturas",
    help: "Registra las lecturas de cada día. Guarda como borrador mientras completas todos los textos.",
    fields: ["fecha", "tiempo_liturgico", "primera_lectura", "salmo", "segunda_lectura", "evangelio"],
  },
  reflexiones: {
    label: "Reflexiones",
    help: "Acompaña el día con una reflexión, una pregunta, una oración y un propósito.",
    fields: ["fecha", "titulo", "contenido", "pregunta", "oracion", "proposito"],
  },
  santos: {
    label: "Santos",
    help: "Crea la ficha del santo del día. Puedes añadir una imagen desde tu dispositivo.",
    fields: ["fecha", "nombre", "biografia", "virtudes", "patronazgo", "imagen_url"],
  },
  oraciones: {
    label: "Oraciones",
    help: "Organiza las oraciones por título y categoría para que sean fáciles de encontrar.",
    fields: ["titulo", "contenido", "categoria"],
  },
};

const labels: Record<string, string> = {
  titulo: "Título", slug: "Slug de URL", contenido: "Contenido", imagen_url: "Imagen",
  fecha: "Fecha", categoria: "Categoría", pregunta: "Pregunta para meditar",
  respuesta_breve: "Respuesta breve", citas_biblicas: "Citas bíblicas", fuentes: "Fuentes",
  tiempo_liturgico: "Tiempo litúrgico", primera_lectura: "Primera lectura",
  salmo: "Salmo", segunda_lectura: "Segunda lectura", evangelio: "Evangelio",
  nombre: "Nombre", biografia: "Biografía", virtudes: "Virtudes", patronazgo: "Patronazgo",
  oracion: "Oración", proposito: "Propósito del día",
};

const help: Record<string, string> = {
  titulo: "Escribe un título claro y fácil de reconocer.",
  slug: "Usa minúsculas y guiones, por ejemplo: por-que-rezamos.",
  fecha: "Fecha litúrgica o fecha en la que aparecerá el contenido.",
  imagen_url: "Puedes pegar una URL o seleccionar una imagen para subirla.",
  tiempo_liturgico: "Selecciona el tiempo que corresponde a esta lectura.",
  respuesta_breve: "Resume la idea principal en dos o tres frases.",
  citas_biblicas: "Añade las referencias bíblicas relacionadas.",
  fuentes: "Indica libros, documentos o sitios consultados.",
};

const liturgicalTimes = [
  "Tiempo de Adviento", "Tiempo de Navidad", "Tiempo de Cuaresma",
  "Tiempo de Pascua", "Tiempo Ordinario",
];
const pageSize = 20;
const searchableFields: Record<string, string[]> = {
  articulos: ["titulo", "categoria"],
  lecturas: ["primera_lectura", "evangelio", "tiempo_liturgico"],
  reflexiones: ["titulo", "contenido"],
  santos: ["nombre", "biografia"],
  oraciones: ["titulo", "categoria"],
};

export default async function ResourcePage({ params, searchParams }: { params: Promise<{ resource: string }>; searchParams: Promise<{ q?: string; status?: string; page?: string }> }) {
  const { resource } = await params;
  const filters = await searchParams;
  const config = resources[resource];
  if (!config) notFound();
  const role = await requireAdminPanel();
  const currentUser = await getCurrentUser();
  const supabase = await createClient();
  const page = Math.max(1, Number.parseInt(filters.page ?? "1", 10) || 1);
  const queryText = filters.q?.trim().slice(0, 80) ?? "";
  const status = filters.status && ["draft", "review", "scheduled", "published", "archived"].includes(filters.status) ? filters.status : "";
  let query = supabase.from(resource).select("*", { count: "exact" }).is("deleted_at", null);
  if (status) query = query.eq("status", status);
  if (queryText) {
    const safeText = queryText.replace(/[\\%_,()]/g, " ").replace(/\s+/g, " ").trim();
    const clauses = searchableFields[resource].map((field) => `${field}.ilike.%${safeText}%`).join(",");
    query = query.or(clauses);
  }
  const { data, error, count } = await query
    .order("updated_at", { ascending: false })
    .order("id", { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1);
  if (error) throw new Error(`No se pudo cargar ${config.label}: ${error.message}`);
  const { data: categories, error: categoriesError } = resource === "articulos"
    ? await supabase.from("categorias_articulos").select("id, nombre, descripcion").eq("activo", true).order("orden").order("nombre")
    : { data: null, error: null };
  if (categoriesError) throw new Error(`No se pudieron cargar las categorías: ${categoriesError.message}`);
  const { data: sources, error: sourcesError } = await supabase.from("content_sources").select("id, nombre, tipo").eq("activo", true).order("nombre");
  if (sourcesError) throw new Error(`No se pudieron cargar las fuentes: ${sourcesError.message}`);
  const sourceIdsByContent = new Map<number, number[]>();
  const joinTable = resource === "articulos" ? "articulo_fuentes" : resource === "lecturas" ? "lectura_fuentes" : resource === "reflexiones" ? "reflexione_fuentes" : resource === "santos" ? "santo_fuentes" : "oracione_fuentes";
  if (data?.length) {
    const { data: links, error: linksError } = await supabase.from(joinTable).select("content_id, source_id").in("content_id", data.map((item) => item.id));
    if (linksError) throw new Error(`No se pudieron cargar las relaciones de fuentes: ${linksError.message}`);
    links.forEach((link) => sourceIdsByContent.set(link.content_id, [...(sourceIdsByContent.get(link.content_id) ?? []), link.source_id]));
  }

  return (
    <>
      <Link href="/admin" className="text-sm font-semibold text-accent hover:underline">← Volver al panel</Link>
      <h1 className="mt-3 font-serif text-4xl font-semibold">{config.label}</h1>
      <p className="mt-3 max-w-2xl leading-7 text-muted-foreground">{config.help}</p>
      <form className="mt-6 grid gap-3 rounded-xl border bg-card p-4 sm:grid-cols-[1fr_180px_auto]" method="get">
        <Input name="q" defaultValue={queryText} placeholder={`Buscar en ${config.label.toLowerCase()}...`} maxLength={80} />
        <select name="status" defaultValue={status} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
          <option value="">Todos los estados</option>
          <option value="draft">Borradores</option>
          <option value="review">En revisión</option>
          <option value="scheduled">Programados</option>
          <option value="published">Publicados</option>
          <option value="archived">Archivados</option>
        </select>
        <button className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">Filtrar</button>
      </form>
      <Card className="mt-8 border-accent/20 shadow-md">
        <CardContent className="p-5 sm:p-8">
          <h2 className="font-serif text-2xl font-semibold">Crear nuevo contenido</h2>
          <p className="mt-2 text-sm text-muted-foreground">Completa los campos y elige “Borrador” para continuar después o “Publicar” cuando esté listo.</p>
          <ContentForm resource={resource} fields={config.fields} categories={categories ?? []} sources={sources ?? []} role={role} />
        </CardContent>
      </Card>
      <div className="mt-10 space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-serif text-2xl font-semibold">Contenido existente</h2>
            <p className="mt-1 text-sm text-muted-foreground">{count ?? 0} resultado{count === 1 ? "" : "s"}</p>
          </div>
          {count && count > pageSize ? <Pagination resource={resource} page={page} total={count} queryText={queryText} status={status} /> : null}
        </div>
        {data?.length ? data.map((item) => (
          <Card key={item.id}>
            <CardContent className="flex flex-wrap items-center justify-between gap-4 p-5">
              <div>
                <h3 className="font-serif text-xl font-semibold">{item.titulo || item.nombre || item.fecha || `#${item.id}`}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{statusLabel(String(item.status ?? (item.published ? "published" : "draft")))} · actualizado {new Date(item.updated_at).toLocaleDateString("es-MX")}</p>
              </div>
              <div className="flex gap-2">
                {role !== "author" || (item.status === "draft" && item.created_by === currentUser?.id) ? (
                  <details>
                    <summary className="cursor-pointer rounded-lg border px-3 py-2 text-sm font-semibold">Editar</summary>
                    <div className="mt-4 w-[min(90vw,680px)]"><ContentForm resource={resource} fields={config.fields} item={item} categories={categories ?? []} sources={sources ?? []} selectedSourceIds={sourceIdsByContent.get(item.id) ?? []} role={role} /></div>
                  </details>
                ) : null}
                {role !== "author" ? (
                  <form action={deleteContent}><input type="hidden" name="resource" value={resource} /><input type="hidden" name="id" value={item.id} /><button className="rounded-lg border border-destructive px-3 py-2 text-sm font-semibold text-destructive">Eliminar</button></form>
                ) : null}
              </div>
            </CardContent>
          </Card>
        )) : <Card><CardContent className="p-6 text-sm text-muted-foreground">No encontramos contenido con estos filtros.</CardContent></Card>}
      </div>
    </>
  );
}

function Pagination({ resource, page, total, queryText, status }: { resource: string; page: number; total: number; queryText: string; status: string }) {
  const pages = Math.ceil(total / pageSize);
  const link = (value: number) => `/admin/${resource}?page=${value}${queryText ? `&q=${encodeURIComponent(queryText)}` : ""}${status ? `&status=${status}` : ""}`;
  return (
    <nav className="flex items-center gap-2 text-sm" aria-label="Paginación">
      {page > 1 ? <Link className="rounded-md border px-3 py-2 font-semibold" href={link(page - 1)}>Anterior</Link> : null}
      <span className="text-muted-foreground">Página {page} de {pages}</span>
      {page < pages ? <Link className="rounded-md border px-3 py-2 font-semibold" href={link(page + 1)}>Siguiente</Link> : null}
    </nav>
  );
}

function ContentForm({ resource, fields, item, categories, sources, selectedSourceIds = [], role }: { resource: string; fields: string[]; item?: Record<string, unknown>; categories: Array<{ id: number; nombre: string; descripcion: string | null }>; sources: Array<{ id: number; nombre: string; tipo: string }>; selectedSourceIds?: number[]; role: "admin" | "editor" | "author" }) {
  return (
    <form action={saveContent} encType="multipart/form-data" className="mt-6 grid gap-5 sm:grid-cols-2">
      <input type="hidden" name="resource" value={resource} />
      {item ? <input type="hidden" name="id" value={String(item.id)} /> : null}
      {fields.map((field) => {
        const value = String(item?.[field] ?? "");
        const full = longTextFields.has(field);
        return (
          <label key={field} className={`grid gap-2 ${full ? "sm:col-span-2" : ""}`}>
            <span className="text-sm font-semibold">{labels[field] || field}</span>
            {help[field] ? <span className="text-xs leading-5 text-muted-foreground">{help[field]}</span> : null}
            {field === "categoria" && resource === "articulos" ? (
              <select name="categoria_id" defaultValue={String(item?.categoria_id ?? "")} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
                <option value="">Sin categoría</option>
                {categories.map((category) => <option key={category.id} value={category.id}>{category.nombre}</option>)}
              </select>
            ) : field === "slug" ? (
              <SlugField
                title={String(item?.titulo ?? "")}
                initialSlug={value}
                titleInputId={`titulo-${String(item?.id ?? "nuevo")}`}
              />
            ) : field === "tiempo_liturgico" ? (
              <select name={field} defaultValue={value} required className="h-10 rounded-md border border-input bg-background px-3 text-sm">
                <option value="">Selecciona un tiempo</option>
                {liturgicalTimes.map((time) => <option key={time}>{time}</option>)}
              </select>
            ) : field === "imagen_url" ? (
              <><Input name={field} defaultValue={value} placeholder="https://..." type="url" /><input name="image_file" type="file" accept="image/png,image/jpeg,image/webp" className="text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-secondary file:px-3 file:py-2" /><span className="text-xs text-muted-foreground">PNG, JPG o WebP. Máximo recomendado: 5 MB.</span></>
            ) : longTextFields.has(field) ? (
              <RichTextEditor name={field} defaultValue={value} placeholder={`Escribe aquí ${labels[field]?.toLowerCase() || "el contenido"}...`} />
            ) : (
              <Input id={field === "titulo" ? `titulo-${String(item?.id ?? "nuevo")}` : undefined} name={field} defaultValue={value} type={field === "fecha" ? "date" : "text"} required={["titulo", "fecha", "nombre"].includes(field)} />
            )}
          </label>
        );
      })}
      <div className="flex flex-wrap items-center gap-4 border-t pt-5 sm:col-span-2">
        {resource === "articulos" ? <label className="flex items-center gap-2 text-sm font-medium"><input type="checkbox" name="destacado" defaultChecked={Boolean(item?.destacado)} /> Destacar este artículo</label> : null}
        {role === "author" ? (
          <span className="text-sm text-muted-foreground">Los autores guardan borradores para que un editor los revise y publique.</span>
        ) : (
          <label className="grid gap-1 text-sm font-medium">
            <span>Estado de publicación</span>
            <select name="status" defaultValue={String(item?.status ?? (item?.published ? "published" : "draft"))} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
              <option value="draft">Borrador</option>
              <option value="review">En revisión</option>
              <option value="scheduled">Programado</option>
              <option value="published">Publicado</option>
              <option value="archived">Archivado</option>
            </select>
            <Input name="scheduled_at" type="datetime-local" defaultValue={toDateTimeLocal(String(item?.scheduled_at ?? ""))} />
          </label>
        )}
        <button className="rounded-xl bg-primary px-5 py-2.5 font-semibold text-primary-foreground hover:bg-primary/90">Guardar cambios</button>
      </div>
      {sources.length ? <fieldset className="grid gap-2 rounded-lg border p-4 sm:col-span-2"><legend className="px-1 text-sm font-semibold">Fuentes y referencias</legend><span className="text-xs text-muted-foreground">Selecciona las fuentes que respaldan este contenido.</span><div className="grid gap-2 sm:grid-cols-2">{sources.map((source) => <label key={source.id} className="flex items-center gap-2 text-sm"><input type="checkbox" name="source_ids" value={source.id} defaultChecked={selectedSourceIds.includes(source.id)} />{source.nombre}</label>)}</div></fieldset> : null}
    </form>
  );
}

function statusLabel(status: string) {
  return {
    draft: "Borrador",
    review: "En revisión",
    scheduled: "Programado",
    published: "Publicado",
    archived: "Archivado",
  }[status] ?? "Borrador";
}

function toDateTimeLocal(value: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}
