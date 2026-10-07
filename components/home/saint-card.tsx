import Link from "next/link";
import { ArrowRight, Church } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function SaintCard({ content, label = "Santo del día", link = { href: "/santo", title: "Conocer su historia" } }: { content: { name: string | null; excerpt: string } | null; label?: string; link?: { href: string; title: string } }) {
  return (
    <Card className="overflow-hidden bg-primary text-primary-foreground">
      <CardContent className="flex h-full flex-col justify-between p-6">
        <div>
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary-foreground/70">
              {label}
            </p>
            <Church aria-hidden="true" className="size-5 text-[#D6B879]" />
          </div>
          <h2 className="mt-8 font-serif text-3xl font-semibold">{content?.name || "Santo del día"}</h2>
          <p className="mt-3 leading-7 text-primary-foreground/75">
            {content?.excerpt || "Conoce el testimonio de santidad que acompaña este día."}
          </p>
        </div>
        <Link
          href={link.href}
          className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-primary-foreground hover:underline"
        >
          {link.title}
          <ArrowRight aria-hidden="true" className="size-4" />
        </Link>
      </CardContent>
    </Card>
  );
}
