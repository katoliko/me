import type { Metadata } from "next";
import { DM_Sans, Source_Serif_4 } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { getSiteSettings, hexToHsl } from "@/lib/site-settings";
import { PwaRegister } from "@/components/pwa-register";
import { AnalyticsTracker } from "@/components/analytics-tracker";
import "./globals.css";
import "ckeditor5/ckeditor5.css";

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  return {
    metadataBase: new URL(defaultUrl),
    title: {
      default: `${settings.general.name} | Fe para cada dia`,
      template: `%s | ${settings.general.name}`,
    },
    description: settings.general.description,
    icons: settings.general.faviconUrl ? { icon: settings.general.faviconUrl } : undefined,
    openGraph: {
      title: settings.general.name,
      description: settings.general.description,
      images: settings.general.logoUrl ? [settings.general.logoUrl] : undefined,
    },
  };
}

const sans = DM_Sans({
  variable: "--font-sans",
  display: "swap",
  subsets: ["latin"],
});

const serif = Source_Serif_4({
  variable: "--font-serif",
  display: "swap",
  subsets: ["latin"],
});

export const instant = false;

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const settings = await getSiteSettings();
  const cssVariables = {
    "--primary": hexToHsl(settings.appearance.primaryColor),
    "--accent": hexToHsl(settings.appearance.accentColor),
  } as React.CSSProperties;

  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${sans.variable} ${serif.variable} font-sans`} style={cssVariables}>
        <ThemeProvider
          attribute="class"
          defaultTheme={settings.appearance.mode}
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <PwaRegister />
          <AnalyticsTracker />
        </ThemeProvider>
      </body>
    </html>
  );
}
