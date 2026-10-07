import Link from "next/link";
import { BarChart3, Eye, FileText, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { requireEditor } from "@/lib/auth";

export const instant = false;

const contentTables = ["articulos", "lecturas", "reflexiones", "santos", "oraciones"] as const;

export default async function StatisticsPage() {
  await requireEditor();
  const supabase = await createClient();
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const [{ count: views }, { count: visitors }, ...contentCounts] = await Promise.all([
    supabase.from("analytics_events").select("id", { count: "exact", head: true }).eq("event_name", "page_view").gte("created_at", since),
    supabase.from("analytics_events").select("visitor_hash", { count: "exact", head: true }).gte("created_at", since),
    ...contentTables.map((table) => supabase.from(table).select("id", { count: "exact", head: true }).is("deleted_at", null)),
  ]);
  const cards = [
    { label: "Visitas últimos 30 días", value: views ?? 0, icon: Eye },
    { label: "Eventos últimos 30 días", value: visitors ?? 0, icon: Users },
    { label: "Contenidos activos", value: contentCounts.reduce((sum, result) => sum + (result.count ?? 0), 0), icon: FileText },
  ];
  return (
    <>
      <Link href="/admin" className="text-sm font-semibold text-accent hover:underline">← Volver al panel</Link>
      <div className="mt-3 flex items-center gap-3"><BarChart3 className="size-8 text-accent" /><h1 className="font-serif text-4xl font-semibold">Estadísticas</h1></div>
      <p className="mt-3 max-w-2xl leading-7 text-muted-foreground">Resumen operativo de los últimos 30 días. No se almacenan direcciones IP ni datos personales.</p>
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {cards.map(({ label, value, icon: Icon }) => <Card key={label}><CardContent className="p-5"><Icon className="size-5 text-accent" /><p className="mt-4 text-3xl font-semibold">{value.toLocaleString("es-MX")}</p><p className="mt-1 text-sm text-muted-foreground">{label}</p></CardContent></Card>)}
      </div>
      <Card className="mt-6"><CardContent className="p-5"><h2 className="font-serif text-2xl font-semibold">Publicaciones activas por módulo</h2><div className="mt-4 grid gap-3 sm:grid-cols-2">{contentTables.map((table, index) => <div key={table} className="flex justify-between rounded-lg bg-secondary px-4 py-3 text-sm"><span>{table}</span><strong>{contentCounts[index].count ?? 0}</strong></div>)}</div></CardContent></Card>
    </>
  );
}
