import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/server";
import { requireEditor } from "@/lib/auth";

export const instant = false;

const pageSize = 30;
const actionLabels: Record<string, string> = { INSERT: "creó", UPDATE: "modificó", DELETE: "eliminó" };

export default async function AuditPage({ searchParams }: { searchParams: Promise<{ table?: string; action?: string; page?: string }> }) {
  await requireEditor();
  const filters = await searchParams;
  const page = Math.max(1, Number.parseInt(filters.page ?? "1", 10) || 1);
  const table = filters.table?.trim().slice(0, 60) ?? "";
  const action = ["INSERT", "UPDATE", "DELETE"].includes(filters.action ?? "") ? filters.action ?? "" : "";
  const supabase = await createClient();
  let query = supabase.from("audit_log").select("id, actor_user_id, action, table_name, record_id, old_data, new_data, created_at", { count: "exact" });
  if (table) query = query.ilike("table_name", `%${table}%`);
  if (action) query = query.eq("action", action);
  const { data, count, error } = await query.order("created_at", { ascending: false }).range((page - 1) * pageSize, page * pageSize - 1);
  if (error) throw new Error(`No se pudo cargar el historial: ${error.message}`);
  const pages = Math.max(1, Math.ceil((count ?? 0) / pageSize));
  return (
    <>
      <Link href="/admin" className="text-sm font-semibold text-accent hover:underline">← Volver al panel</Link>
      <h1 className="mt-3 font-serif text-4xl font-semibold">Historial de cambios</h1>
      <p className="mt-3 max-w-2xl leading-7 text-muted-foreground">Registro de las operaciones administrativas realizadas sobre contenidos, categorías y fuentes.</p>
      <form className="mt-6 grid gap-3 rounded-xl border bg-card p-4 sm:grid-cols-[1fr_180px_auto]" method="get">
        <Input name="table" defaultValue={table} placeholder="Filtrar por tabla..." maxLength={60} />
        <select name="action" defaultValue={action} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
          <option value="">Todas las acciones</option><option value="INSERT">Creaciones</option><option value="UPDATE">Modificaciones</option><option value="DELETE">Eliminaciones</option>
        </select>
        <button className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">Filtrar</button>
      </form>
      <div className="mt-8 space-y-3">
        {data?.length ? data.map((entry) => (
          <Card key={entry.id}><CardContent className="p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-semibold">{actionLabels[entry.action] ?? entry.action} en <span className="font-mono text-sm">{entry.table_name}</span>{entry.record_id ? ` #${entry.record_id}` : ""}</p>
                <p className="mt-1 text-sm text-muted-foreground">{entry.actor_user_id ? `Usuario ${entry.actor_user_id}` : "Sistema"} · {new Date(entry.created_at).toLocaleString("es-MX")}</p>
              </div>
              <details><summary className="cursor-pointer text-sm font-semibold text-accent">Ver datos</summary><div className="mt-3 grid gap-3 text-xs sm:grid-cols-2"><pre className="max-w-full overflow-auto rounded bg-secondary p-3">{JSON.stringify(entry.old_data, null, 2)}</pre><pre className="max-w-full overflow-auto rounded bg-secondary p-3">{JSON.stringify(entry.new_data, null, 2)}</pre></div></details>
            </div>
          </CardContent></Card>
        )) : <Card><CardContent className="p-6 text-sm text-muted-foreground">No hay registros para estos filtros.</CardContent></Card>}
      </div>
      {count && count > pageSize ? <nav className="mt-6 flex items-center justify-center gap-3 text-sm"><span>Página {page} de {pages}</span>{page > 1 ? <Link className="rounded border px-3 py-2" href={`/admin/historial?page=${page - 1}&table=${encodeURIComponent(table)}&action=${action}`}>Anterior</Link> : null}{page < pages ? <Link className="rounded border px-3 py-2" href={`/admin/historial?page=${page + 1}&table=${encodeURIComponent(table)}&action=${action}`}>Siguiente</Link> : null}</nav> : null}
    </>
  );
}
