import type { Metadata } from "next";
import { Alexandria, IBM_Plex_Sans_Arabic } from "next/font/google";
import "./globals.css";
import { AppProviders } from "@/context/AppProviders";
import Navbar from "@/components/Navbar";

const display = Alexandria({
  subsets: ["arabic", "latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-display",
});

const body = IBM_Plex_Sans_Arabic({
  subsets: ["arabic", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-body",
});

export const metadata: Metadata = {
  title: "Taqato Academy | أكاديمية تقاطُع",
  description:
    "منصّة تعليمية عربية — كورسات مصوّرة بجودة عالية. An Arabic-first e-learning platform.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body className={`${display.variable} ${body.variable}`}>
        <AppProviders>
          <Navbar />
          <main className="min-h-[calc(100vh-4rem)]">{children}</main>
        </AppProviders>
      </body>
    </html>
  );
}
