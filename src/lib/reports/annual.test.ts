import { describe, expect, it } from "vitest";
import type { TeamCode } from "@/generated/prisma/enums";
import { kstDate } from "@/lib/kst";
import {
  buildAnnualReport,
  parseReportYear,
  resolveOutcome,
  type ReportAttendance,
} from "@/lib/reports/annual";

type VisitOptions = {
  at?: Date;
  stadium?: string;
  home?: TeamCode;
  away?: TeamCode;
  cheer?: TeamCode;
  score?: [number, number] | null;
  status?: ReportAttendance["game"]["status"];
  result?: ReportAttendance["result"];
  expenses?: ReportAttendance["expenses"];
};

function visit({
  at = kstDate(2026, 5, 1, 18, 30),
  stadium = "잠실야구장",
  home = "LG",
  away = "KIA",
  cheer = "LG",
  score = [3, 1],
  status = score ? "FINAL" : "SCHEDULED",
  result = null,
  expenses = [],
}: VisitOptions = {}): ReportAttendance {
  return {
    cheerTeam: cheer,
    result,
    game: {
      startsAt: at,
      stadium,
      homeTeam: home,
      awayTeam: away,
      homeScore: score?.[0] ?? null,
      awayScore: score?.[1] ?? null,
      status,
    },
    expenses,
  };
}

describe("buildAnnualReport", () => {
  it("직관 0회면 모든 값이 0이고 0 나누기가 없다", () => {
    const report = buildAnnualReport(2026, []);

    expect(report.attendanceCount).toBe(0);
    expect(report.totalExpense).toBe(0);
    expect(report.averageExpense).toBe(0);
    expect(report.record).toEqual({ wins: 0, losses: 0, draws: 0, undecided: 0, winRate: null });
    expect(report.categories).toHaveLength(5);
    expect(report.categories.every((c) => c.amount === 0 && c.ratio === 0)).toBe(true);
    expect(report.stadiums).toEqual([]);
    expect(report.topStadium).toBeNull();
    expect(report.monthly).toHaveLength(12);
    expect(report.monthly.every((m) => m.amount === 0)).toBe(true);
  });

  it("직관 1회를 집계한다", () => {
    const report = buildAnnualReport(2026, [
      visit({
        at: kstDate(2026, 4, 11, 17),
        expenses: [
          { category: "TICKET", amount: 22000 },
          { category: "FOOD", amount: 15000 },
        ],
      }),
    ]);

    expect(report.attendanceCount).toBe(1);
    expect(report.totalExpense).toBe(37000);
    expect(report.averageExpense).toBe(37000);
    expect(report.record).toEqual({ wins: 1, losses: 0, draws: 0, undecided: 0, winRate: 1 });
    expect(report.stadiums).toEqual([{ stadium: "잠실야구장", count: 1 }]);
    expect(report.topStadium).toBe("잠실야구장");
    expect(report.monthly[3]).toEqual({ month: 4, amount: 37000 });
    expect(report.categories.find((c) => c.category === "TICKET")).toEqual({
      category: "TICKET",
      amount: 22000,
      ratio: 22000 / 37000,
    });
  });

  it("무승부는 승률 계산에서 빼고 따로 센다", () => {
    const report = buildAnnualReport(2026, [
      visit({ score: [5, 2] }),
      visit({ score: [1, 4] }),
      visit({ score: [3, 3] }),
      visit({ score: [3, 3] }),
    ]);

    expect(report.record).toEqual({ wins: 1, losses: 1, draws: 2, undecided: 0, winRate: 0.5 });
  });

  it("무승부만 있으면 승률은 null", () => {
    const report = buildAnnualReport(2026, [visit({ score: [2, 2] })]);

    expect(report.record.draws).toBe(1);
    expect(report.record.winRate).toBeNull();
  });

  it("지출 없는 직관도 횟수·구장·승패에는 포함되고 평균 지출을 낮춘다", () => {
    const report = buildAnnualReport(2026, [
      visit({ expenses: [{ category: "TICKET", amount: 30001 }] }),
      visit({ stadium: "고척스카이돔", expenses: [] }),
    ]);

    expect(report.attendanceCount).toBe(2);
    expect(report.totalExpense).toBe(30001);
    expect(report.averageExpense).toBe(15001); // 15000.5 반올림, 정수
    expect(Number.isInteger(report.averageExpense)).toBe(true);
    expect(report.stadiums).toHaveLength(2);
    expect(report.record.wins).toBe(2);
  });

  describe("연도 경계 (KST)", () => {
    const lastNight = visit({
      at: kstDate(2025, 12, 31, 23, 59),
      expenses: [{ category: "FOOD", amount: 1000 }],
    });
    const newYear = visit({
      at: kstDate(2026, 1, 1, 0, 0),
      expenses: [{ category: "FOOD", amount: 2000 }],
    });

    it("KST 12/31 23:59는 그해, 1/1 00:00은 다음 해로 집계된다", () => {
      // UTC로는 둘 다 2025-12-31이지만 KST 기준으로 나뉜다
      expect(newYear.game.startsAt.toISOString()).toBe("2025-12-31T15:00:00.000Z");

      const report2025 = buildAnnualReport(2025, [lastNight, newYear]);
      const report2026 = buildAnnualReport(2026, [lastNight, newYear]);

      expect(report2025.attendanceCount).toBe(1);
      expect(report2025.totalExpense).toBe(1000);
      expect(report2025.monthly[11].amount).toBe(1000);

      expect(report2026.attendanceCount).toBe(1);
      expect(report2026.totalExpense).toBe(2000);
      expect(report2026.monthly[0].amount).toBe(2000);
    });
  });

  it("응원팀이 원정이면 원정 점수 기준으로 승패를 판정한다", () => {
    const report = buildAnnualReport(2026, [
      visit({ home: "LOTTE", away: "LG", cheer: "LG", score: [3, 8], stadium: "사직야구장" }),
      visit({ home: "SSG", away: "LG", cheer: "LG", score: [1, 0], stadium: "인천SSG랜더스필드" }),
    ]);

    expect(report.record).toEqual({ wins: 1, losses: 1, draws: 0, undecided: 0, winRate: 0.5 });
  });

  it("카테고리 비중의 합은 1이고 월별 추이는 1~12월 모두 채운다", () => {
    const report = buildAnnualReport(2026, [
      visit({
        at: kstDate(2026, 3, 28),
        expenses: [
          { category: "TICKET", amount: 30000 },
          { category: "GOODS", amount: 89000 },
        ],
      }),
      visit({
        at: kstDate(2026, 9, 5),
        expenses: [
          { category: "TRANSPORT", amount: 47000 },
          { category: "ETC", amount: 4000 },
        ],
      }),
    ]);

    expect(report.categories.map((c) => c.category)).toEqual([
      "TICKET",
      "TRANSPORT",
      "FOOD",
      "GOODS",
      "ETC",
    ]);
    expect(report.categories.reduce((sum, c) => sum + c.ratio, 0)).toBeCloseTo(1);
    expect(report.monthly.map((m) => m.month)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
    expect(report.monthly.map((m) => m.amount)).toEqual([0, 0, 119000, 0, 0, 0, 0, 0, 51000, 0, 0, 0]);
  });

  it("구장은 방문 횟수 내림차순, 같으면 이름순으로 정렬한다", () => {
    const report = buildAnnualReport(2026, [
      visit({ stadium: "사직야구장" }),
      visit({ stadium: "잠실야구장" }),
      visit({ stadium: "고척스카이돔" }),
      visit({ stadium: "잠실야구장" }),
    ]);

    expect(report.stadiums).toEqual([
      { stadium: "잠실야구장", count: 2 },
      { stadium: "고척스카이돔", count: 1 },
      { stadium: "사직야구장", count: 1 },
    ]);
    expect(report.topStadium).toBe("잠실야구장");
  });

  it("취소·결과 미정 경기는 직관 횟수와 지출에는 들어가고 승률에서는 빠진다", () => {
    const report = buildAnnualReport(2026, [
      visit({ score: null, status: "CANCELED", expenses: [{ category: "TRANSPORT", amount: 6400 }] }),
      visit({ score: null, status: "SCHEDULED" }),
      visit({ score: [4, 3] }),
    ]);

    expect(report.attendanceCount).toBe(3);
    expect(report.totalExpense).toBe(6400);
    expect(report.record).toEqual({ wins: 1, losses: 0, draws: 0, undecided: 2, winRate: 1 });
  });
});

describe("resolveOutcome", () => {
  it("종료된 경기는 기록된 result보다 점수를 우선한다", () => {
    expect(resolveOutcome(visit({ score: [1, 2], result: "WIN" }))).toBe("LOSS");
  });

  it("점수가 없으면 사용자가 기록한 result를 쓴다", () => {
    expect(resolveOutcome(visit({ score: null, result: "DRAW" }))).toBe("DRAW");
  });

  it("응원팀이 경기 팀이 아니면 result를 쓰고, 없으면 미정", () => {
    expect(resolveOutcome(visit({ cheer: "NC", result: "WIN" }))).toBe("WIN");
    expect(resolveOutcome(visit({ cheer: "NC" }))).toBe("UNDECIDED");
  });

  it("취소된 경기는 result가 있어도 미정", () => {
    expect(resolveOutcome(visit({ score: null, status: "CANCELED", result: "WIN" }))).toBe("UNDECIDED");
  });
});

describe("parseReportYear", () => {
  const now = new Date("2026-10-21T03:00:00Z");

  it("비어 있으면 KST 기준 올해", () => {
    expect(parseReportYear(null, now)).toEqual({ ok: true, year: 2026 });
    expect(parseReportYear("", now)).toEqual({ ok: true, year: 2026 });
    // UTC 12/31 15:00 = KST 1/1 00:00
    expect(parseReportYear(null, new Date("2026-12-31T15:00:00Z"))).toEqual({ ok: true, year: 2027 });
  });

  it("YYYY 형식과 범위를 검사한다", () => {
    expect(parseReportYear("2025", now)).toEqual({ ok: true, year: 2025 });
    expect(parseReportYear("25", now).ok).toBe(false);
    expect(parseReportYear("2025.5", now).ok).toBe(false);
    expect(parseReportYear("1981", now).ok).toBe(false);
    expect(parseReportYear("2027", now).ok).toBe(false);
  });
});
