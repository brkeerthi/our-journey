import type { Metadata } from "next";
import "./globals.css";
import { Cormorant, Gilda_Display, Montserrat } from 'next/font/google'
import { Toaster } from 'react-hot-toast'
import { Inter } from 'next/font/google'

const cormorant = Cormorant({
  subsets: ['latin'],
  variable: '--font-cormorant',
  display: 'swap',
})

const gilda = Gilda_Display({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-gilda',
})

const montserrat = Montserrat({
  subsets: ['latin'],
  variable: '--font-montserrat',
  display: 'swap',
})

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: "Keerthi & Rakshitha's Echoes of Shared Time",
  description: 'A private collection of our memories together.',
  robots: {
    index: false,
    follow: false,
  },
  openGraph: {
    type: 'website',
    title: "Keerthi & Rakshitha's Echoes of Shared Time",
    description: 'A private collection of our memories together.',
  }
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${cormorant.variable} ${gilda.variable} ${montserrat.variable}`}>
      <head>
        <meta name="robots" content="noindex,nofollow" />
        <meta name="googlebot" content="noindex,nofollow" />
      </head>
      <body suppressHydrationWarning={true} className={`${gilda.className} ${inter.className}`}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
