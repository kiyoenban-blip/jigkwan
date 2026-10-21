import { prisma } from "@/lib/db";
import { kstYearRange } from "@/lib/kst";
import { buildAnnualReport, type AnnualReport } from "@/lib/reports/annual";

/** 사용자의 KST 기준 연도별 직관 리포트 */
export async function getAnnualReport(userId: string, year: number): Promise<AnnualReport> {
  const { start, end } = kstYearRange(year);
  const attendances = await prisma.attendance.findMany({
    where: { userId, game: { startsAt: { gte: start, lt: end } } },
    select: {
      cheerTeam: true,
      result: true,
      game: {
        select: {
          startsAt: true,
          stadium: true,
          homeTeam: true,
          awayTeam: true,
          homeScore: true,
          awayScore: true,
          status: true,
        },
      },
      expenses: { select: { category: true, amount: true } },
    },
  });
  return buildAnnualReport(year, attendances);
}
