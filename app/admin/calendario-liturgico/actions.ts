"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireEditor } from "@/lib/auth";

const liturgicalTimes = new Set(["adviento", "navidad", "cuaresma", "pascua", "ordinario"]);
const colors = new Set(["verde", "blanco", "rojo", "morado", "rosa", "dorado"]);
const grades = new Set(["solemnidad", "fiesta", "memoria", "feria"]);

function optionalId(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || !value.trim()) return null;
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) throw new Error("Una asociación de contenido no es válida.");
  return id;
}

export async function saveLiturgicalDay(formData: FormData) {
  await requireEditor();
  const id = Number(formData.get("id"));
  const fecha = String(formData.get("fecha") ?? "");
  const celebracion = String(formData.get("celebracion") ?? "").trim();
  const tiempo_liturgico = String(formData.get("tiempo_liturgico") ?? "");
  const color_liturgico = String(formData.get("color_liturgico") ?? "");
  const grado = String(formData.get("grado") ?? "");
  const descripcion = String(formData.get("descripcion") ?? "").trim() || null;
  const lectura_id = optionalId(formData.get("lectura_id"));
  const reflexion_id = optionalId(formData.get("reflexion_id"));
  const santo_id = optionalId(formData.get("santo_id"));
  const activo = formData.get("activo") === "on" || !id;

  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) throw new Error("La fecha no es válida.");
  if (!celebracion) throw new Error("La celebración es obligatoria.");
  if (!liturgicalTimes.has(tiempo_liturgico) || !colors.has(color_liturgico) || !grades.has(grado)) {
    throw new Error("La configuración litúrgica no es válida.");
  }

  const supabase = await createClient();
  const values = { fecha, celebracion, tiempo_liturgico, color_liturgico, grado, descripcion, lectura_id, reflexion_id, santo_id, activo };
  const query = id
    ? supabase.from("liturgical_calendar").update(values).eq("id", id)
    : supabase.from("liturgical_calendar").insert(values);
  const { error } = await query;
  if (error) throw new Error(`No se pudo guardar la celebración: ${error.message}`);
  revalidatePath("/admin/calendario-liturgico");
}

export async function deleteLiturgicalDay(formData: FormData) {
  await requireEditor();
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id) || id <= 0) throw new Error("La celebración seleccionada no es válida.");
  const supabase = await createClient();
  const { error } = await supabase.from("liturgical_calendar").update({ activo: false }).eq("id", id);
  if (error) throw new Error(`No se pudo desactivar la celebración: ${error.message}`);
  revalidatePath("/admin/calendario-liturgico");
}
