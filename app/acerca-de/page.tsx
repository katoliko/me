import Image from "next/image";
import Link from "next/link";
import { Facebook, Globe, Instagram, Mail, MessageCircle, Send, Youtube } from "lucide-react";
import { AppHeader } from "@/components/layout/app-header";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { Card, CardContent } from "@/components/ui/card";
import { getSiteSettings } from "@/lib/site-settings";
import { sanitizeRichText } from "@/lib/content";

export const instant = false;

const networks = [
  ["facebook", "Facebook", Facebook],
  ["instagram", "Instagram", Instagram],
  ["youtube", "YouTube", Youtube],
  ["whatsapp", "WhatsApp", MessageCircle],
  ["tiktok", "TikTok", Globe],
  ["telegram", "Telegram", Send],
  ["x", "X", Globe],
] as const;

export default async function AboutPage() {
  const settings = await getSiteSettings();
  const about = settings.about;
  if (!about.enabled) return <div className="min-h-screen bg-background"><AppHeader /><main className="mx-auto max-w-3xl px-4 py-20 text-center"><h1 className="font-serif text-4xl font-semibold">Página no disponible</h1></main></div>;
  const social = networks.filter(([key]) => Boolean(settings.social[key]));
  return <div className="min-h-screen bg-background pb-24 lg:pb-0"><AppHeader /><main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 md:py-16">
    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">Conócenos</p>
    <h1 className="mt-3 font-serif text-4xl font-semibold tracking-tight sm:text-5xl">{about.title}</h1>
    <p className="mt-4 max-w-2xl text-lg leading-8 text-muted-foreground">{about.intro}</p>
    {about.imageUrl ? <Image src={about.imageUrl} alt="" width={1200} height={600} unoptimized className="mt-8 max-h-96 w-full rounded-2xl object-cover" /> : null}
    <Card className="mt-8"><CardContent className="prose prose-slate max-w-none p-6 sm:p-8" dangerouslySetInnerHTML={{ __html: sanitizeRichText(about.content) }} /></Card>
    {about.showMission ? <Card className="mt-4"><CardContent className="prose prose-slate max-w-none p-6 sm:p-8"><h2>{about.missionTitle}</h2><div dangerouslySetInnerHTML={{ __html: sanitizeRichText(about.missionContent) }} /></CardContent></Card> : null}
    {about.showContact && (settings.general.contactEmail || settings.general.phone) ? <Card className="mt-4"><CardContent className="p-6 sm:p-8"><h2 className="font-serif text-2xl font-semibold">Contacto</h2><div className="mt-4 grid gap-3 text-muted-foreground">{settings.general.contactEmail ? <a className="flex items-center gap-3 hover:text-foreground" href={`mailto:${settings.general.contactEmail}`}><Mail className="size-5 text-accent" />{settings.general.contactEmail}</a> : null}{settings.general.phone ? <a className="flex items-center gap-3 hover:text-foreground" href={`tel:${settings.general.phone}`}><MessageCircle className="size-5 text-accent" />{settings.general.phone}</a> : null}</div></CardContent></Card> : null}
    {about.showSocial && social.length ? <Card className="mt-4"><CardContent className="p-6 sm:p-8"><h2 className="font-serif text-2xl font-semibold">Síguenos</h2><div className="mt-4 flex flex-wrap gap-3">{social.map(([key, label, Icon]) => <Link key={key} href={settings.social[key]} target="_blank" rel="noreferrer" aria-label={label} className="flex size-11 items-center justify-center rounded-full border border-border bg-background text-muted-foreground transition hover:border-accent hover:text-accent"><Icon className="size-5" aria-hidden="true" /></Link>)}</div></CardContent></Card> : null}
  </main><MobileBottomNav /></div>;
}
