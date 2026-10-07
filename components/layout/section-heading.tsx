import Link from "next/link";

export function SectionHeading({
  eyebrow,
  title,
  id,
  href,
  action,
}: {
  eyebrow?: string;
  title: string;
  id?: string;
  href?: string;
  action?: string;
}) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div>
        {eyebrow ? (
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-accent">
            {eyebrow}
          </p>
        ) : null}
        <h2 id={id} className="font-serif text-2xl font-semibold tracking-tight sm:text-3xl">
          {title}
        </h2>
      </div>
      {href && action ? (
        <Link
          href={href}
          className="shrink-0 text-sm font-semibold text-accent hover:underline"
        >
          {action}
        </Link>
      ) : null}
    </div>
  );
}
