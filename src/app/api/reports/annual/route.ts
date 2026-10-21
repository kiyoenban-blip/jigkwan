import type { NextRequest } from "next/server";
import { fail, ok } from "@/lib/api";
import { getCurrentUserId } from "@/lib/auth";
import { parseReportYear } from "@/lib/reports/annual";
import { getAnnualReport } from "@/lib/reports/annual-service";

// GET /api/reports/annual?year=YYYY (year 생략 시 KST 기준 올해)
export async function GET(request: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) return fail(401, "UNAUTHORIZED", "로그인이 필요합니다.");

  const parsed = parseReportYear(request.nextUrl.searchParams.get("year"));
  if (!parsed.ok) return fail(400, "BAD_REQUEST", parsed.message);

  return ok(await getAnnualReport(userId, parsed.year));
}
