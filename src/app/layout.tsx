import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import MainContentWrapper from "@/components/MainContentWrapper";
import ManualModal from "@/components/ManualModal";

import { getSession } from "@/lib/session";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SIKKA | Dashboard",
  description: "Sistem Pencatatan Kesalahan Karyawan - Divisi Percetakan",
  icons: {
    icon: "/icon.png",
    apple: "/icon.png",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getSession();
  
  // Format user data if session exists
  const user = session ? {
    name: session.name,
    username: session.username,
    role: session.role,
    photo: session.photo,
  } : null;

  return (
    <html lang="en">
      <body className={inter.className}>
        <MainContentWrapper user={user}>
          {children}
        </MainContentWrapper>
        <ManualModal />
      </body>
    </html>
  );
}
