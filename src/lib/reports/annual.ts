// 연간 직관 리포트 집계 (순수 함수 — DB·UI와 분리)
import type {
  AttendanceResult,
  ExpenseCategory,
  GameStatus,
  TeamCode,
} from "@/generated/prisma/enums";
import { currentKstYear, toKstParts } from "@/lib/kst";

export const EXPENSE_CATEGORIES = [
  "TICKET",
  "TRANSPORT",
  "FOOD",
  "GOODS",
  "ETC",
] as const satisfies readonly ExpenseCategory[];

export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  TICKET: "티켓",
  TRANSPORT: "교통",
  FOOD: "음식",
  GOODS: "굿즈",
  ETC: "기타",
};

/** 집계에 필요한 직관 기록 형태 (Prisma 조회 결과를 그대로 넘길 수 있다) */
export type ReportAttendance = {
  cheerTeam: TeamCode;
  result: AttendanceResult | null;
  game: {
    startsAt: Date;
    stadium: string;
    homeTeam: TeamCode;
    awayTeam: TeamCode;
    homeScore: number | null;
    awayScore: number | null;
    status: GameStatus;
  };
  expenses: { category: ExpenseCategory; amount: number }[];
};

export type Outcome = "WIN" | "LOSS" | "DRAW" | "UNDECIDED";

export type AnnualReport = {
  year: number;
  attendanceCount: number;
  /** 원 단위 */
  totalExpense: number;
  /** 원 단위, 반올림. 직관 0회면 0 */
  averageExpense: number;
  record: {
    wins: number;
    losses: number;
    draws: number;
    /** 취소·결과 미정 경기 */
    undecided: number;
    /** wins / (wins + losses), 0~1. 승패가 하나도 없으면 null */
    winRate: number | null;
  };
  /** 항상 5개 카테고리 모두 포함. ratio는 0~1 (총 지출 0이면 0) */
  categories: { category: ExpenseCategory; amount: number; ratio: number }[];
  /** 방문 횟수 내림차순, 같으면 구장명 오름차순 */
  stadiums: { stadium: string; count: number }[];
  topStadium: string | null;
  /** 1~12월 KST 기준, 데이터 없는 달은 0 */
  monthly: { month: number; amount: number }[];
};

/**
 * 응원팀 기준 경기 결과.
 * 경기가 종료(FINAL)되어 점수가 있고 응원팀이 해당 경기 팀이면 점수로 판정하고,
 * 그렇지 않으면 사용자가 기록한 결과(result)를 쓴다. 취소된 경기는 항상 미정.
 */
export function resolveOutcome(attendance: ReportAttendance): Outcome {
  const { game, cheerTeam } = attendance;
  if (game.status === "CANCELED") return "UNDECIDED";

  const isHome = cheerTeam === game.homeTeam;
  const isAway = cheerTeam === game.awayTeam;
  if (
    game.status === "FINAL" &&
    game.homeScore !== null &&
    game.awayScore !== null &&
    (isHome || isAway)
  ) {
    const mine = isHome ? game.homeScore : game.awayScore;
    const theirs = isHome ? game.awayScore : game.homeScore;
    if (mine > theirs) return "WIN";
    if (mine < theirs) return "LOSS";
    return "DRAW";
  }

  return attendance.result ?? "UNDECIDED";
}

export function buildAnnualReport(year: number, attendances: ReportAttendance[]): AnnualReport {
  const inYear = attendances.filter((a) => toKstParts(a.game.startsAt).year === year);

  const record = { wins: 0, losses: 0, draws: 0, undecided: 0 };
  const categoryTotals = new Map<ExpenseCategory, number>(EXPENSE_CATEGORIES.map((c) => [c, 0]));
  const stadiumCounts = new Map<string, number>();
  const monthlyTotals = Array.from({ length: 12 }, () => 0);
  let totalExpense = 0;

  for (const attendance of inYear) {
    const outcome = resolveOutcome(attendance);
    if (outcome === "WIN") record.wins += 1;
    else if (outcome === "LOSS") record.losses += 1;
    else if (outcome === "DRAW") record.draws += 1;
    else record.undecided += 1;

    const { stadium, startsAt } = attendance.game;
    stadiumCounts.set(stadium, (stadiumCounts.get(stadium) ?? 0) + 1);

    const monthIndex = toKstParts(startsAt).month - 1;
    for (const expense of attendance.expenses) {
      totalExpense += expense.amount;
      monthlyTotals[monthIndex] += expense.amount;
      categoryTotals.set(expense.category, (categoryTotals.get(expense.category) ?? 0) + expense.amount);
    }
  }

  const decided = record.wins + record.losses;
  const stadiums = [...stadiumCounts.entries()]
    .map(([stadium, count]) => ({ stadium, count }))
    .sort((a, b) => b.count - a.count || a.stadium.localeCompare(b.stadium, "ko"));

  return {
    year,
    attendanceCount: inYear.length,
    totalExpense,
    averageExpense: inYear.length === 0 ? 0 : Math.round(totalExpense / inYear.length),
    record: { ...record, winRate: decided === 0 ? null : record.wins / decided },
    categories: EXPENSE_CATEGORIES.map((category) => {
      const amount = categoryTotals.get(category) ?? 0;
      return { category, amount, ratio: totalExpense === 0 ? 0 : amount / totalExpense };
    }),
    stadiums,
    topStadium: stadiums[0]?.stadium ?? null,
    monthly: monthlyTotals.map((amount, index) => ({ month: index + 1, amount })),
  };
}

/** KBO 원년 */
export const MIN_REPORT_YEAR = 1982;

export type ParsedYear = { ok: true; year: number } | { ok: false; message: string };

/** `year` 쿼리 파싱. 비어 있으면 KST 기준 올해. */
export function parseReportYear(raw: string | null | undefined, now: Date = new Date()): ParsedYear {
  const thisYear = currentKstYear(now);
  if (raw === null || raw === undefined || raw === "") return { ok: true, year: thisYear };
  if (!/^\d{4}$/.test(raw)) return { ok: false, message: "year는 YYYY 형식이어야 합니다." };

  const year = Number(raw);
  if (year < MIN_REPORT_YEAR || year > thisYear) {
    return { ok: false, message: `year는 ${MIN_REPORT_YEAR}~${thisYear} 사이여야 합니다.` };
  }
  return { ok: true, year };
}
