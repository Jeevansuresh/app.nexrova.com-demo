import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Call Intelligence Dashboard",
  description: "Real-time call intelligence dashboard",
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
