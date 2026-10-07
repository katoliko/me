import { BookOpen, Heart } from "lucide-react";
import { AppHeader } from "@/components/layout/app-header";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { SectionHeading } from "@/components/layout/section-heading";
import { DefendYourFaith } from "@/components/home/defend-your-faith";
import { DailyReadingCard } from "@/components/home/daily-reading-card";
import { QuickAccessCard } from "@/components/home/quick-access-card";
import { ReflectionCard } from "@/components/home/reflection-card";
import { SaintCard } from "@/components/home/saint-card";
import { Badge } from "@/components/ui/badge";
import { getSiteSettings } from "@/lib/site-settings";
import { NotificationOptIn } from "@/components/notification-opt-in";
import { getDailyContent } from "@/lib/daily-content";
import { getLiturgicalDay } from "@/lib/liturgical-calendar";

export default async function Home() {
  const settings = await getSiteSettings();
  const [daily, liturgical] = await Promise.all([getDailyContent(), getLiturgicalDay()]);
  return (
    <div className="min-h-screen bg-background pb-24 lg:pb-0">
      <AppHeader />

      <main>
        <section className={`relative overflow-hidden ${settings.homepage.template === "classic" ? "bg-secondary/30" : ""}`}>
          <div className="absolute -right-24 -top-24 size-72 rounded-full bg-gold/10 blur-3xl" />
          <div className="mx-auto max-w-6xl px-4 pb-12 pt-10 sm:px-6 sm:pb-16 sm:pt-14">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Badge variant="outline" className="border-gold/40 bg-gold/10 text-primary">{settings.homepage.eyebrow}</Badge>
            </div>
            <h1 className="mt-5 max-w-2xl font-serif text-4xl font-semibold leading-[1.08] tracking-tight sm:text-5xl">
              {settings.homepage.title}
            </h1>
            <p className="mt-4 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">
              {settings.homepage.description}
            </p>
            {liturgical ? (
              <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3 rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm sm:max-w-2xl">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Celebración de hoy</p>
                  <p className="mt-1 font-semibold text-foreground">{liturgical.celebration}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Color litúrgico</p>
                  <p className="mt-1 flex items-center gap-2 font-semibold text-primary">
                    <span
                      aria-hidden="true"
                      className={`size-3 rounded-full border border-black/15 shadow-sm ${
                        liturgical.color.toLowerCase().includes("verde")
                          ? "bg-green-600"
                          : liturgical.color.toLowerCase().includes("blanco") || liturgical.color.toLowerCase().includes("dorado")
                            ? "bg-yellow-100"
                            : liturgical.color.toLowerCase().includes("rojo")
                              ? "bg-red-600"
                              : liturgical.color.toLowerCase().includes("rosa")
                                ? "bg-pink-300"
                                : "bg-purple-700"
                      }`}
                    />
                    <span>{liturgical.color}</span>
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Tiempo litúrgico</p>
                  <p className="mt-1 font-semibold text-primary">{liturgical.season}</p>
                </div>
              </div>
            ) : null}
            <div className="mt-6"><NotificationOptIn /></div>
          </div>
        </section>

        {settings.homepage.showDaily ? <section className="mx-auto max-w-6xl px-4 pb-14 sm:px-6" aria-labelledby="contenido-hoy">
          <SectionHeading id="contenido-hoy" eyebrow={settings.homepage.greeting} title={settings.homepage.dailyLabel} />
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <DailyReadingCard content={daily.reading} label={settings.homepage.readingLabel} link={settings.homepage.readingLink} />
            <ReflectionCard content={daily.reflection} label={settings.homepage.reflectionLabel} link={settings.homepage.reflectionLink} />
            <SaintCard content={daily.saint} label={settings.homepage.saintLabel} link={settings.homepage.saintLink} />
          </div>
        </section> : null}

        {settings.homepage.showResources ? <section className="border-y border-border/70 bg-secondary/30" aria-labelledby="accesos">
          <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
            <SectionHeading id="accesos" eyebrow="Explora" title="Recursos para tu camino" />
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {settings.homepage.resources.filter((resource) => resource.visible).map((resource, index) => (
                <QuickAccessCard key={`${resource.href}-${index}`} href={resource.href} title={resource.title} description={resource.description} icon={index % 2 ? Heart : BookOpen} />
              ))}
            </div>
          </div>
        </section> : null}

        {settings.homepage.showDefend ? <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6" aria-labelledby="defiende">
          <h2 id="defiende" className="sr-only">
            Defiende tu fe
          </h2>
          <DefendYourFaith link={settings.homepage.defendLink} description={settings.homepage.defendLink.description} />
        </section> : null}
      </main>

      <footer className="mx-auto flex max-w-6xl items-center justify-between px-4 py-8 text-sm text-muted-foreground sm:px-6">
        <p className="font-serif text-lg text-foreground">{settings.general.name}</p>
        <p>Fe, esperanza y cercanía.</p>
      </footer>

      <MobileBottomNav />
    </div>
  );
}
