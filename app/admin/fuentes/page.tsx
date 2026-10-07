import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/server";
import { requireEditor } from "@/lib/auth";
import { deleteSource, saveSource } from "./actions";

export const instant = false;

const sourceTypes = [
  ["biblia", "Biblia"], ["catecismo", "Catecismo"], ["documento_pontificio", "Documento pontificio"],
  ["concilio", "Concilio"], ["padres_iglesia", "Padres de la Iglesia"],
  ["codigo_derecho_canonico", "Código de Derecho Canónico"], ["otra", "Otra fuente confiable"],
] as const;

export default async function SourcesPage() {
  await requireEditor();
  const supabase = await createClient();
  const { data: sources, error } = await supabase.from("content_sources").select("*").order("activo", { ascending: false }).order("nombre");
  if (error) throw new Error(`No se pudieron cargar las fuentes: ${error.message}`);
  return (
    <>
      <Link href="/admin" className="text-sm font-semibold text-accent hover:underline">← Volver al panel</Link>
      <h1 className="mt-3 font-serif text-4xl font-semibold">Fuentes y referencias</h1>
      <p className="mt-3 max-w-2xl leading-7 text-muted-foreground">Crea referencias reutilizables y asígnalas a cualquier contenido sin repetir los datos.</p>
      <Card className="mt-8"><CardContent className="p-5 sm:p-8"><h2 className="font-serif text-2xl font-semibold">Nueva fuente</h2><SourceForm /></CardContent></Card>
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {sources?.map((source) => <Card key={source.id}><CardContent className="p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-accent">{sourceTypes.find(([value]) => value === source.tipo)?.[1] ?? source.tipo}</p>
          <h2 className="mt-1 font-serif text-xl font-semibold">{source.nombre}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{source.autor || "Autor no indicado"} · {source.activo ? "Activa" : "Inactiva"}</p>
          <details className="mt-4"><summary className="cursor-pointer text-sm font-semibold text-accent">Editar fuente</summary><SourceForm item={source} /></details>
          <form action={deleteSource} className="mt-3"><input type="hidden" name="id" value={source.id} /><button className="text-sm font-semibold text-destructive">Eliminar</button></form>
        </CardContent></Card>)}
      </div>
    </>
  );
}

function SourceForm({ item }: { item?: Record<string, unknown> }) {
  return <form action={saveSource} className="mt-4 grid gap-4">
    {item ? <input type="hidden" name="id" value={String(item.id)} /> : null}
    <label className="grid gap-2"><span className="text-sm font-semibold">Nombre</span><Input name="nombre" required maxLength={160} defaultValue={String(item?.nombre ?? "")} placeholder="Sagrada Biblia" /></label>
    <label className="grid gap-2"><span className="text-sm font-semibold">Tipo</span><select name="tipo" required defaultValue={String(item?.tipo ?? "otra")} className="h-10 rounded-md border border-input bg-background px-3 text-sm">{sourceTypes.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
    <label className="grid gap-2"><span className="text-sm font-semibold">Autor o institución</span><Input name="autor" maxLength={160} defaultValue={String(item?.autor ?? "")} /></label>
    <label className="grid gap-2"><span className="text-sm font-semibold">Referencia</span><Input name="referencia" maxLength={240} defaultValue={String(item?.referencia ?? "")} placeholder="Mt 5, 1-12" /></label>
    <label className="grid gap-2"><span className="text-sm font-semibold">URL</span><Input name="url" type="url" defaultValue={String(item?.url ?? "")} placeholder="https://..." /></label>
    <label className="grid gap-2"><span className="text-sm font-semibold">Descripción</span><Input name="descripcion" maxLength={300} defaultValue={String(item?.descripcion ?? "")} /></label>
    {item ? <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="activo" defaultChecked={Boolean(item.activo)} /> Fuente activa</label> : null}
    <button className="justify-self-start rounded-xl bg-primary px-5 py-2.5 font-semibold text-primary-foreground">Guardar fuente</button>
  </form>;
}
