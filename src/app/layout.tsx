import type { Metadata } from "next";
import { Michroma, Onest } from "next/font/google";
import "./globals.css";

const michroma = Michroma({
  weight: "400",
  variable: "--font-michroma",
  subsets: ["latin"],
  display: "swap",
});

const onest = Onest({
  weight: ["200", "300", "400", "500", "600", "700", "800"],
  variable: "--font-onest",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "WAPPX — WhatsApp Automation & CRM Engine",
  description: "Balas Chat, Catat Order, Follow-up — Semua Otomatis di WhatsApp. Official Meta Cloud API v22.0 integration.",
  icons: {
    icon: "/icon.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${michroma.variable} ${onest.variable} antialiased`}
    >
      <body className="min-h-full flex flex-col font-secondary bg-[#F7F7F2] text-[#0A504A]">
        {children}
      </body>
    </html>
  );
}
