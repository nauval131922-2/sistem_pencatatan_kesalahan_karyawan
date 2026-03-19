import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import MainContentWrapper from "@/components/MainContentWrapper";
import ManualModal from "@/components/ManualModal";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/react";


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
  
  // Fetch latest user data (photo) directly from DB to avoid session size limits
  let userPhoto = null;
  if (session?.userId) {
    try {
      const result = await (await import("@/lib/db")).default.execute({
        sql: 'SELECT photo FROM users WHERE id = ?',
        args: [session.userId]
      });
      userPhoto = result.rows[0]?.photo as string | null;
    } catch (e) {
      console.error("Failed to fetch user photo for layout", e);
    }
  }
  
  // Format user data if session exists
  const user = session ? {
    name: session.name,
    username: session.username,
    role: session.role,
    photo: userPhoto || session.photo, // Prioritize fresh photo from DB
  } : null;

  return (
    <html lang="id">
      <body className={jakarta.className}>
        <MainContentWrapper user={user}>
          {children}
        </MainContentWrapper>
        <ManualModal />
        <SpeedInsights />
        <Analytics />
      </body>

    </html>
  );
}
