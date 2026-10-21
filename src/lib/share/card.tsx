import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";
import type { TeamCode } from "@/generated/prisma/enums";
import { formatPercent, formatWon } from "@/lib/format";
import { currentKstYear, toKstParts } from "@/lib/kst";
import type { AnnualReport } from "@/lib/reports/annual";
import { teamColor, teamName } from "@/lib/teams";

// 세로형(9:16) 공유 카드. 구단 로고·엠블럼 없이 팀명 텍스트와 팀 색상만 쓴다.
export const SHARE_CARD_SIZE = { width: 1080, height: 1920 };

const FONT_DIR = path.join(process.cwd(), "node_modules/pretendard/dist/public/static");

let fontsPromise: Promise<{ regular: Buffer; bold: Buffer }> | undefined;

function loadFonts() {
  fontsPromise ??= Promise.all([
    readFile(path.join(FONT_DIR, "Pretendard-Regular.otf")),
    readFile(path.join(FONT_DIR, "Pretendard-ExtraBold.otf")),
  ]).then(([regular, bold]) => ({ regular, bold }));
  return fontsPromise;
}

export function shareCardFileName(year: number) {
  return `jigkwan-report-${year}.png`;
}

export async function renderShareCard(
  report: AnnualReport,
  favoriteTeam: TeamCode | null,
  init?: { headers?: Record<string, string> },
) {
  const { regular, bold } = await loadFonts();
  const { record } = report;
  const now = new Date();
  const today = toKstParts(now);
  const period =
    report.year === currentKstYear(now) ? `${today.year}.${today.month}.${today.day} 기준` : `${report.year} 시즌`;

  const stats = [
    { label: "총 직관", value: `${report.attendanceCount}회` },
    { label: "총 지출", value: formatWon(report.totalExpense) },
    { label: "가장 많이 간 구장", value: report.topStadium ?? "–" },
  ];

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "120px 96px",
          color: "#ffffff",
          fontFamily: "Pretendard",
          backgroundColor: teamColor(favoriteTeam),
          backgroundImage: "linear-gradient(160deg, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.45) 100%)",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 44, opacity: 0.85 }}>{`${report.year} 올해의 직관 리포트`}</div>
          <div style={{ fontSize: 88, fontWeight: 800, marginTop: 16, letterSpacing: -2 }}>
            {teamName(favoriteTeam) ?? "나의 직관"}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 44, opacity: 0.85 }}>직관 승률</div>
          <div style={{ fontSize: 240, fontWeight: 800, lineHeight: 1.05, letterSpacing: -8 }}>
            {record.winRate === null ? "–" : formatPercent(record.winRate)}
          </div>
          <div style={{ fontSize: 48, opacity: 0.9, marginTop: 8 }}>
            {`${record.wins}승 ${record.losses}패 ${record.draws}무`}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          {stats.map((stat) => (
            <div
              key={stat.label}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "36px 0",
                borderTop: "2px solid rgba(255,255,255,0.35)",
              }}
            >
              <div style={{ fontSize: 44, opacity: 0.85 }}>{stat.label}</div>
              <div style={{ maxWidth: 600, marginLeft: 32, fontSize: 60, fontWeight: 800, textAlign: "right" }}>
                {stat.value}
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 36, opacity: 0.8 }}>
          <div>직관 가계부</div>
          <div>{period}</div>
        </div>
      </div>
    ),
    {
      ...SHARE_CARD_SIZE,
      fonts: [
        { name: "Pretendard", data: regular, weight: 400, style: "normal" },
        { name: "Pretendard", data: bold, weight: 800, style: "normal" },
      ],
      headers: init?.headers,
    },
  );
}
