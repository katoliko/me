import Link from "next/link";
import { ArrowRight, BookOpen } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function DailyReadingCard({ content, label = "Lecturas de hoy", link = { href: "/lecturas", title: "Leer las lecturas" } }: { content: { time: string | null; excerpt: string } | null; label?: string; link?: { href: string; title: string } }) {
  return (
    <Card className="border-accent/20 bg-accent text-accent-foreground">
      <CardContent className="p-6 sm:p-7">
        <div className="flex items-center justify-between gap-4">
          <Badge className="border-0 bg-white/15 text-accent-foreground">
            {label}
          </Badge>
          <BookOpen aria-hidden="true" className="size-5 opacity-70" />
        </div>
        <p className="mt-8 text-sm font-medium text-accent-foreground/75">
          {content?.time || "Palabra de hoy"}
        </p>
        <h2 className="mt-2 font-serif text-3xl font-semibold">
          Lecturas para caminar en la fe
        </h2>
        <p className="mt-3 max-w-xl leading-7 text-accent-foreground/80">
          {content?.excerpt || "Descubre la Palabra que acompaña tu día."}
        </p>
        <Button asChild variant="secondary" className="mt-6">
          <Link href={link.href}>
            {link.title}
            <ArrowRight aria-hidden="true" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
