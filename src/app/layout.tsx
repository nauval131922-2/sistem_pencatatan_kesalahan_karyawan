import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import MainContentWrapper from "@/components/MainContentWrapper";
import ManualModal from "@/components/ManualModal";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SIKKA | Dashboard",
  description: "Sistem Pencatatan Kesalahan Karyawan - Divisi Percetakan",
  icons: {
    icon: "/icon.png",
    apple: "/icon.png",
  },
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
        <ManualModal />
      </body>
    </html>
  );
}
