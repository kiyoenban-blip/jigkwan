import type { NextRequest } from "next/server";
import { fail } from "@/lib/api";
import { getCurrentUserId } from "@/lib/auth";
import { parseReportYear } from "@/lib/reports/annual";
import { getAnnualReport, getFavoriteTeam } from "@/lib/reports/annual-service";
import { renderShareCard, shareCardFileName } from "@/lib/share/card";

// GET /api/reports/annual/card?year=YYYY → 공유 카드 PNG (이미지 저장용)
export async function GET(request: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) return fail(401, "UNAUTHORIZED", "로그인이 필요합니다.");

  const parsed = parseReportYear(request.nextUrl.searchParams.get("year"));
  if (!parsed.ok) return fail(400, "BAD_REQUEST", parsed.message);

  const [report, favoriteTeam] = await Promise.all([
    getAnnualReport(userId, parsed.year),
    getFavoriteTeam(userId),
  ]);
  return renderShareCard(report, favoriteTeam, {
    headers: {
      "Cache-Control": "private, no-store",
      "Content-Disposition": `inline; filename="${shareCardFileName(parsed.year)}"`,
    },
  });
}
