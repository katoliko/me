import Link from "next/link";
import Image from "next/image";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DesktopNavigation } from "@/components/layout/main-navigation";
import { getSiteSettings } from "@/lib/site-settings";

export async function AppHeader() {
  const settings = await getSiteSettings();
  return (
    <header className="border-b border-border/70 bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5" aria-label={`${settings.general.name}, inicio`}>
          <span className="flex size-9 items-center justify-center overflow-hidden rounded-xl bg-primary text-primary-foreground">
            {settings.general.logoUrl ? <Image src={settings.general.logoUrl} alt="" width={36} height={36} unoptimized className="size-full object-cover" /> : <Heart aria-hidden="true" className="size-4 fill-current" />}
          </span>
          <span className="font-serif text-2xl font-semibold tracking-tight">{settings.general.name}</span>
        </Link>

        <div className="flex items-center gap-2">
          <DesktopNavigation />
          <Button asChild size="sm" className="hidden xl:inline-flex">
            <Link href="/auth/login">Mi espacio</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
