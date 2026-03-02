import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import ServiceWorkerRegistration from "@/components/ServiceWorkerRegistration";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: "#0f172a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: "Calenbook — Appointment Booking",
  description: "Modern appointment booking system with calendar management",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Calenbook",
  },
  formatDetection: {
    telephone: false,
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      appearance={{
        variables: {
          colorPrimary: "#9333ea",
          colorBackground: "#0f172a",
          colorText: "#e2e8f0",
          borderRadius: "1.25rem",
          fontFamily: "var(--font-geist-sans), Arial, Helvetica, sans-serif",
          colorInputBackground: "rgba(255,255,255,0.08)",
          colorInputText: "#e2e8f0",
          colorBorder: "rgba(255,255,255,0.13)",
        },
        elements: {
          card: "glass-panel shadow-2xl border border-white/10",
          formButtonPrimary: "primary-button py-3 rounded-xl text-base",
          formFieldInput: "glass-input",
          headerTitle: "text-white/90 font-light",
          headerSubtitle: "text-white/60",
          socialButtonsBlockButton: "glass-button",
          dividerRow: "border-white/10",
          footerAction: "text-white/60",
        },
      }}
    >
      <html lang="en">
        <head>
          {/* Apple Touch Icon — iOS uses this for Add to Home Screen */}
          <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        </head>
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
          <ServiceWorkerRegistration />
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
