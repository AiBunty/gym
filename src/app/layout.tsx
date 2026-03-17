import type { Metadata } from "next";
import { Bebas_Neue, Sora } from "next/font/google";
import "./globals.css";

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-sora",
});

const bebasNeue = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-bebas-neue",
});

export const metadata: Metadata = {
  title: "Wani's Club Level Up",
  description: "Dark mode fitness landing page for Wani's Club Level Up.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Elfsight Google Reviews widget */}
        <script src="https://elfsightcdn.com/platform.js" async />
      </head>
      <body className={`${sora.variable} ${bebasNeue.variable}`}>{children}</body>
    </html>
  );
}
