import "./globals.scss";

import { GoogleOAuthProvider } from "@react-oauth/google";
import { Analytics } from "@vercel/analytics/react";
import { Metadata } from "next";
import { DM_Sans } from "next/font/google";

import { GOOGLE_CLIENT_ID } from "@/config";

const dmSans = DM_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-dm-sans",
  style: "normal",
  weight: ["100", "300", "400", "500", "700", "900"],
});

export const metadata: Metadata = {
  title: "Daily-Fresh",
  openGraph: {
    images: "./icon.png",
  },
  metadataBase: new URL("https://daily-fresh.vercel.app/"),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={dmSans.className}>
        <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
          {children}
          <Analytics />
        </GoogleOAuthProvider>
      </body>
    </html>
  );
}
