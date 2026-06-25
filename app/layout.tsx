import type { Metadata } from 'next';
import { Plus_Jakarta_Sans, Fraunces, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const sans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
});

// Fuentes del modulo tributario (calendario): serif editorial + mono.
const fraunces = Fraunces({
  subsets: ['latin'],
  style: ['normal', 'italic'],
  variable: '--font-fraunces',
});
const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
});

export const metadata: Metadata = {
  title: 'BVR Asesorías',
  description: 'Centro de control de BVR Asesorías: tareas del equipo y calendario tributario',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={`${fraunces.variable} ${jetbrains.variable}`}>
      {/*
        suppressHydrationWarning: algunas extensiones del navegador (p. ej.
        ColorZilla, con cz-shortcut-listen) inyectan atributos en <body> antes
        de que React hidrate, lo que dispara un aviso de hydration mismatch que
        no es un bug de la app. Esto solo silencia ese nivel, no mismatches reales.
      */}
      <body
        suppressHydrationWarning
        className={`${sans.className} bg-slate-50 text-slate-900 antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
