import Link from "next/link";
import {
  BookOpen, CalendarDays, FileText, Heart, History, LayoutDashboard,
  BarChart3, Lightbulb, ListTree, Settings, ShieldCheck, Sparkles, Trash2, Image,
} from "lucide-react";
import type { Role } from "@/lib/auth";
import { LogoutButton } from "@/components/logout-button";

const contentItems = [
  { href: "/admin/articulos", label: "Artículos", icon: FileText },
  { href: "/admin/lecturas", label: "Lecturas", icon: BookOpen },
  { href: "/admin/reflexiones", label: "Reflexiones", icon: Lightbulb },
  { href: "/admin/santos", label: "Santos", icon: Heart },
  { href: "/admin/oraciones", label: "Oraciones", icon: Sparkles },
];

export function AdminNavigation({ role }: { role: Role }) {
  const canManage = role !== "author";
  const links = [
    { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
    ...contentItems,
    ...(canManage ? [
      { href: "/admin/archivos", label: "Archivos", icon: Image },
      { href: "/admin/estadisticas", label: "Estadísticas", icon: BarChart3 },
      { href: "/admin/categorias", label: "Categorías", icon: ListTree },
      { href: "/admin/fuentes", label: "Fuentes", icon: BookOpen },
      { href: "/admin/calendario-liturgico", label: "Calendario litúrgico", icon: CalendarDays },
      { href: "/admin/historial", label: "Historial", icon: History },
      { href: "/admin/papelera", label: "Papelera", icon: Trash2 },
    ] : []),
    ...(role === "admin" ? [{ href: "/admin/configuracion", label: "Configuración", icon: Settings }] : []),
  ];

  return (
    <>
      <aside className="hidden w-64 shrink-0 border-r bg-card lg:block">
        <nav className="sticky top-0 flex max-h-screen flex-col gap-1 overflow-y-auto p-4" aria-label="Navegación administrativa">
          <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Administración</p>
          {links.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
              <Icon className="size-4 shrink-0" aria-hidden="true" />
              {label}
            </Link>
          ))}
          <div className="mt-auto border-t pt-4">
            <Link href="/" className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground">
              <ShieldCheck className="size-4" aria-hidden="true" /> Ver sitio
            </Link>
            <LogoutButton variant="nav" />
          </div>
        </nav>
      </aside>
      <nav className="overflow-x-auto border-b bg-card px-4 py-2 lg:hidden" aria-label="Navegación administrativa móvil">
        <div className="flex min-w-max gap-2">
          {links.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground">
              <Icon className="size-4" aria-hidden="true" /> {label}
            </Link>
          ))}
          <Link href="/" className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground">
            <ShieldCheck className="size-4" aria-hidden="true" /> Sitio
          </Link>
          <LogoutButton variant="mobile" />
        </div>
      </nav>
    </>
  );
}
