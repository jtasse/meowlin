import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "What's that cat breed? | Meowlin",
  description: "Upload meow audio and identify the cat breed — Meowlin demo",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
