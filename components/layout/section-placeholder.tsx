import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AppHeader } from "@/components/layout/app-header";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function SectionPlaceholder({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="min-h-screen bg-background pb-24 lg:pb-0">
      <AppHeader />
      <main className="mx-auto flex max-w-3xl flex-col px-4 py-16 sm:px-6 md:py-24">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
          Katoliko
        </p>
        <h1 className="mt-3 font-serif text-4xl font-semibold tracking-tight">
          {title}
        </h1>
        <Card className="mt-8">
          <CardContent className="p-6 sm:p-8">
            <p className="max-w-xl leading-7 text-muted-foreground">
              {description}
            </p>
            <Button asChild variant="outline" className="mt-6">
              <Link href="/">
                <ArrowLeft aria-hidden="true" />
                Volver al inicio
              </Link>
            </Button>
          </CardContent>
        </Card>
      </main>
      <MobileBottomNav />
    </div>
  );
}
