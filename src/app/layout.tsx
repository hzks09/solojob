import type { Metadata } from "next";
import { Archivo, IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/providers/theme-provider";
import "./globals.css";

const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  weight: ["700", "900"],
});

const plexSans = IBM_Plex_Sans({
  variable: "--font-plex-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["500", "600"],
});

const title = "SoloJob — Devis, factures et relances pour artisans solos";
const description =
  "Crée tes devis, transforme-les en factures, encaisse en ligne et laisse SoloJob relancer tes clients en retard de paiement à ta place.";
const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title,
  description,
  openGraph: {
    title,
    description,
    url: appUrl,
    siteName: "SoloJob",
    locale: "fr_FR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      suppressHydrationWarning
      className={`${archivo.variable} ${plexSans.variable} ${plexMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider>
          {children}
          <Toaster richColors position="top-center" />
          {/* Vercel Analytics ne pose pas de cookie (pas de tracking cross-site,
              pas d'identifiant persistant) — cohérent avec la politique de
              confidentialité actuelle ("aucun cookie de mesure d'audience
              tiers"). Si un outil basé sur des cookies le remplace un jour,
              il faudra mettre à jour src/app/confidentialite/page.tsx. */}
          <Analytics />
        </ThemeProvider>
      </body>
    </html>
  );
}
