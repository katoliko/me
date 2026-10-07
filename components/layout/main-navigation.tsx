"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  Church,
  Heart,
  Home,
  ShieldCheck,
  Info,
  type LucideIcon,
} from "lucide-react";

export const navigationItems: Array<{
  label: string;
  href: string;
  icon: LucideIcon;
}> = [
  { label: "Inicio", href: "/", icon: Home },
  { label: "Lecturas", href: "/lecturas", icon: BookOpen },
  { label: "Biblia", href: "/biblia", icon: BookOpen },
  { label: "Santo", href: "/santo", icon: Church },
  { label: "Oraciones", href: "/oraciones", icon: Heart },
  { label: "Defiende tu fe", href: "/defiende-tu-fe", icon: ShieldCheck },
  { label: "Acerca de", href: "/acerca-de", icon: Info },
];

function isCurrentPath(pathname: string, href: string) {
  return href === "/"
    ? pathname === href
    : pathname === href || pathname.startsWith(`${href}/`);
}

export function DesktopNavigation() {
  const pathname = usePathname();

  return (
    <nav aria-label="Navegación principal" className="hidden lg:block">
      <ul className="flex items-center gap-1">
        {navigationItems.map(({ label, href }) => {
          const active = isCurrentPath(pathname, href);

          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  active
                    ? "bg-secondary text-primary"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
              >
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function MobileNavigation() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navegación principal"
      className="fixed inset-x-0 bottom-0 z-20 border-t bg-background/95 px-1 pb-[env(safe-area-inset-bottom)] pt-2 backdrop-blur lg:hidden"
    >
      <ul className="mx-auto flex max-w-md items-stretch justify-between">
        {navigationItems.map(({ label, href, icon: Icon }) => {
          const active = isCurrentPath(pathname, href);

          return (
            <li key={href} className="min-w-0 flex-1">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-12 w-full flex-col items-center justify-center gap-1 rounded-xl px-0.5 text-center text-[10px] font-medium leading-tight transition-colors sm:text-[11px] ${
                  active
                    ? "text-accent"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
              >
                <Icon
                  aria-hidden="true"
                  className="size-5"
                  strokeWidth={active ? 2.4 : 2}
                />
                <span className="max-w-full truncate">{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
