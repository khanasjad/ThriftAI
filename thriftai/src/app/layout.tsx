import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import CookieBanner from "@/components/CookieConsent";

export const metadata: Metadata = {
  title: "Veritas AI - Quality Scoring for DTC Brands",
  description: "AI-powered quality scoring across 27 factors. Transform customer reviews into actionable insights and reduce returns by 25%.",
  keywords: ["AI quality scoring", "DTC brands", "product quality", "return reduction", "veritas ai"],
  authors: [{ name: "Veritas AI" }],
  openGraph: {
    title: "Veritas AI - Quality Scoring for DTC Brands",
    description: "AI-powered quality scoring platform for DTC clothing brands",
    type: "website",
    images: ['/logo.svg'],
  },
  icons: {
    icon: '/logo.svg',
    apple: '/logo.svg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');

          * {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif;
          }
        `}</style>
      </head>
      <body>
        <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:p-4 focus:bg-white focus:text-black">
          Skip to main content
        </a>
        <Providers>
          <div id="main-content">
            {children}
          </div>
        </Providers>
        <CookieBanner />
      </body>
    </html>
  );
}
