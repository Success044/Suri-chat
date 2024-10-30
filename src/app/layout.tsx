import type { Metadata } from "next";
import "./globals.css";
import Providers from "@/components/Providers";

export const metadata: Metadata = {
  title: "Suri-chatting",
  description:
    "Suri chatting application use for the chating with the friends and family. made with nextJs, next-auth for authenticaition and google authentication, tailwind and many more libraries",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Providers> {children}</Providers>
      </body>
    </html>
  );
}
