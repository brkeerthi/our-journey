import type { Metadata } from "next";
import "./globals.css";
import { Cormorant, Gilda_Display, Montserrat } from 'next/font/google'
import { Toaster } from 'react-hot-toast'

const cormorant = Cormorant({
  subsets: ['latin'],
  variable: '--font-cormorant',
  display: 'swap',
})

const gilda = Gilda_Display({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-gilda',
  display: 'swap',
})

const montserrat = Montserrat({
  subsets: ['latin'],
  variable: '--font-montserrat',
  display: 'swap',
})

export const metadata: Metadata = {
  title: "Our Journey - Keerthi & Rakshitha",
  description: "A timeline of our special moments",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${cormorant.variable} ${gilda.variable} ${montserrat.variable}`}>
      <body suppressHydrationWarning={true} className={`${gilda.className}`}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
