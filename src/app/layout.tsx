import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import MobileAutoRedirect from "@/components/mobile/MobileAutoRedirect";
import { ThemeProvider } from "@/context/ThemeContext";

import "@aws-amplify/ui-react/styles.css";
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
  title: "SKTech",
  description:
    "Integrated E-Governance and Emerging Technology Platform for SK Councils",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "SKTech Mobile",
  },
  icons: {
    apple: "/icons/icon-192.png",
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: "#b91c1c",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="theme-government-dark" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function () {
                try {
                  var saved = localStorage.getItem("sktech.theme");
                  var systemLight = window.matchMedia("(prefers-color-scheme: light)").matches;
                  var theme = saved === "system"
                    ? (systemLight ? "minimal-light" : "government-dark")
                    : saved === "minimal-light" || saved === "emerald-authority" || saved === "royal-purple" || saved === "midnight-elite" || saved === "government-dark"
                      ? saved
                      : "government-dark";
                  document.documentElement.classList.remove("theme-system", "theme-government-dark", "theme-emerald-authority", "theme-royal-purple", "theme-minimal-light", "theme-midnight-elite");
                  document.documentElement.classList.add("theme-" + theme);
                  document.documentElement.style.colorScheme = theme === "minimal-light" ? "light" : "dark";
                } catch (error) {}
              })();
            `,
          }}
        />
        <meta name="theme-color" content="#b91c1c" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider>
          <MobileAutoRedirect />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
