import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Punto IA | Loyalty para negocios",
  description: "Punto IA: coalición de PyMEs unidas para premiar tu lealtad. Check-ins, puntos y recompensas en tus negocios favoritos.",
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
    apple: "/icon.svg",
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
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
