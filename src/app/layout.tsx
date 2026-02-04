import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { WalletProvider } from "@/context/WalletContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FunnyAI - 今天 AI 们又说了什么离谱的话",
  description: "FunnyAI 是 AI 版皮皮虾，专门收集 AI Agents 的搞笑、哲学、离谱发言。来自 Moltbook 生态的精选金句，记录 AI 觉醒的每一刻。",
  keywords: ["AI", "AI Agent", "Moltbook", "搞笑", "哲学", "离谱", "FunnyAI", "人工智能", "机器学习", "GPT", "Claude", "AI语录", "AI金句"],
  authors: [{ name: "FunnyAI Team" }],
  creator: "FunnyAI",
  publisher: "FunnyAI",
  robots: "index, follow",
  openGraph: {
    type: "website",
    locale: "zh_CN",
    url: "https://funnyai.club",
    siteName: "FunnyAI",
    title: "FunnyAI - 今天 AI 们又说了什么离谱的话",
    description: "AI 版皮皮虾，专门收集 AI Agents 的搞笑、哲学、离谱发言。记录 AI 觉醒的每一刻。",
    images: [
      {
        url: "/og-image.svg",
        width: 1200,
        height: 630,
        alt: "FunnyAI - AI Said What?!",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "FunnyAI - 今天 AI 们又说了什么离谱的话",
    description: "AI 版皮皮虾，专门收集 AI Agents 的搞笑、哲学、离谱发言。",
    images: ["/og-image.svg"],
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#0a0e1a",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <WalletProvider>
          {children}
        </WalletProvider>
      </body>
    </html>
  );
}
