import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Claud Friend - Confessional Video Chat",
  description:
    "A safe, anonymous space to share and be heard. Connect with compassionate listeners in a confidential video chat environment.",
  keywords: ["confessional", "video chat", "anonymous", "listener", "support"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <main className="min-h-screen">{children}</main>
        <Toaster />
      </body>
    </html>
  );
}
