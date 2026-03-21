import type { Metadata } from "next";
import { Inter } from 'next/font/google';
import Script from 'next/script';
import "./globals.css";
import DashboardSidebar from "@/components/DashboardHeader";
import { defaultDescription, defaultKeywords, defaultTitle, siteName, siteUrl } from '@/lib/seo';

const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800', '900'],
});

const websiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: siteName,
  url: siteUrl,
  inLanguage: 'ko-KR',
  description: defaultDescription,
};

const GOOGLE_ANALYTICS_ID = 'G-0KE2RQ8TPN';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: defaultTitle,
    template: `%s | ${siteName}`,
  },
  description: defaultDescription,
  applicationName: siteName,
  keywords: defaultKeywords,
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    url: '/',
    title: `${defaultTitle} | ${siteName}`,
    description: defaultDescription,
    siteName,
    locale: 'ko_KR',
  },
  twitter: {
    card: 'summary_large_image',
    title: `${defaultTitle} | ${siteName}`,
    description: defaultDescription,
  },
};

import { ThemeProvider } from "@/components/ThemeProvider";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
        <script dangerouslySetInnerHTML={{
          __html: `
          try {
            const storedTheme = localStorage.getItem('theme');
            const kstHour = Number(new Intl.DateTimeFormat('en-US', {
              timeZone: 'Asia/Seoul',
              hour: 'numeric',
              hour12: false
            }).format(new Date()));
            const defaultTheme = kstHour >= 7 && kstHour < 19 ? 'light' : 'dark';
            const theme = storedTheme || defaultTheme;

            if (theme === 'dark') {
              document.documentElement.classList.add('dark');
            } else {
              document.documentElement.classList.remove('dark');
            }
          } catch (_) {}
        `}} />
      </head>
      <body className={inter.className}>
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GOOGLE_ANALYTICS_ID}`}
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GOOGLE_ANALYTICS_ID}');
          `}
        </Script>
        <ThemeProvider>
          <div className="dashboard">
            <DashboardSidebar />
            <main className="dashboard-content">
              {children}
            </main>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
