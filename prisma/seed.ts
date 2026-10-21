// 데모 데이터 시드: 기존 데이터를 지우고 데모 사용자 1명과 2025~2026 직관 기록을 넣는다.
import "dotenv/config";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../src/generated/prisma/client";
import type {
  AttendanceResult,
  ExpenseCategory,
  GameStatus,
  TeamCode,
} from "../src/generated/prisma/enums";
import { kstDate } from "../src/lib/kst";

const prisma = new PrismaClient({
  adapter: new PrismaBetterSqlite3({ url: process.env.DATABASE_URL! }),
});

type SeedVisit = {
  date: [number, number, number];
  stadium: string;
  home: TeamCode;
  away: TeamCode;
  score?: [number, number];
  status?: GameStatus;
  result?: AttendanceResult;
  seat?: string;
  companions?: string;
  memo?: string;
  expenses: [ExpenseCategory, number][];
};

const JAMSIL = "잠실야구장";

const visits: SeedVisit[] = [
  // 2025 시즌
  { date: [2025, 4, 12], stadium: JAMSIL, home: "LG", away: "KIA", score: [5, 3], seat: "1루 블루석", expenses: [["TICKET", 22000], ["FOOD", 18000]] },
  { date: [2025, 6, 7], stadium: "고척스카이돔", home: "KIWOOM", away: "LG", score: [4, 2], expenses: [["TICKET", 25000], ["TRANSPORT", 3000]] },
  { date: [2025, 8, 23], stadium: JAMSIL, home: "LG", away: "DOOSAN", score: [7, 1], companions: "친구 2명", expenses: [["TICKET", 22000], ["GOODS", 59000], ["FOOD", 24000]] },

  // 2026 시즌
  { date: [2026, 3, 28], stadium: JAMSIL, home: "LG", away: "KT", score: [6, 2], seat: "1루 레드석", memo: "개막전", expenses: [["TICKET", 30000], ["FOOD", 21000], ["GOODS", 89000]] },
  { date: [2026, 4, 11], stadium: JAMSIL, home: "LG", away: "SAMSUNG", score: [2, 4], expenses: [["TICKET", 22000], ["FOOD", 15000]] },
  { date: [2026, 4, 25], stadium: "사직야구장", home: "LOTTE", away: "LG", score: [3, 8], seat: "3루 원정응원석", companions: "가족", memo: "부산 원정", expenses: [["TICKET", 18000], ["TRANSPORT", 119600], ["FOOD", 32000], ["ETC", 45000]] },
  { date: [2026, 5, 16], stadium: JAMSIL, home: "LG", away: "HANWHA", score: [5, 5], memo: "연장 무승부", expenses: [["TICKET", 22000], ["FOOD", 19000]] },
  { date: [2026, 5, 30], stadium: "인천SSG랜더스필드", home: "SSG", away: "LG", score: [1, 0], expenses: [["TICKET", 20000], ["TRANSPORT", 4800], ["FOOD", 16000]] },
  { date: [2026, 6, 20], stadium: JAMSIL, home: "LG", away: "NC", score: [9, 4], memo: "초대권", expenses: [] },
  { date: [2026, 7, 4], stadium: "수원KT위즈파크", home: "KT", away: "LG", status: "CANCELED", memo: "우천 취소", expenses: [["TRANSPORT", 6400], ["FOOD", 12000]] },
  { date: [2026, 8, 15], stadium: JAMSIL, home: "LG", away: "KIWOOM", score: [4, 3], companions: "회사 동료", expenses: [["TICKET", 26000], ["FOOD", 28000], ["GOODS", 35000]] },
  { date: [2026, 9, 5], stadium: "대전한화생명볼파크", home: "HANWHA", away: "LG", score: [6, 7], expenses: [["TICKET", 24000], ["TRANSPORT", 47000], ["FOOD", 22000]] },
  { date: [2026, 10, 3], stadium: JAMSIL, home: "LG", away: "SSG", score: [3, 1], seat: "중앙 네이비석", memo: "정규시즌 마지막 직관", expenses: [["TICKET", 28000], ["FOOD", 26000]] },
];

async function main() {
  await prisma.expense.deleteMany();
  await prisma.attendance.deleteMany();
  await prisma.game.deleteMany();
  await prisma.user.deleteMany();

  const user = await prisma.user.create({
    data: { name: "데모 사용자", favoriteTeam: "LG" },
  });

  for (const [index, visit] of visits.entries()) {
    const [year, month, day] = visit.date;
    const status = visit.status ?? (visit.score ? "FINAL" : "SCHEDULED");
    const game = await prisma.game.create({
      data: {
        externalId: `seed-${year}${String(month).padStart(2, "0")}${String(day).padStart(2, "0")}-${index}`,
        startsAt: kstDate(year, month, day, 18, 30),
        stadium: visit.stadium,
        homeTeam: visit.home,
        awayTeam: visit.away,
        homeScore: visit.score?.[0] ?? null,
        awayScore: visit.score?.[1] ?? null,
        status,
      },
    });

    await prisma.attendance.create({
      data: {
        userId: user.id,
        gameId: game.id,
        cheerTeam: "LG",
        seat: visit.seat,
        companions: visit.companions,
        result: visit.result,
        memo: visit.memo,
        expenses: {
          create: visit.expenses.map(([category, amount]) => ({ category, amount })),
        },
      },
    });
  }

  console.log(`Seeded user ${user.id} with ${visits.length} attendances`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
