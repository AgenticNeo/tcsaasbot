import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TangentCloud AI Bots",
  description: "The world's most advanced AI agent orchestration platform by TangentCloud.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
