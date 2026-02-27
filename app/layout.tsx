import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Calenbook — Appointment Booking",
  description: "Modern appointment booking system with calendar management",
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
          colorInputBorder: "rgba(255,255,255,0.13)",
          colorAlphaShade: "rgba(255,255,255,0.10)",
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
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
