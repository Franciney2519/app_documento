import type { Metadata } from "next";
import { Manrope, Archivo } from "next/font/google";
import "./globals.css";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-body"
});

const archivo = Archivo({
  subsets: ["latin"],
  variable: "--font-heading"
});

export const metadata: Metadata = {
  title: "Neo Fala Amazônia",
  description: "Portal corporativo interno para comunicação, documentos e áreas de apoio."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body className={`${manrope.variable} ${archivo.variable}`}>{children}</body>
    </html>
  );
}
