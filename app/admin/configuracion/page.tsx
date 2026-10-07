import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { requireAdminPanel } from "@/lib/auth";
import { getSiteSettings } from "@/lib/site-settings";
import { SettingsForm } from "@/components/admin/settings-form";
import { RichTextEditor } from "@/components/admin/rich-text-editor";

export const instant = false;

export default async function SettingsPage() {
  const role = await requireAdminPanel();
  const settings = await getSiteSettings();
  return (
    <>
      <Link href="/admin" className="text-sm font-semibold text-accent hover:underline">← Volver al panel</Link>
      <h1 className="mt-3 font-serif text-4xl font-semibold">Configuración y apariencia</h1>
      <p className="mt-3 max-w-2xl leading-7 text-muted-foreground">Personaliza identidad, portada, redes sociales y colores sin modificar código. Solo el administrador puede guardar cambios.</p>
      {role === "admin" ? <SettingsForm>
        <Card><CardContent className="grid gap-4 p-5 sm:grid-cols-2 sm:p-8"><h2 className="font-serif text-2xl font-semibold sm:col-span-2">Identidad y contacto</h2>
          <Field name="name" label="Nombre de la aplicación" value={settings.general.name} max={80} />
          <Field name="contactEmail" label="Correo de contacto" value={settings.general.contactEmail} type="email" max={160} />
          <Field name="description" label="Descripción" value={settings.general.description} max={240} full />
          <Field name="logoUrl" label="URL del logo" value={settings.general.logoUrl} type="url" max={500} />
          <Field name="faviconUrl" label="URL del favicon" value={settings.general.faviconUrl} type="url" max={500} />
          <Field name="phone" label="Teléfono o WhatsApp" value={settings.general.phone} max={40} />
        </CardContent></Card>
        <Card><CardContent className="grid gap-4 p-5 sm:grid-cols-2 sm:p-8"><h2 className="font-serif text-2xl font-semibold sm:col-span-2">Apariencia segura</h2>
          <Field name="primaryColor" label="Color principal" value={settings.appearance.primaryColor} type="color" />
          <Field name="accentColor" label="Color de acento" value={settings.appearance.accentColor} type="color" />
          <label className="grid gap-2"><span className="text-sm font-semibold">Modo predeterminado</span><select name="mode" defaultValue={settings.appearance.mode} className="h-10 rounded-md border border-input bg-background px-3 text-sm"><option value="system">Preferencia del dispositivo</option><option value="light">Claro</option><option value="dark">Oscuro</option></select></label>
          <p className="self-end text-sm text-muted-foreground">Los colores se convierten en variables HSL. No se permite CSS libre para proteger la legibilidad y el responsive.</p>
        </CardContent></Card>
        <Card><CardContent className="grid gap-4 p-5 sm:grid-cols-2 sm:p-8"><h2 className="font-serif text-2xl font-semibold sm:col-span-2">Portada</h2>
          <Field name="eyebrow" label="Texto superior" value={settings.homepage.eyebrow} max={100} />
          <Field name="homeTitle" label="Título principal" value={settings.homepage.title} max={180} />
          <Field name="homeDescription" label="Descripción de portada" value={settings.homepage.description} max={300} full />
          <Field name="greeting" label="Etiqueta de contenido diario" value={settings.homepage.greeting} max={100} />
          <Field name="dailyLabel" label="Título de contenido diario" value={settings.homepage.dailyLabel} max={100} />
          <Field name="dailyDescription" label="Etiqueta de lecturas" value={settings.homepage.dailyDescription} max={180} />
          <Field name="readingLabel" label="Etiqueta de lecturas" value={settings.homepage.readingLabel} max={100} />
          <Field name="reflectionLabel" label="Etiqueta de reflexión" value={settings.homepage.reflectionLabel} max={100} />
          <Field name="saintLabel" label="Etiqueta de santo" value={settings.homepage.saintLabel} max={100} />
          <label className="grid gap-2"><span className="text-sm font-semibold">Plantilla</span><select name="template" defaultValue={settings.homepage.template} className="h-10 rounded-md border border-input bg-background px-3 text-sm"><option value="serene">Serena</option><option value="classic">Clásica</option></select></label>
          <Toggle name="showDaily" label="Mostrar contenido del día" checked={settings.homepage.showDaily} /><Toggle name="showResources" label="Mostrar recursos" checked={settings.homepage.showResources} /><Toggle name="showDefend" label="Mostrar Defiende tu fe" checked={settings.homepage.showDefend} />
        </CardContent></Card>
        <Card><CardContent className="grid gap-4 p-5 sm:p-8"><h2 className="font-serif text-2xl font-semibold">Botones de contenido diario</h2><p className="text-sm text-muted-foreground">Configura el destino, texto y descripción de los botones de lecturas, reflexión y santo.</p>{(["reading", "reflection", "saint"] as const).map((key) => { const link = settings.homepage[`${key}Link`]; return <div key={key} className="grid gap-3 rounded-xl border p-4 sm:grid-cols-2"><Field name={`${key}LinkTitle`} label={`Texto del botón (${key})`} value={link.title} max={100} /><Field name={`${key}LinkHref`} label="Enlace" value={link.href} max={100} /><Field name={`${key}LinkDescription`} label="Descripción" value={link.description} max={180} full /></div>; })}</CardContent></Card>
        <Card><CardContent className="grid gap-4 p-5 sm:p-8"><h2 className="font-serif text-2xl font-semibold">Botón Defiende tu fe</h2><Field name="defendLinkTitle" label="Texto del botón" value={settings.homepage.defendLink.title} max={100} /><Field name="defendLinkHref" label="Enlace" value={settings.homepage.defendLink.href} max={100} /><Field name="defendLinkDescription" label="Descripción" value={settings.homepage.defendLink.description} max={180} /></CardContent></Card>
        <Card><CardContent className="grid gap-4 p-5 sm:p-8"><h2 className="font-serif text-2xl font-semibold">Enlaces de recursos</h2><p className="text-sm text-muted-foreground">Edita el texto, descripción, destino y visibilidad de cada enlace.</p>{settings.homepage.resources.map((resource, index) => <div key={index} className="grid gap-3 rounded-xl border p-4 sm:grid-cols-2"><Field name={`resource${index + 1}Title`} label="Título" value={resource.title} max={80} /><Field name={`resource${index + 1}Href`} label="Enlace" value={resource.href} max={100} /><Field name={`resource${index + 1}Description`} label="Descripción" value={resource.description} max={160} full /><Toggle name={`resource${index + 1}Visible`} label="Visible" checked={resource.visible} /></div>)}</CardContent></Card>
        <Card><CardContent className="grid gap-4 p-5 sm:grid-cols-2 sm:p-8">
          <h2 className="font-serif text-2xl font-semibold sm:col-span-2">Página Acerca de</h2>
          <p className="text-sm text-muted-foreground sm:col-span-2">Gestiona la información del proyecto sin tocar código. Las secciones pueden ocultarse sin perder su contenido.</p>
          <Toggle name="aboutEnabled" label="Mostrar página Acerca de" checked={settings.about.enabled} />
          <Toggle name="aboutShowContact" label="Mostrar contacto" checked={settings.about.showContact} />
          <Toggle name="aboutShowSocial" label="Mostrar redes sociales" checked={settings.about.showSocial} />
          <Toggle name="aboutShowMission" label="Mostrar misión" checked={settings.about.showMission} />
          <Field name="aboutTitle" label="Título" value={settings.about.title} max={160} />
          <Field name="aboutIntro" label="Introducción" value={settings.about.intro} max={300} full />
          <Field name="aboutImageUrl" label="URL de imagen" value={settings.about.imageUrl} type="url" max={500} full />
          <label className="grid gap-2 sm:col-span-2"><span className="text-sm font-semibold">Contenido principal</span><RichTextEditor name="aboutContent" defaultValue={settings.about.content} placeholder="Describe el proyecto Katoliko..." /></label>
          <Field name="aboutMissionTitle" label="Título de misión" value={settings.about.missionTitle} max={160} />
          <label className="grid gap-2 sm:col-span-2"><span className="text-sm font-semibold">Misión</span><RichTextEditor name="aboutMissionContent" defaultValue={settings.about.missionContent} placeholder="Explica la misión del proyecto..." /></label>
        </CardContent></Card>
        <Card><CardContent className="grid gap-4 p-5 sm:grid-cols-2 sm:p-8"><h2 className="font-serif text-2xl font-semibold sm:col-span-2">Redes sociales visibles</h2><p className="text-sm text-muted-foreground sm:col-span-2">Deja una red vacía para ocultarla. Puedes activar las que utilice el proyecto.</p>{(["facebook", "instagram", "youtube", "whatsapp", "tiktok", "telegram", "x"] as const).map((name) => <Field key={name} name={name} label={name === "x" ? "X (Twitter)" : name} value={settings.social[name]} type="url" max={240} />)}</CardContent></Card>
      </SettingsForm> : <Card className="mt-8"><CardContent className="p-6 text-sm text-muted-foreground">Solo un administrador puede modificar esta configuración.</CardContent></Card>}
    </>
  );
}

function Field({ name, label, value, type = "text", max, full = false }: { name: string; label: string; value: string; type?: string; max?: number; full?: boolean }) {
  return <label className={`grid gap-2 ${full ? "sm:col-span-2" : ""}`}><span className="text-sm font-semibold">{label}</span><Input name={name} type={type} defaultValue={value} maxLength={max} /></label>;
}
function Toggle({ name, label, checked }: { name: string; label: string; checked: boolean }) {
  return <label className="flex items-center gap-2 text-sm"><input type="checkbox" name={name} defaultChecked={checked} />{label}</label>;
}
