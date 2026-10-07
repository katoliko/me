import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { requireEditor } from "@/lib/auth";
import { permanentlyDeleteContent, restoreContent } from "../actions";

export const instant = false;

const resources = [
  { table: "articulos", label: "Artículos" },
  { table: "lecturas", label: "Lecturas" },
  { table: "reflexiones", label: "Reflexiones" },
  { table: "santos", label: "Santos" },
  { table: "oraciones", label: "Oraciones" },
] as const;

export default async function TrashPage() {
  const role = await requireEditor();
  const supabase = await createClient();
  const results = await Promise.all(
    resources.map(async ({ table, label }) => {
      const { data, error } = await supabase
        .from(table)
        .select("id, titulo, nombre, fecha, deleted_at")
        .not("deleted_at", "is", null)
        .order("deleted_at", { ascending: false });
      if (error) throw new Error(`No se pudo cargar la papelera de ${label}: ${error.message}`);
      return data.map((item) => ({ ...item, table, label }));
    }),
  );
  const items = results.flat().sort((a, b) => String(b.deleted_at).localeCompare(String(a.deleted_at)));

  return (
    <>
      <Link href="/admin" className="text-sm font-semibold text-accent hover:underline">← Volver al panel</Link>
      <h1 className="mt-3 font-serif text-4xl font-semibold">Papelera</h1>
      <p className="mt-3 max-w-2xl leading-7 text-muted-foreground">
        El contenido eliminado se conserva aquí para evitar pérdidas accidentales. Restaurarlo lo devuelve como borrador.
      </p>
      <div className="mt-8 space-y-4">
        {items.length === 0 ? (
          <Card><CardContent className="p-6 text-sm text-muted-foreground">La papelera está vacía.</CardContent></Card>
        ) : items.map((item) => (
          <Card key={`${item.table}-${item.id}`}>
            <CardContent className="flex flex-wrap items-center justify-between gap-4 p-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-accent">{item.label}</p>
                <h2 className="mt-1 font-serif text-xl font-semibold">{item.titulo || item.nombre || item.fecha || `#${item.id}`}</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  En papelera el {new Date(String(item.deleted_at)).toLocaleString("es-MX")}
                </p>
              </div>
              <div className="flex gap-2">
                <form action={restoreContent}>
                  <input type="hidden" name="resource" value={item.table} />
                  <input type="hidden" name="id" value={item.id} />
                  <button className="rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground">Restaurar</button>
                </form>
                {role === "admin" ? (
                  <form action={permanentlyDeleteContent}>
                    <input type="hidden" name="resource" value={item.table} />
                    <input type="hidden" name="id" value={item.id} />
                    <button className="rounded-lg border border-destructive px-3 py-2 text-sm font-semibold text-destructive">Eliminar definitivamente</button>
                  </form>
                ) : null}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}
