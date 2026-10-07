"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireEditor } from "@/lib/auth";
import { normalizeManualSlug } from "@/lib/slug";

export async function saveCategory(formData: FormData) {
  await requireEditor();
  const id = Number(formData.get("id"));
  const nombre = String(formData.get("nombre") ?? "").trim();
  const descripcion = String(formData.get("descripcion") ?? "").trim() || null;
  const color = String(formData.get("color") ?? "#B86B4B").trim();
  const orden = Number(formData.get("orden") ?? 0);
  const activo = formData.get("activo") === "on" || !id;
  if (!nombre) throw new Error("El nombre de la categoría es obligatorio.");
  if (!/^#[0-9A-Fa-f]{6}$/.test(color)) throw new Error("El color no es válido.");
  const slug = normalizeManualSlug(nombre);
  if (!slug) throw new Error("El nombre debe contener letras.");
  const supabase = await createClient();
  const values = { nombre, slug, descripcion, color, orden: Number.isInteger(orden) ? orden : 0, activo };
  const query = id
    ? supabase.from("categorias_articulos").update(values).eq("id", id)
    : supabase.from("categorias_articulos").insert(values);
  const { error } = await query;
  if (error) throw new Error(`No se pudo guardar la categoría: ${error.message}`);
  revalidatePath("/admin/categorias");
  revalidatePath("/admin/articulos");
}

export async function deleteCategory(formData: FormData) {
  await requireEditor();
  const id = Number(formData.get("id"));
  const supabase = await createClient();
  const { count, error: countError } = await supabase
    .from("articulos")
    .select("id", { count: "exact", head: true })
    .eq("categoria_id", id);
  if (countError) throw new Error(`No se pudo comprobar el uso de la categoría: ${countError.message}`);
  if (count) throw new Error("No puedes eliminar una categoría que tiene artículos asignados. Desactívala o reasigna esos artículos.");
  const { error } = await supabase.from("categorias_articulos").delete().eq("id", id);
  if (error) throw new Error(`No se pudo eliminar la categoría: ${error.message}`);
  revalidatePath("/admin/categorias");
  revalidatePath("/admin/articulos");
}
