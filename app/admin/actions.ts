"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser, requireAdminPanel } from "@/lib/auth";
import { isValidManualSlug, normalizeManualSlug, slugifyTitle } from "@/lib/slug";

const allowed = ["articulos", "lecturas", "reflexiones", "santos", "oraciones"] as const;
type Resource = (typeof allowed)[number];
const fields: Record<Resource, string[]> = {
  articulos: ["titulo","slug","contenido","imagen_url","fecha","categoria","pregunta","respuesta_breve","citas_biblicas","fuentes","destacado"],
  lecturas: ["fecha","tiempo_liturgico","primera_lectura","salmo","segunda_lectura","evangelio"],
  reflexiones: ["fecha","titulo","contenido","pregunta","oracion","proposito"],
  santos: ["fecha","nombre","biografia","virtudes","patronazgo","imagen_url"],
  oraciones: ["titulo","contenido","categoria"],
};
const imageResources = new Set<Resource>(["articulos", "santos"]);
const publicationStatuses = new Set(["draft", "review", "scheduled", "published", "archived"]);
const sourceJoinTables: Record<Resource, string> = {
  articulos: "articulo_fuentes",
  lecturas: "lectura_fuentes",
  reflexiones: "reflexione_fuentes",
  santos: "santo_fuentes",
  oraciones: "oracione_fuentes",
};
function resource(value: FormDataEntryValue | null): Resource {
  if (typeof value !== "string" || !allowed.includes(value as Resource)) throw new Error("Recurso no permitido");
  return value as Resource;
}
function parseContentId(value: FormDataEntryValue | null) {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) throw new Error("El contenido seleccionado no es válido.");
  return id;
}
export async function saveContent(formData: FormData) {
  const role = await requireAdminPanel();
  const user = await getCurrentUser();
  if (!user) throw new Error("La sesión ha expirado. Inicia sesión nuevamente.");
  const table = resource(formData.get("resource"));
  const id = formData.get("id");
  if (id) parseContentId(id);
  const values: Record<string, string | number | boolean | null> = {};
  const sourceIds = formData.getAll("source_ids").map(Number).filter((value) => Number.isInteger(value) && value > 0);
  for (const field of fields[table]) {
    const value = formData.get(field);
    values[field] = field === "destacado" ? value === "on" : typeof value === "string" && value.trim() ? value.trim() : null;
  }
  if (table === "articulos") {
    const title = String(formData.get("titulo") ?? "");
    const submittedSlug = String(formData.get("slug") ?? "");
    const slugMode = formData.get("slug_mode") === "manual" ? "manual" : "auto";
    const normalizedSlug =
      slugMode === "manual" ? normalizeManualSlug(submittedSlug) : slugifyTitle(title);

    if (!normalizedSlug || (slugMode === "manual" && !isValidManualSlug(normalizedSlug))) {
      throw new Error("El slug debe contener solo letras minúsculas separadas por guiones.");
    }

    const supabase = await createClient();
    let uniqueSlug = normalizedSlug;
    let suffix = 2;
    while (true) {
      const { data: conflict, error: conflictError } = await supabase
        .from("articulos")
        .select("id")
        .eq("slug", uniqueSlug)
        .neq("id", Number(id) || 0)
        .maybeSingle();
      if (conflictError) throw new Error(`No se pudo validar el slug: ${conflictError.message}`);
      if (!conflict) break;
      const suffixText = `-${suffix}`;
      const base = normalizedSlug.slice(0, 60 - suffixText.length).replace(/-+$/, "");
      uniqueSlug = `${base}${suffixText}`;
      suffix += 1;
    }
    values.slug = uniqueSlug;
    const categoryId = formData.get("categoria_id");
    if (typeof categoryId === "string" && categoryId.trim()) {
      const parsedCategoryId = Number(categoryId);
      if (!Number.isInteger(parsedCategoryId) || parsedCategoryId <= 0) {
        throw new Error("La categoría seleccionada no es válida.");
      }
      const { data: category, error: categoryError } = await supabase
        .from("categorias_articulos")
        .select("id, nombre, activo")
        .eq("id", parsedCategoryId)
        .maybeSingle();
      if (categoryError) throw new Error(`No se pudo validar la categoría: ${categoryError.message}`);
      if (!category || !category.activo) throw new Error("La categoría seleccionada no está activa.");
      values.categoria_id = parsedCategoryId;
      values.categoria = category.nombre;
    } else {
      values.categoria_id = null;
      values.categoria = null;
    }
  }
  const imageFile = formData.get("image_file");
  if (imageResources.has(table) && imageFile instanceof File && imageFile.size > 0) {
    if (!["image/png", "image/jpeg", "image/webp"].includes(imageFile.type)) {
      throw new Error("La imagen debe ser PNG, JPG o WebP.");
    }
    if (imageFile.size > 5 * 1024 * 1024) {
      throw new Error("La imagen no puede superar los 5 MB.");
    }
    const supabase = await createClient();
    const extension = imageFile.type.split("/")[1].replace("jpeg", "jpg");
    const path = `${table}/${crypto.randomUUID()}.${extension}`;
    const { error: uploadError } = await supabase.storage
      .from("content-images")
      .upload(path, imageFile, { contentType: imageFile.type, upsert: false });
    if (uploadError) throw new Error(`No se pudo subir la imagen: ${uploadError.message}`);
    const { data: publicUrl } = supabase.storage.from("content-images").getPublicUrl(path);
    values.imagen_url = publicUrl.publicUrl;
  }
  const submittedStatus = String(formData.get("status") ?? "draft");
  const status = publicationStatuses.has(submittedStatus) ? submittedStatus : "draft";
  if (role === "author" && status !== "draft") {
    throw new Error("Los autores solo pueden guardar borradores.");
  }
  if (status === "scheduled") {
    const scheduledAt = String(formData.get("scheduled_at") ?? "");
    if (!scheduledAt || Number.isNaN(Date.parse(scheduledAt)) || Date.parse(scheduledAt) <= Date.now()) {
      throw new Error("La fecha programada debe ser una fecha futura válida.");
    }
    values.scheduled_at = new Date(scheduledAt).toISOString();
  } else {
    values.scheduled_at = null;
  }
  values.status = status;
  values.published = status === "published";
  values.updated_by = user.id;
  if (!id) values.created_by = user.id;
  const supabase = await createClient();
  const query = id
    ? supabase.from(table).update(values).eq("id", Number(id)).select("id").single()
    : supabase.from(table).insert(values).select("id").single();
  const { data: saved, error } = await query;
  if (error) throw new Error(`No se pudo guardar: ${error.message}`);
  const savedContentId = saved.id;
  const joinTable = sourceJoinTables[table];
  const { error: clearSourcesError } = await supabase.from(joinTable).delete().eq("content_id", savedContentId);
  if (clearSourcesError) throw new Error(`No se pudieron actualizar las fuentes: ${clearSourcesError.message}`);
  if (sourceIds.length) {
    const { data: validSources, error: sourceError } = await supabase
      .from("content_sources")
      .select("id")
      .in("id", [...new Set(sourceIds)])
      .eq("activo", true);
    if (sourceError) throw new Error(`No se pudieron validar las fuentes: ${sourceError.message}`);
    if (validSources.length !== new Set(sourceIds).size) throw new Error("Una o más fuentes no están activas o no existen.");
    const { error: linkError } = await supabase.from(joinTable).insert([...new Set(sourceIds)].map((sourceId, index) => ({ content_id: savedContentId, source_id: sourceId, orden: index })));
    if (linkError) throw new Error(`No se pudieron asociar las fuentes: ${linkError.message}`);
  }
  revalidatePath(`/${table === "articulos" ? "defiende-tu-fe" : table}`);
  revalidatePath(`/admin/${table}`);
}
export async function deleteContent(formData: FormData) {
  const role = await requireAdminPanel();
  if (role === "author") throw new Error("Los autores no pueden eliminar contenido.");
  const table = resource(formData.get("resource"));
  const id = parseContentId(formData.get("id"));
  const supabase = await createClient();
  const user = await getCurrentUser();
  if (!user) throw new Error("La sesión ha expirado. Inicia sesión nuevamente.");
  const { error } = await supabase.from(table).update({
    status: "archived",
    published: false,
    published_at: null,
    scheduled_at: null,
    deleted_at: new Date().toISOString(),
    deleted_by: user.id,
    updated_by: user.id,
  }).eq("id", id).is("deleted_at", null);
  if (error) throw new Error(`No se pudo eliminar: ${error.message}`);
  revalidatePath(`/admin/${table}`);
  revalidatePath("/admin/papelera");
}

export async function restoreContent(formData: FormData) {
  const role = await requireAdminPanel();
  if (role === "author") throw new Error("Los autores no pueden restaurar contenido.");
  const table = resource(formData.get("resource"));
  const id = parseContentId(formData.get("id"));
  const supabase = await createClient();
  const { error } = await supabase.from(table).update({
    status: "draft",
    published: false,
    published_at: null,
    scheduled_at: null,
    deleted_at: null,
    deleted_by: null,
  }).eq("id", id).not("deleted_at", "is", null);
  if (error) throw new Error(`No se pudo restaurar: ${error.message}`);
  revalidatePath(`/admin/${table}`);
  revalidatePath("/admin/papelera");
}

export async function permanentlyDeleteContent(formData: FormData) {
  const role = await requireAdminPanel();
  if (role !== "admin") throw new Error("Solo un administrador puede eliminar definitivamente.");
  const table = resource(formData.get("resource"));
  const id = parseContentId(formData.get("id"));
  const supabase = await createClient();
  const { error } = await supabase.from(table).delete().eq("id", id).not("deleted_at", "is", null);
  if (error) throw new Error(`No se pudo eliminar definitivamente: ${error.message}`);
  revalidatePath("/admin/papelera");
}
