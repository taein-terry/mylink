import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "진태인 (Taein Jin) | 한양대학교 의과대학 의예과 25학번",
  description: "한양대학교 의과대학 의예과 25학번 진태인의 프리미엄 커넥트 프로필 카드입니다. 약력, 학업 목표 및 폼을 확인할 수 있습니다.",
  keywords: ["진태인", "한양대학교", "의과대학", "의예과", "25학번", "프로필", "Pre-med", "Hanyang University"],
  authors: [{ name: "진태인", url: "https://hanyang.ac.kr" }],
  openGraph: {
    title: "진태인 (Taein Jin) | 한양대학교 의과대학 의예과",
    description: "한양대학교 의과대학 의예과 25학번 진태인의 프리미엄 프로필 카드",
    type: "website",
    locale: "ko_KR",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${plusJakartaSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#f5f5f5] text-slate-800 selection:bg-teal-500/20 selection:text-teal-900">
        {children}
      </body>
    </html>
  );
}

