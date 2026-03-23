import type { Metadata } from "next";
import { Geist_Mono, Noto_Sans_SC, Noto_Serif_SC } from "next/font/google";
import type { ReactNode } from "react";

import appleTouchIcon from "../../icon/apple-touch-icon.png";
import favicon16 from "../../icon/favicon-16x16.png";
import favicon32 from "../../icon/favicon-32x32.png";
import { GlobalPageTransition } from "@/components/global-page-transition";

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
  icons: {
    icon: [
      { url: favicon32.src, sizes: "32x32", type: "image/png" },
      { url: favicon16.src, sizes: "16x16", type: "image/png" },
    ],
    apple: [{ url: appleTouchIcon.src, sizes: "180x180", type: "image/png" }],
  },
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
      <body>
        <GlobalPageTransition>{children}</GlobalPageTransition>
      </body>
    </html>
  );
}
