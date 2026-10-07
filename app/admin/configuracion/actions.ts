"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireEditor } from "@/lib/auth";

const hex = /^#[0-9A-Fa-f]{6}$/;
const url = /^https?:\/\/[^\s]+$/i;
const email = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function text(formData: FormData, name: string, max: number) {
  return String(formData.get(name) ?? "").trim().slice(0, max);
}

export async function saveSiteSettings(formData: FormData) {
  const role = await requireEditor();
  if (role !== "admin") throw new Error("Solo un administrador puede cambiar la configuración del sitio.");
  const primaryColor = text(formData, "primaryColor", 7);
  const accentColor = text(formData, "accentColor", 7);
  if (!hex.test(primaryColor) || !hex.test(accentColor)) throw new Error("Los colores deben estar en formato hexadecimal.");
  const contactEmail = text(formData, "contactEmail", 160);
  if (contactEmail && !email.test(contactEmail)) throw new Error("El correo de contacto no es válido.");
  const links = ["facebook", "instagram", "youtube", "whatsapp", "tiktok", "telegram", "x"].reduce<Record<string, string>>((result, key) => {
    const value = text(formData, key, 240);
    if (value && !url.test(value)) throw new Error(`La URL de ${key} no es válida.`);
    result[key] = value;
    return result;
  }, {});
  const mode = text(formData, "mode", 10);
  if (!["system", "light", "dark"].includes(mode)) throw new Error("El modo de apariencia no es válido.");
  const supabase = await createClient();
  const settings = [
    { key: "general", value: { name: text(formData, "name", 80), description: text(formData, "description", 240), logoUrl: text(formData, "logoUrl", 500), faviconUrl: text(formData, "faviconUrl", 500), contactEmail, phone: text(formData, "phone", 40) } },
    { key: "appearance", value: { primaryColor, accentColor, mode } },
    { key: "social", value: links },
    { key: "about", value: {
      enabled: formData.get("aboutEnabled") === "on",
      title: text(formData, "aboutTitle", 160),
      intro: text(formData, "aboutIntro", 300),
      content: text(formData, "aboutContent", 12000),
      imageUrl: text(formData, "aboutImageUrl", 500),
      showContact: formData.get("aboutShowContact") === "on",
      showSocial: formData.get("aboutShowSocial") === "on",
      showMission: formData.get("aboutShowMission") === "on",
      missionTitle: text(formData, "aboutMissionTitle", 160),
      missionContent: text(formData, "aboutMissionContent", 6000),
    } },
    { key: "homepage", value: {
      eyebrow: text(formData, "eyebrow", 100),
      title: text(formData, "homeTitle", 180),
      description: text(formData, "homeDescription", 300),
      greeting: text(formData, "greeting", 100),
      dailyLabel: text(formData, "dailyLabel", 100),
      dailyDescription: text(formData, "dailyDescription", 180),
      readingLabel: text(formData, "readingLabel", 100),
      reflectionLabel: text(formData, "reflectionLabel", 100),
      saintLabel: text(formData, "saintLabel", 100),
      readingLink: { href: text(formData, "readingLinkHref", 100), title: text(formData, "readingLinkTitle", 100), description: text(formData, "readingLinkDescription", 180) },
      reflectionLink: { href: text(formData, "reflectionLinkHref", 100), title: text(formData, "reflectionLinkTitle", 100), description: text(formData, "reflectionLinkDescription", 180) },
      saintLink: { href: text(formData, "saintLinkHref", 100), title: text(formData, "saintLinkTitle", 100), description: text(formData, "saintLinkDescription", 180) },
      defendLink: { href: text(formData, "defendLinkHref", 100), title: text(formData, "defendLinkTitle", 100), description: text(formData, "defendLinkDescription", 180) },
      template: ["serene", "classic"].includes(text(formData, "template", 20)) ? text(formData, "template", 20) : "serene",
      showDaily: formData.get("showDaily") === "on",
      showResources: formData.get("showResources") === "on",
      showDefend: formData.get("showDefend") === "on",
      resources: ["1", "2", "3", "4"].map((index) => ({
        href: text(formData, `resource${index}Href`, 100),
        title: text(formData, `resource${index}Title`, 80),
        description: text(formData, `resource${index}Description`, 160),
        visible: formData.get(`resource${index}Visible`) === "on",
      })),
    } },
  ];
  const { error } = await supabase.from("site_settings").upsert(settings, { onConflict: "key" });
  if (error) throw new Error(`No se pudo guardar la configuración: ${error.message}`);
  revalidatePath("/", "layout");
  revalidatePath("/admin/configuracion");
}
