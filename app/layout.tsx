import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Nexrova Lead Intelligence — Oasis Reservation Call Intelligence Dashboard",
  description: "Nexrova Lead Intelligence — real-time property funnel and front-desk semantic intelligence",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={outfit.className} style={{ background: "#f1f5f9", minHeight: "100vh" }}>
        {children}
      </body>
    </html>
  );
}
