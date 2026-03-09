import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import MainContentWrapper from "@/components/MainContentWrapper";
import ManualModal from "@/components/ManualModal";

import { getSession } from "@/lib/session";

const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"] });

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
      <body className={jakarta.className}>
        <MainContentWrapper user={user}>
          {children}
        </MainContentWrapper>
        <ManualModal />
      </body>
    </html>
  );
}
