import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { getCurrentUserId } from "@/lib/auth";
import { formatPercent, formatWon } from "@/lib/format";
import { currentKstYear, toKstParts } from "@/lib/kst";
import { EXPENSE_CATEGORY_LABELS, parseReportYear, type AnnualReport } from "@/lib/reports/annual";
import { getAnnualReport, getFavoriteTeam, getReportYears } from "@/lib/reports/annual-service";
import { shareCardFileName, SHARE_CARD_SIZE } from "@/lib/share/card";
import { createShareToken } from "@/lib/share/token";
import { teamColor, teamName } from "@/lib/teams";
import { BarList } from "./BarList";
import { MonthlyChart } from "./MonthlyChart";
import { ShareButtons } from "./ShareButtons";
import { YearSelect } from "./YearSelect";
import styles from "./report.module.css";

export const metadata: Metadata = {
  title: "직관 리포트 · 직관 가계부",
};

export default function ReportPage({ searchParams }: PageProps<"/report">) {
  return (
    <main className="page">
      <nav>
        <Link href="/" className={styles.back}>
          ← 홈
        </Link>
      </nav>
      <Suspense fallback={<ReportSkeleton />}>
        <ReportContent searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function ReportContent({ searchParams }: Pick<PageProps<"/report">, "searchParams">) {
  const { year: rawYear } = await searchParams;
  const userId = await getCurrentUserId();
  if (!userId) return <p className="card">로그인이 필요합니다.</p>;

  await connection(); // 연도 기본값·"올해 지금까지"는 요청 시점 기준
  const parsed = parseReportYear(typeof rawYear === "string" ? rawYear : null);
  if (!parsed.ok) {
    return (
      <div className={`card ${styles.empty}`}>
        <p>{parsed.message}</p>
        <Link href="/report" className={styles.primaryButton}>
          올해 리포트 보기
        </Link>
      </div>
    );
  }

  const year = parsed.year;
  const [report, recordedYears, favoriteTeam] = await Promise.all([
    getAnnualReport(userId, year),
    getReportYears(userId),
    getFavoriteTeam(userId),
  ]);

  const now = new Date();
  const thisYear = currentKstYear(now);
  const yearOptions = [...new Set([thisYear, year, ...recordedYears])].sort((a, b) => b - a);
  const today = toKstParts(now);
  const period = year === thisYear ? `올해 지금까지 · ${today.month}월 ${today.day}일 기준` : `${year} 시즌 전체`;

  return (
    <>
      <header className={styles.header} style={{ backgroundColor: teamColor(favoriteTeam) }}>
        <div className={styles.headerRow}>
          <h1 className={styles.title}>{year} 직관 리포트</h1>
          <YearSelect year={year} years={yearOptions} />
        </div>
        <p className={styles.headerMeta}>
          {teamName(favoriteTeam) ?? "응원팀 미설정"} · {period}
        </p>
      </header>

      {report.attendanceCount === 0 ? (
        <EmptyReport year={year} otherYears={recordedYears.filter((y) => y !== year)} />
      ) : (
        <ReportBody report={report} sharePath={`/share/${createShareToken(userId, year)}`} />
      )}
    </>
  );
}

function ReportBody({ report, sharePath }: { report: AnnualReport; sharePath: string }) {
  const { record } = report;
  const categories = [...report.categories].sort((a, b) => b.amount - a.amount);

  return (
    <>
      <section className={`card ${styles.hero}`} aria-labelledby="win-rate-title">
        <h2 id="win-rate-title" className={styles.cardTitle}>
          직관 승률
        </h2>
        <p className={styles.heroValue}>{record.winRate === null ? "–" : formatPercent(record.winRate)}</p>
        <p className="muted">
          {record.wins}승 {record.losses}패 {record.draws}무
          {record.undecided > 0 && ` · 취소/미정 ${record.undecided}경기`}
        </p>
        {record.winRate === null && <p className="muted">아직 승패가 결정된 경기가 없어요.</p>}
      </section>

      <section className={styles.tiles} aria-label="요약">
        <Tile label="총 직관" value={`${report.attendanceCount}회`} />
        <Tile label="총 지출" value={formatWon(report.totalExpense)} />
        <Tile label="1회 평균 지출" value={formatWon(report.averageExpense)} />
        <Tile label="가장 많이 간 구장" value={report.topStadium ?? "–"} />
      </section>

      <section className="card" aria-labelledby="monthly-title">
        <h2 id="monthly-title" className={styles.cardTitle}>
          월별 지출
        </h2>
        <MonthlyChart monthly={report.monthly} />
      </section>

      <section className="card" aria-labelledby="category-title">
        <h2 id="category-title" className={styles.cardTitle}>
          카테고리별 지출
        </h2>
        {report.totalExpense === 0 ? (
          <p className="muted">기록된 지출이 없어요.</p>
        ) : (
          <BarList
            label="카테고리별 지출"
            items={categories.map((c) => ({
              key: c.category,
              label: EXPENSE_CATEGORY_LABELS[c.category],
              value: c.amount,
              display: `${formatWon(c.amount)} · ${formatPercent(c.ratio)}`,
            }))}
          />
        )}
      </section>

      <section className="card" aria-labelledby="stadium-title">
        <h2 id="stadium-title" className={styles.cardTitle}>
          구장별 방문
        </h2>
        <BarList
          label="구장별 방문 횟수"
          items={report.stadiums.map((s) => ({
            key: s.stadium,
            label: s.stadium,
            value: s.count,
            display: `${s.count}회`,
          }))}
        />
      </section>

      <section className="card" aria-labelledby="share-title">
        <h2 id="share-title" className={styles.cardTitle}>
          리포트 공유하기
        </h2>
        {/* eslint-disable-next-line @next/next/no-img-element -- 서버에서 만든 PNG 미리보기 */}
        <img
          className={styles.sharePreview}
          src={`/api/reports/annual/card?year=${report.year}`}
          alt={`${report.year} 직관 리포트 공유 카드 미리보기`}
          width={SHARE_CARD_SIZE.width}
          height={SHARE_CARD_SIZE.height}
          loading="lazy"
        />
        <ShareButtons
          imageUrl={`/api/reports/annual/card?year=${report.year}`}
          fileName={shareCardFileName(report.year)}
          sharePath={sharePath}
        />
      </section>
    </>
  );
}

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <div className={`card ${styles.tile}`}>
      <p className={styles.tileLabel}>{label}</p>
      <p className={styles.tileValue}>{value}</p>
    </div>
  );
}

function EmptyReport({ year, otherYears }: { year: number; otherYears: number[] }) {
  return (
    <section className={`card ${styles.empty}`}>
      <p className={styles.emptyTitle}>{year}년에는 아직 직관 기록이 없어요</p>
      <p className="muted">경기를 보러 간 날 기록을 남기면 이곳에 리포트가 만들어져요.</p>
      <Link href="/" className={styles.primaryButton}>
        홈으로
      </Link>
      {otherYears.length > 0 && (
        <div className={styles.otherYears}>
          <p className="muted">기록이 있는 연도</p>
          <div className={styles.chips}>
            {otherYears.map((y) => (
              <Link key={y} href={`/report?year=${y}`} className={styles.chip}>
                {y}년
              </Link>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

function ReportSkeleton() {
  return (
    <div className={styles.skeleton} aria-busy="true" aria-label="리포트 불러오는 중">
      <div />
      <div />
      <div />
    </div>
  );
}
