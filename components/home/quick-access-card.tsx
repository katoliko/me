import Link from "next/link";
import { ArrowRight, type LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function QuickAccessCard({
  href,
  title,
  description,
  icon: Icon,
}: {
  href: string;
  title: string;
  description: string;
  icon: LucideIcon;
}) {
  return (
    <Link href={href} className="group">
      <Card className="h-full transition-transform group-hover:-translate-y-1">
        <CardContent className="flex items-center gap-4 p-5">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Icon aria-hidden="true" className="size-5" />
          </span>
          <span>
            <span className="block font-semibold">{title}</span>
            <span className="mt-1 block text-sm text-muted-foreground">
              {description}
            </span>
          </span>
          <ArrowRight
            aria-hidden="true"
            className="ml-auto size-4 text-muted-foreground transition-transform group-hover:translate-x-1"
          />
        </CardContent>
      </Card>
    </Link>
  );
}
