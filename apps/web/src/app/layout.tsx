import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bloodline | Royal Family Tree",
  description: "JSON-driven royal archive family tree"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
