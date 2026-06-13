import type { Metadata } from "next";
import { Playfair_Display, Source_Serif_4, DM_Sans } from "next/font/google";

import { AuthProvider } from "@/context/AuthContext";
import { Providers } from "@/lib/providers";
import "./globals.css";
import { CookieConsent } from "@/components/Cookieconsent";
import ToastProvider from "@/components/ToastProvider";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  variable: "--font-source-serif",
  weight: ["300", "400", "600"],
  style: ["normal", "italic"],
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "OsunGist — Osun State News & Stories",
    template: "%s | OsunGist",
  },
  description: "Your #1 source for Osun State news, politics, culture, community stories and in-depth reporting.",
  keywords: ["Osun", "Osun State", "Nigeria news", "Osun gist", "Osun news today"],
  openGraph: {
    type: "website",
    locale: "en_NG",
    siteName: "OsunGist",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-scroll-behavior="smooth" className={`${playfair.variable} ${sourceSerif.variable} ${dmSans.variable}`}>
      <body suppressHydrationWarning>
        <Providers>
          <AuthProvider>
            {children}
            {/* <PrivacyConsentBanner/>  */}
            <CookieConsent/>
            <ToastProvider />   
          </AuthProvider>
        </Providers>
      </body>
    </html>
  );
}
