import type { Metadata } from "next";

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
      <body>{children}</body>
    </html>
  );
}
