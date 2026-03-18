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
  description: "Your body can do it. It's your mind you need to convince. Train hard, stay consistent, and Level Up — Nashik's premier fitness community.",
  icons: {
    icon: "https://i.ibb.co/QBfngyt/Untitled-design-7.png",
    apple: "https://i.ibb.co/QBfngyt/Untitled-design-7.png",
  },
};

export const dynamic = "force-dynamic";

type ThemeName = "dark" | "light" | "orange";

function getThemeForToday(): ThemeName {
  // Use India time so the daily theme matches local gym operations.
  const nowInIndia = new Date(
    new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
  );
  const dayOfWeek = nowInIndia.getDay();

  if (dayOfWeek === 0 || dayOfWeek === 6) {
    return "orange";
  }

  return nowInIndia.getDate() % 2 === 0 ? "light" : "dark";
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const activeTheme = getThemeForToday();

  return (
    <html lang="en" data-theme={activeTheme}>
      <head>
        {/* Elfsight Google Reviews widget */}
        <script src="https://elfsightcdn.com/platform.js" async />
      </head>
      <body className={`${sora.variable} ${bebasNeue.variable}`}>{children}</body>
    </html>
  );
}
