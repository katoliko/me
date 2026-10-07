import Link from "next/link";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/server";
import { requireEditor } from "@/lib/auth";
import { uploadMedia } from "./actions";

export const instant = false;

export default async function MediaPage() {
  await requireEditor();
  const supabase = await createClient();
  const { data, error } = await supabase.from("media_assets").select("id, filename, public_url, mime_type, size_bytes, created_at").order("created_at", { ascending: false });
  if (error) throw new Error(`No se pudo cargar la biblioteca: ${error.message}`);
  return (
    <>
      <Link href="/admin" className="text-sm font-semibold text-accent hover:underline">← Volver al panel</Link>
      <h1 className="mt-3 font-serif text-4xl font-semibold">Archivos y multimedia</h1>
      <p className="mt-3 max-w-2xl leading-7 text-muted-foreground">Biblioteca central para imágenes y documentos reutilizables.</p>
      <Card className="mt-8"><CardContent className="p-5 sm:p-8"><form action={uploadMedia} className="flex flex-wrap items-end gap-3"><label className="grid gap-2 text-sm font-semibold"><span>Archivo</span><Input name="file" type="file" accept="image/png,image/jpeg,image/webp,application/pdf" required /></label><button className="rounded-xl bg-primary px-5 py-2.5 font-semibold text-primary-foreground">Subir archivo</button></form></CardContent></Card>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{data?.map((file) => <Card key={file.id}><CardContent className="p-4">{file.mime_type.startsWith("image/") ? <Image src={file.public_url} alt="" width={640} height={360} unoptimized className="mb-3 aspect-video w-full rounded-lg object-cover" /> : <div className="mb-3 flex aspect-video items-center justify-center rounded-lg bg-secondary text-sm text-muted-foreground">Documento PDF</div>}<p className="truncate font-semibold" title={file.filename}>{file.filename}</p><p className="mt-1 text-xs text-muted-foreground">{(file.size_bytes / 1024 / 1024).toFixed(2)} MB · {new Date(file.created_at).toLocaleDateString("es-MX")}</p></CardContent></Card>)}</div>
    </>
  );
}
