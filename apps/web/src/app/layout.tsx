import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { Toaster } from "sonner";
import { QueryProvider } from "@/providers/QueryProvider";
import { ProgressLoader } from "@/components/layout/ProgressLoader";
import "./globals.css";
import { Suspense } from "react";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "Jungle Social Network",
    template: "%s | Jungle"
  },
  description: "The ultimate social network platform for community, engagement, and sharing.",
  manifest: "/manifest.json",
  openGraph: {
    type: "website",
    siteName: "Jungle",
    title: "Jungle Social Network",
    description: "Connect with friends and the world around you on Jungle.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Jungle Social Network",
    description: "Connect with friends and the world around you on Jungle.",
  },
  viewport: "width=device-width, initial-scale=1, maximum-scale=1",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={inter.className}>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <QueryProvider>
              <Suspense fallback={null}>
                <ProgressLoader />
              </Suspense>
              {children}
              <Toaster />
            </QueryProvider>
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
