import type { Metadata } from "next";
import "./globals.css";
import { themeInitScript } from "./theme-script";

export const metadata: Metadata = {
  title: "Hello World",
  description: "A simple Next.js Hello World app",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-screen">
        {children}
      </body>
    </html>
  );
}
