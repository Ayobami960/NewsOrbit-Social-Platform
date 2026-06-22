import type { Metadata } from "next";
import { Playfair_Display, Source_Serif_4, DM_Sans } from "next/font/google";
import { Providers } from "@/lib/providers";
import { ToastProvider } from "@/components/ui/toast";
import { AuthProvider } from "@/context/AuthContext";
import { CookieConsent } from "@/components/Cookieconsent";
import ChatPopupWrapper from "@/components/chat/ChatPopupWrapper";
import "./globals.css";

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
    default: "NewsOrbit — Osun State News & Stories",
    template: "%s | NewsOrbit",
  },
  description:
    "Your #1 source for Osun State news, politics, culture, community stories and in-depth reporting.",
  keywords: ["Osun", "Osun State", "Nigeria news", "New Orbit", "Osun news today"],
  openGraph: {
    type: "website",
    locale: "en_NG",
    siteName: "NewsOrbit",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${playfair.variable} ${sourceSerif.variable} ${dmSans.variable}`}
    >
      <body suppressHydrationWarning>
        <Providers>
          <ToastProvider defaultPosition="top-right" defaultDuration={4000}>
            <AuthProvider>
              {children}
              <CookieConsent />
              <ChatPopupWrapper />
            </AuthProvider>
          </ToastProvider>
        </Providers>
      </body>
    </html>
  );
}