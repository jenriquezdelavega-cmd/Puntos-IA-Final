import type { Metadata } from "next";
import "./globals.css";

const metadataBase = (() => {
  const raw = String(process.env.PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || "https://puntoia.mx").trim();
  const normalized = raw.startsWith("http://") || raw.startsWith("https://") ? raw : `https://${raw}`;
  try {
    return new URL(normalized);
  } catch {
    return new URL("https://puntoia.mx");
  }
})();

export const metadata: Metadata = {
  metadataBase,
  title: "Punto IA | Loyalty para negocios",
  description: "Punto IA: coalición de PyMEs unidas para premiar tu lealtad. Check-ins, puntos y recompensas en tus negocios favoritos.",
  icons: {
    icon: "/icono.png",
    shortcut: "/icono.png",
    apple: "/icono.png",
  },
  openGraph: {
    title: "Punto IA | Loyalty para negocios",
    description: "Visita, acumula y gana premios en cafeterías, taquerías, estéticas y más negocios cerca de ti.",
    siteName: "Punto IA",
    locale: "es_MX",
    type: "website",
    images: [{ url: "/icono.png" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Punto IA | Loyalty para negocios",
    description: "Coalición de PyMEs unidas para premiar tu lealtad.",
    images: ["/icono.png"],
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
