"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { slugifyTitle, MAX_AUTO_SLUG_LENGTH, MAX_MANUAL_SLUG_LENGTH } from "@/lib/slug";

export function SlugField({
  title,
  initialSlug,
  titleInputId,
}: {
  title: string;
  initialSlug: string;
  titleInputId: string;
}) {
  const initialGenerated = slugifyTitle(title);
  const [slug, setSlug] = useState(initialSlug || initialGenerated);
  const [manual, setManual] = useState(Boolean(initialSlug && initialSlug !== initialGenerated));

  useEffect(() => {
    const titleInput = document.getElementById(titleInputId) as HTMLInputElement | null;
    const updateFromTitle = (event: Event) => {
      if (!manual) {
        setSlug(slugifyTitle((event.target as HTMLInputElement).value));
      }
    };

    titleInput?.addEventListener("input", updateFromTitle);
    if (!manual) {
      setSlug(slugifyTitle(title));
    }
    return () => titleInput?.removeEventListener("input", updateFromTitle);
  }, [title, titleInputId, manual]);

  return (
    <div className="grid gap-2">
      <span className="text-sm font-semibold">Slug de URL</span>
      <span className="text-xs leading-5 text-muted-foreground">
        Se genera desde el título con un máximo de {MAX_AUTO_SLUG_LENGTH} caracteres. Puedes editarlo hasta {MAX_MANUAL_SLUG_LENGTH} caracteres.
      </span>
      <Input
        name="slug"
        value={slug}
        maxLength={MAX_MANUAL_SLUG_LENGTH}
        pattern="[a-z]+(?:-[a-z]+)*"
        onChange={(event) => {
          setManual(true);
          setSlug(event.target.value.toLowerCase().replace(/[^a-z-]/g, "").replace(/-+/g, "-"));
        }}
        onBlur={(event) => setSlug(event.target.value.replace(/^-+|-+$/g, ""))}
        placeholder="titulo-del-articulo"
      />
      <input type="hidden" name="slug_mode" value={manual ? "manual" : "auto"} />
      <span className="text-xs text-muted-foreground">
        {manual ? "Slug personalizado." : "Slug automático: cambiará si modificas el título."}
      </span>
    </div>
  );
}
