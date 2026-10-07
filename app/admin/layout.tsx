import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { requireAdminPanel } from "@/lib/auth";
import { AdminNavigation } from "@/components/admin/admin-navigation";

export const instant = false;

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const role = await requireAdminPanel();
  const roleLabel = role === "admin" ? "Administrador" : role === "editor" ? "Editor" : "Autor";
  return (
    <div className="min-h-screen bg-secondary/30">
      <header className="border-b bg-card/95 shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <Link href="/admin" className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <ShieldCheck aria-hidden="true" className="size-5" />
            </div>
            <div>
              <p className="font-serif text-xl font-semibold">Katoliko</p>
              <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Panel administrativo</p>
            </div>
          </Link>
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-accent/10 px-3 py-1.5 text-xs font-semibold capitalize text-accent">
              {roleLabel}
            </span>
          </div>
        </div>
      </header>
      <div className="mx-auto flex max-w-[90rem]">
        <AdminNavigation role={role} />
        <main className="min-w-0 flex-1 px-4 py-8 sm:px-6 md:py-10">{children}</main>
      </div>
    </div>
  );
}
