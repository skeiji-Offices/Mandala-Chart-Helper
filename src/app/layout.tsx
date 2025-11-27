import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  title: "Mandala Chart Helper",
  description: "Achieve your goals with Mandala Chart Helper",
};

import { Providers } from "@/components/providers";
import { Header } from "@/components/header";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased flex flex-col min-h-screen`}
      >
        <Providers>
          <Header />
          <main className="flex-grow">
            {children}
          </main>
          <footer className="py-4 text-center text-xs text-gray-400">
            <a
              href="https://task-breaker-eight.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-gray-600 transition-colors"
            >
              Created with Task Breaker
            </a>
          </footer>
        </Providers>
      </body>
    </html>
  );
}
