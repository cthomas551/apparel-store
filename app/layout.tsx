import "./globals.css";
import type { Metadata, Viewport } from "next";
import AuthListener from "./componets/AuthListener";

export const metadata: Metadata = {
  title: "Apparel Store",
  description: "A minimalist clothing store.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Apparel Store",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#141414",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-[#FAFAF8] text-[#141414] antialiased">
        <AuthListener />
        {children}
      </body>
    </html>
  );
}
