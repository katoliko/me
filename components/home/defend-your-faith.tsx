import Link from "next/link";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function DefendYourFaith({ link = { href: "/defiende-tu-fe", title: "Explorar temas" }, description = "Ideas claras para comprender, vivir y compartir tu fe católica con respeto y esperanza." }: { link?: { href: string; title: string }; description?: string }) {
  return (
    <Card className="overflow-hidden border-gold/30 bg-gold/10">
      <CardContent className="flex flex-col gap-6 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
        <div className="flex gap-4">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-gold/20 text-primary">
            <ShieldCheck aria-hidden="true" className="size-6" />
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">
              Formación y comunidad
            </p>
            <h2 className="mt-2 font-serif text-2xl font-semibold">
              Defiende tu fe
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              {description}
            </p>
          </div>
        </div>
        <Link
          href={link.href}
          className="inline-flex shrink-0 items-center gap-2 text-sm font-semibold text-primary hover:underline"
        >
          {link.title}
          <ArrowRight aria-hidden="true" className="size-4" />
        </Link>
      </CardContent>
    </Card>
  );
}
