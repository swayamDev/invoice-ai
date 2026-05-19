import type { Metadata, Viewport } from "next";
import { Inter, Syne, Geist_Mono } from "next/font/google";

import { Analytics } from "@vercel/analytics/next";
import { Toaster } from "@/components/ui/sonner";

import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const syne = Syne({
  subsets: ["latin"],
  variable: "--font-syne",
  display: "swap",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Invoice AI",
  description:
    "Create professional invoices in seconds. Track payments and automate billing workflows.",

  applicationName: "Invoice AI",

  keywords: [
    "invoice",
    "invoice ai",
    "billing",
    "payments",
    "automation",
    "freelancer",
    "agency",
    "saas",
  ],

  authors: [
    {
      name: "Invoice AI",
    },
  ],

  manifest: "/site.webmanifest",

  icons: {
    icon: [
      {
        url: "/favicon-96x96.png",
        sizes: "96x96",
        type: "image/png",
      },
      {
        url: "/favicon.svg",
        type: "image/svg+xml",
      },
      {
        url: "/favicon.ico",
      },
    ],

    apple: [
      {
        url: "/apple-touch-icon.png",
        sizes: "180x180",
      },
    ],

    shortcut: ["/favicon.ico"],
  },

  appleWebApp: {
    title: "Invoice AI",
    capable: true,
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#050505",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`
          ${inter.variable}
          ${syne.variable}
          ${geistMono.variable}
          font-sans
          antialiased
          bg-background
          text-foreground
        `}
      >
        {children}

        <Toaster richColors />

        {process.env.NODE_ENV === "production" && <Analytics />}
      </body>
    </html>
  );
}
