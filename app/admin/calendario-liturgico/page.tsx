import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/server";
import { requireEditor } from "@/lib/auth";
import { deleteLiturgicalDay, saveLiturgicalDay } from "./actions";

export const instant = false;

const options = {
  times: [["adviento", "Adviento"], ["navidad", "Navidad"], ["cuaresma", "Cuaresma"], ["pascua", "Pascua"], ["ordinario", "Tiempo Ordinario"]],
  colors: [["verde", "Verde"], ["blanco", "Blanco"], ["rojo", "Rojo"], ["morado", "Morado"], ["rosa", "Rosa"], ["dorado", "Dorado"]],
  grades: [["solemnidad", "Solemnidad"], ["fiesta", "Fiesta"], ["memoria", "Memoria"], ["feria", "Feria"]],
} as const;

export default async function LiturgicalCalendarPage() {
  await requireEditor();
  const supabase = await createClient();
  const [{ data: days, error }, readings, reflections, saints] = await Promise.all([
    supabase.from("liturgical_calendar").select("*").order("fecha").order("celebracion"),
    supabase.from("lecturas").select("id, fecha, evangelio").is("deleted_at", null).order("fecha", { ascending: false }).limit(100),
    supabase.from("reflexiones").select("id, fecha, titulo").is("deleted_at", null).order("fecha", { ascending: false }).limit(100),
    supabase.from("santos").select("id, fecha, nombre").is("deleted_at", null).order("fecha", { ascending: false }).limit(100),
  ]);
  if (error) throw new Error(`No se pudo cargar el calendario: ${error.message}`);

  return (
    <>
      <Link href="/admin" className="text-sm font-semibold text-accent hover:underline">← Volver al panel</Link>
      <h1 className="mt-3 font-serif text-4xl font-semibold">Calendario litúrgico</h1>
      <p className="mt-3 max-w-2xl leading-7 text-muted-foreground">Administra celebraciones independientes y asocia opcionalmente lecturas, reflexiones y santos existentes.</p>
      <Card className="mt-8"><CardContent className="p-5 sm:p-8"><h2 className="font-serif text-2xl font-semibold">Nueva celebración</h2><CalendarForm readings={readings.data ?? []} reflections={reflections.data ?? []} saints={saints.data ?? []} /></CardContent></Card>
      <div className="mt-8 space-y-4">
        {days?.map((day) => <Card key={day.id}><CardContent className="flex flex-wrap items-start justify-between gap-4 p-5">
          <div><p className="text-sm font-semibold text-accent">{new Date(`${day.fecha}T12:00:00`).toLocaleDateString("es-MX")}</p><h2 className="mt-1 font-serif text-xl font-semibold">{day.celebracion}</h2><p className="mt-1 text-sm text-muted-foreground">{label(options.times, day.tiempo_liturgico)} · {label(options.grades, day.grado)} · {day.activo ? "Activa" : "Inactiva"}</p></div>
          <div className="flex gap-2"><details><summary className="cursor-pointer rounded-lg border px-3 py-2 text-sm font-semibold">Editar</summary><div className="mt-4 w-[min(90vw,700px)]"><CalendarForm item={day} readings={readings.data ?? []} reflections={reflections.data ?? []} saints={saints.data ?? []} /></div></details>{day.activo ? <form action={deleteLiturgicalDay}><input type="hidden" name="id" value={day.id} /><button className="rounded-lg border border-destructive px-3 py-2 text-sm font-semibold text-destructive">Desactivar</button></form> : null}</div>
        </CardContent></Card>)}
      </div>
    </>
  );
}

function label(items: readonly (readonly [string, string])[], value: string) {
  return items.find(([key]) => key === value)?.[1] ?? value;
}

function CalendarForm({ item, readings, reflections, saints }: { item?: Record<string, unknown>; readings: Array<Record<string, unknown>>; reflections: Array<Record<string, unknown>>; saints: Array<Record<string, unknown>> }) {
  return <form action={saveLiturgicalDay} className="mt-4 grid gap-4 sm:grid-cols-2">
    {item ? <input type="hidden" name="id" value={String(item.id)} /> : null}
    <label className="grid gap-2"><span className="text-sm font-semibold">Fecha</span><Input name="fecha" type="date" required defaultValue={String(item?.fecha ?? "")} /></label>
    <label className="grid gap-2"><span className="text-sm font-semibold">Celebración</span><Input name="celebracion" required maxLength={160} defaultValue={String(item?.celebracion ?? "")} placeholder="Domingo de Pascua" /></label>
    <Select name="tiempo_liturgico" label="Tiempo litúrgico" value={String(item?.tiempo_liturgico ?? "ordinario")} items={options.times} />
    <Select name="color_liturgico" label="Color litúrgico" value={String(item?.color_liturgico ?? "verde")} items={options.colors} />
    <Select name="grado" label="Grado" value={String(item?.grado ?? "feria")} items={options.grades} />
    <label className="grid gap-2 sm:col-span-2"><span className="text-sm font-semibold">Descripción</span><Input name="descripcion" maxLength={500} defaultValue={String(item?.descripcion ?? "")} /></label>
    <Select name="lectura_id" label="Lectura asociada (opcional)" value={String(item?.lectura_id ?? "")} items={readings.map((row) => [String(row.id), `${row.fecha} · lectura`])} empty />
    <Select name="reflexion_id" label="Reflexión asociada (opcional)" value={String(item?.reflexion_id ?? "")} items={reflections.map((row) => [String(row.id), `${row.fecha} · ${row.titulo ?? "Reflexión"}`])} empty />
    <Select name="santo_id" label="Santo asociado (opcional)" value={String(item?.santo_id ?? "")} items={saints.map((row) => [String(row.id), `${row.fecha} · ${row.nombre ?? "Santo"}`])} empty />
    {item ? <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="activo" defaultChecked={Boolean(item.activo)} /> Celebración activa</label> : null}
    <button className="justify-self-start rounded-xl bg-primary px-5 py-2.5 font-semibold text-primary-foreground">Guardar celebración</button>
  </form>;
}

function Select({ name, label, value, items, empty = false }: { name: string; label: string; value: string; items: readonly (readonly [string, string])[]; empty?: boolean }) {
  return <label className="grid gap-2"><span className="text-sm font-semibold">{label}</span><select name={name} defaultValue={value} className="h-10 rounded-md border border-input bg-background px-3 text-sm">{empty ? <option value="">Sin asociación</option> : null}{items.map(([key, text]) => <option key={key} value={key}>{text}</option>)}</select></label>;
}
