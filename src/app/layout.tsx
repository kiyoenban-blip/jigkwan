import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  // 공유 링크 미리보기(og:image)의 절대 URL 기준. 미설정 시 Next.js 기본값(로컬 주소 등)
  metadataBase: process.env.SITE_URL ? new URL(process.env.SITE_URL) : undefined,
  title: "직관 가계부",
  description: "KBO 직관 기록과 그날의 지출을 함께 남기는 가계부",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#c30452",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
