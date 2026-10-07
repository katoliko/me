"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser, requireEditor } from "@/lib/auth";

export async function uploadMedia(formData: FormData) {
  await requireEditor();
  const user = await getCurrentUser();
  if (!user) throw new Error("La sesión ha expirado.");
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) throw new Error("Selecciona un archivo.");
  const allowed = ["image/png", "image/jpeg", "image/webp", "application/pdf"];
  if (!allowed.includes(file.type) || file.size > 10 * 1024 * 1024) throw new Error("Formato no permitido o archivo mayor de 10 MB.");
  const supabase = await createClient();
  const extension = file.name.split(".").pop()?.toLowerCase() || "bin";
  const path = `library/${crypto.randomUUID()}.${extension}`;
  const { error: uploadError } = await supabase.storage.from("content-images").upload(path, file, { contentType: file.type });
  if (uploadError) throw new Error(`No se pudo subir el archivo: ${uploadError.message}`);
  const { data } = supabase.storage.from("content-images").getPublicUrl(path);
  const { error } = await supabase.from("media_assets").insert({ storage_path: path, public_url: data.publicUrl, filename: file.name.slice(0, 255), mime_type: file.type, size_bytes: file.size, uploaded_by: user.id });
  if (error) throw new Error(`No se pudo registrar el archivo: ${error.message}`);
  revalidatePath("/admin/archivos");
}
