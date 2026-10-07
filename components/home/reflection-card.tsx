import Link from "next/link";
import { ArrowRight, Lightbulb } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function ReflectionCard({ content, label = "Reflexión del día", link = { href: "/reflexiones", title: "Leer reflexión" } }: { content: { title: string | null; excerpt: string } | null; label?: string; link?: { href: string; title: string } }) {
  return (
    <Card className="bg-secondary/60">
      <CardContent className="flex h-full flex-col justify-between p-6">
        <div>
          <div className="flex size-10 items-center justify-center rounded-xl bg-sage/15 text-sage">
            <Lightbulb aria-hidden="true" className="size-5" />
          </div>
          <p className="mt-6 text-xs font-semibold uppercase tracking-[0.16em] text-sage">
            {label}
          </p>
          <h2 className="mt-2 font-serif text-2xl font-semibold">
            {content?.title || "Una pausa para el alma"}
          </h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            {content?.excerpt || "Encuentra una palabra para iluminar tu día."}
          </p>
        </div>
        <Link
          href={link.href}
          className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
        >
          {link.title}
          <ArrowRight aria-hidden="true" className="size-4" />
        </Link>
      </CardContent>
    </Card>
  );
}
