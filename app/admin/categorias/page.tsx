import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireEditor } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { deleteCategory, saveCategory } from "./actions";

export const instant = false;

export default async function CategoriesPage() {
  await requireEditor();
  const supabase = await createClient();
  const { data: categories, error } = await supabase
    .from("categorias_articulos")
    .select("*")
    .order("orden")
    .order("nombre");
  if (error) throw new Error(`No se pudieron cargar las categorías: ${error.message}`);

  return (
    <>
      <Link href="/admin" className="text-sm font-semibold text-accent hover:underline">← Volver al panel</Link>
      <h1 className="mt-3 font-serif text-4xl font-semibold">Categorías de artículos</h1>
      <p className="mt-3 max-w-2xl leading-7 text-muted-foreground">
        Crea y organiza las categorías que aparecerán al redactar artículos. Desactiva una categoría si ya no quieres ofrecerla sin perder su historial.
      </p>
      <Card className="mt-8">
        <CardContent className="p-5 sm:p-8">
          <h2 className="font-serif text-2xl font-semibold">Nueva categoría</h2>
          <CategoryForm />
        </CardContent>
      </Card>
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {categories?.map((category) => (
          <Card key={category.id}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-serif text-xl font-semibold">{category.nombre}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {category.descripcion || "Sin descripción"} · {category.activo ? "Activa" : "Inactiva"}
                  </p>
                </div>
                <span className="size-6 rounded-full border" style={{ backgroundColor: category.color }} title={`Color ${category.color}`} />
              </div>
              <details className="mt-4">
                <summary className="cursor-pointer text-sm font-semibold text-accent">Editar categoría</summary>
                <CategoryForm item={category} />
              </details>
              <form action={deleteCategory} className="mt-3">
                <input type="hidden" name="id" value={category.id} />
                <button className="text-sm font-semibold text-destructive">Eliminar</button>
              </form>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}

function CategoryForm({ item }: { item?: Record<string, unknown> }) {
  return (
    <form action={saveCategory} className="mt-4 grid gap-4 sm:grid-cols-2">
      {item ? <input type="hidden" name="id" value={String(item.id)} /> : null}
      <label className="grid gap-2">
        <span className="text-sm font-semibold">Nombre</span>
        <Input name="nombre" defaultValue={String(item?.nombre ?? "")} required maxLength={80} placeholder="Apologética" />
      </label>
      <label className="grid gap-2">
        <span className="text-sm font-semibold">Color</span>
        <Input name="color" type="color" defaultValue={String(item?.color ?? "#B86B4B")} />
      </label>
      <label className="grid gap-2 sm:col-span-2">
        <span className="text-sm font-semibold">Descripción</span>
        <Input name="descripcion" defaultValue={String(item?.descripcion ?? "")} maxLength={180} placeholder="Contenido para comprender y defender la fe." />
      </label>
      <label className="grid gap-2">
        <span className="text-sm font-semibold">Orden</span>
        <Input name="orden" type="number" defaultValue={String(item?.orden ?? 0)} min={0} />
      </label>
      {item ? (
        <label className="flex items-center gap-2 self-end pb-2 text-sm font-medium">
          <input type="checkbox" name="activo" defaultChecked={Boolean(item.activo)} />
          Categoría activa
        </label>
      ) : null}
      <div className="flex items-end">
        <button className="rounded-xl bg-primary px-5 py-2.5 font-semibold text-primary-foreground">Guardar categoría</button>
      </div>
    </form>
  );
}
