import type { NextConfig } from "next";

// 공유 카드(ImageResponse)가 런타임에 읽는 한글 폰트
const cardFonts = [
  "./node_modules/pretendard/dist/public/static/Pretendard-Regular.otf",
  "./node_modules/pretendard/dist/public/static/Pretendard-ExtraBold.otf",
];

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  outputFileTracingIncludes: {
    "/api/reports/annual/card": cardFonts,
    "/share/*/image": cardFonts,
  },
};

export default nextConfig;
