"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireEditor } from "@/lib/auth";

const sourceTypes = new Set(["biblia", "catecismo", "documento_pontificio", "concilio", "padres_iglesia", "codigo_derecho_canonico", "otra"]);

export async function saveSource(formData: FormData) {
  await requireEditor();
  const id = Number(formData.get("id"));
  const nombre = String(formData.get("nombre") ?? "").trim();
  const tipo = String(formData.get("tipo") ?? "");
  const autor = String(formData.get("autor") ?? "").trim() || null;
  const referencia = String(formData.get("referencia") ?? "").trim() || null;
  const url = String(formData.get("url") ?? "").trim() || null;
  const descripcion = String(formData.get("descripcion") ?? "").trim() || null;
  const activo = formData.get("activo") === "on" || !id;
  if (!nombre) throw new Error("El nombre de la fuente es obligatorio.");
  if (!sourceTypes.has(tipo)) throw new Error("El tipo de fuente no es válido.");
  if (url && !/^https?:\/\//i.test(url)) throw new Error("La URL debe comenzar con http:// o https://.");
  const values = { nombre, tipo, autor, referencia, url, descripcion, activo };
  const supabase = await createClient();
  const query = id
    ? supabase.from("content_sources").update(values).eq("id", id)
    : supabase.from("content_sources").insert(values);
  const { error } = await query;
  if (error) throw new Error(`No se pudo guardar la fuente: ${error.message}`);
  revalidatePath("/admin/fuentes");
  revalidatePath("/admin/articulos");
}

export async function deleteSource(formData: FormData) {
  await requireEditor();
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id) || id <= 0) throw new Error("La fuente seleccionada no es válida.");
  const supabase = await createClient();
  const { error } = await supabase.from("content_sources").delete().eq("id", id);
  if (error) throw new Error(`No se pudo eliminar la fuente. Si está asociada, desactívala en su lugar: ${error.message}`);
  revalidatePath("/admin/fuentes");
  revalidatePath("/admin/articulos");
}
