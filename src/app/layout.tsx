import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import MainContentWrapper from "@/components/MainContentWrapper";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "RecLog | Dashboard",
  description: "Sistem Pencatatan Kesalahan Karyawan - Divisi Percetakan",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <MainContentWrapper>
          {children}
        </MainContentWrapper>
      </body>
    </html>
  );
}
