import type { Metadata } from "next";
import { Geist_Mono, Noto_Sans_SC, Noto_Serif_SC } from "next/font/google";
import type { ReactNode } from "react";

import "./globals.css";

const sans = Noto_Sans_SC({
  variable: "--font-body",
  display: "swap",
  preload: false,
  weight: ["300", "400", "500", "700"],
});

const serif = Noto_Serif_SC({
  variable: "--font-heading",
  display: "swap",
  preload: false,
  weight: ["400", "500", "600", "700"],
});

const mono = Geist_Mono({
  variable: "--font-code",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "NJU Date",
  description: "面向校内用户的认真匹配平台。",
};

export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <html
      lang="zh-CN"
      suppressHydrationWarning
      className={`${sans.variable} ${serif.variable} ${mono.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
