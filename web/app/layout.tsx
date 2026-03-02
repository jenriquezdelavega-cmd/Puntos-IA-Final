import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Punto IA | Loyalty para negocios",
  description: "Punto IA: coalición de PyMEs unidas para premiar tu lealtad. Check-ins, puntos y recompensas en tus negocios favoritos.",
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
  openGraph: {
    title: "Punto IA | Loyalty para negocios",
    description: "Visita, acumula y gana premios en cafeterías, taquerías, estéticas y más negocios cerca de ti.",
    siteName: "Punto IA",
    locale: "es_MX",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Punto IA | Loyalty para negocios",
    description: "Coalición de PyMEs unidas para premiar tu lealtad.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es-MX">
      <body
        className="antialiased"
        style={{
          // Keep the same CSS variable contract used in globals.css but avoid runtime network fetches.
          ["--font-geist-sans" as string]: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          ["--font-geist-mono" as string]: "'SFMono-Regular', Menlo, Monaco, Consolas, 'Liberation Mono', monospace",
        }}
      >
        {children}
      </body>
    </html>
  );
}
