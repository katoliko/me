import { createClient } from "@/lib/supabase/server";

export type SiteSettings = {
  general: { name: string; description: string; logoUrl: string; faviconUrl: string; contactEmail: string; phone: string };
  appearance: { primaryColor: string; accentColor: string; mode: "system" | "light" | "dark" };
  social: { facebook: string; instagram: string; youtube: string; whatsapp: string; tiktok: string; telegram: string; x: string };
  about: { enabled: boolean; title: string; intro: string; content: string; imageUrl: string; showContact: boolean; showSocial: boolean; showMission: boolean; missionTitle: string; missionContent: string };
  homepage: { eyebrow: string; title: string; description: string; greeting: string; dailyLabel: string; dailyDescription: string; readingLabel: string; reflectionLabel: string; saintLabel: string; template: "serene" | "classic"; showDaily: boolean; showResources: boolean; showDefend: boolean; readingLink: { href: string; title: string; description: string }; reflectionLink: { href: string; title: string; description: string }; saintLink: { href: string; title: string; description: string }; defendLink: { href: string; title: string; description: string }; resources: Array<{ href: string; title: string; description: string; visible: boolean }> };
};

export const defaultSiteSettings: SiteSettings = {
  general: { name: "Katoliko", description: "Un espacio cercano para la oración, la reflexión y la vida cristiana.", logoUrl: "", faviconUrl: "", contactEmail: "", phone: "" },
  appearance: { primaryColor: "#2D4A5A", accentColor: "#B86B4B", mode: "system" },
  social: { facebook: "", instagram: "", youtube: "", whatsapp: "", tiktok: "", telegram: "", x: "" },
  about: {
    enabled: true,
    title: "Acerca de Katoliko",
    intro: "Un espacio digital para acercarnos a Dios y caminar juntos en la fe.",
    content: "<p>Katoliko nace como un proyecto para acompañar la vida cotidiana con la Palabra, la oración y la reflexión.</p>",
    imageUrl: "",
    showContact: true,
    showSocial: true,
    showMission: true,
    missionTitle: "Nuestra misión",
    missionContent: "<p>Ofrecer recursos católicos cercanos, claros y disponibles para todos.</p>",
  },
  homepage: { eyebrow: "Un espacio para el alma", title: "Buenos días. Que la paz de Dios te acompañe.", description: "Un momento para detenerte, escuchar y caminar en la fe.", greeting: "Para hoy", dailyLabel: "Tu día en la fe", dailyDescription: "Una pausa para escuchar, orar y caminar con esperanza.", readingLabel: "Lecturas de hoy", reflectionLabel: "Reflexión del día", saintLabel: "Santo del día", template: "serene", showDaily: true, showResources: true, showDefend: true, readingLink: { href: "/lecturas", title: "Leer las lecturas", description: "Lee la Palabra de hoy" }, reflectionLink: { href: "/reflexiones", title: "Leer reflexión", description: "Una palabra para iluminar tu día" }, saintLink: { href: "/santo", title: "Conocer su historia", description: "Descubre su testimonio" }, defendLink: { href: "/defiende-tu-fe", title: "Explorar temas", description: "Comprende y comparte tu fe" }, resources: [
    { href: "/biblia", title: "Biblia", description: "Encuentra una palabra para cada momento", visible: true },
    { href: "/oraciones", title: "Oraciones", description: "Un momento de encuentro y serenidad", visible: true },
    { href: "/lecturas", title: "Lecturas", description: "La Palabra proclamada hoy", visible: true },
    { href: "/reflexiones", title: "Reflexiones", description: "Ideas para iluminar tu día", visible: true },
  ] },
};

export async function getSiteSettings(): Promise<SiteSettings> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("site_settings").select("key, value");
  if (error) throw new Error(`No se pudo cargar la configuración del sitio: ${error.message}`);
  const result = structuredClone(defaultSiteSettings);
  for (const row of data ?? []) {
    if (row.key === "general") result.general = { ...result.general, ...row.value };
    if (row.key === "appearance") result.appearance = { ...result.appearance, ...row.value };
    if (row.key === "social") result.social = { ...result.social, ...row.value };
    if (row.key === "about") result.about = { ...result.about, ...row.value };
    if (row.key === "homepage") result.homepage = { ...result.homepage, ...row.value };
  }
  return result;
}

export function hexToHsl(hex: string) {
  const value = hex.replace("#", "");
  const r = Number.parseInt(value.slice(0, 2), 16) / 255;
  const g = Number.parseInt(value.slice(2, 4), 16) / 255;
  const b = Number.parseInt(value.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h /= 6;
  }
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}
