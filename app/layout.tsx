import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "norré / recreation plan",
  description: "A prioritized plan for recreating the Norré Design storefront.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
