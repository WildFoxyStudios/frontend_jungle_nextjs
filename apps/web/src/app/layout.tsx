import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { Toaster } from "sonner";
import { ProgressLoader } from "@/components/layout/ProgressLoader";
import { ObservabilityProvider } from "@/components/observability/ObservabilityProvider";
import "./globals.css";
import { Suspense } from "react";

const inter = Inter({
 subsets: ["latin"],
 variable: "--font-sans",
 display: "swap",
});

export const metadata: Metadata = {
 title: {
 default: "Jungle Social Network",
 template: "%s | Jungle"
 },
 description: "The ultimate social network platform for community, engagement, and sharing.",
 manifest: "/manifest.json",
 other: {
 "apple-mobile-web-app-capable": "yes",
 "mobile-web-app-capable": "yes",
 "apple-mobile-web-app-status-bar-style": "default",
 },
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
};

export const viewport: Viewport = {
 width: "device-width",
 initialScale: 1,
 maximumScale: 1,
 themeColor: "#6366F1",
};

export default async function RootLayout({
 children,
}: {
 children: React.ReactNode;
}) {
 const locale = await getLocale();
 const messages = await getMessages();
 const dir = ["ar", "fa", "he", "ur"].includes(locale) ? "rtl" : "ltr";

 return (
 <html lang={locale} dir={dir} suppressHydrationWarning>
 <body
 className={`${inter.variable} font-sans min-h-svh overflow-x-hidden bg-background neo-page-bg antialiased`}
 >
 <NextIntlClientProvider locale={locale} messages={messages}>
 <ThemeProvider
 attribute="class"
 defaultTheme="system"
 enableSystem
 themes={["light", "dark", "system", "sunshine", "forest", "facebook"]}
 >
 <ObservabilityProvider>
 <Suspense fallback={null}>
 <ProgressLoader />
 </Suspense>
 {children}
 <Toaster />
 </ObservabilityProvider>
 </ThemeProvider>
 </NextIntlClientProvider>
 </body>
 </html>
 );
}
