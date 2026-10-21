import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { getCurrentUserId } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatWon } from "@/lib/format";
import { currentKstYear, toKstParts } from "@/lib/kst";
import { teamName } from "@/lib/teams";
import styles from "./page.module.css";

export default function Home() {
  return (
    <main className="page">
      <header className={styles.header}>
        <h1 className={styles.title}>직관 가계부</h1>
        <p className="muted">직관 기록과 그날의 지출을 한 곳에</p>
      </header>
      <Suspense fallback={<p className="muted">불러오는 중…</p>}>
        <HomeContent />
      </Suspense>
    </main>
  );
}

async function HomeContent() {
  const userId = await getCurrentUserId();
  if (!userId) return <p className="card">로그인이 필요합니다.</p>;

  await connection(); // 현재 시각 기준(올해)이므로 요청 시점에 렌더링
  const year = currentKstYear();
  const recent = await prisma.attendance.findMany({
    where: { userId },
    include: { game: true, expenses: { select: { amount: true } } },
    orderBy: { game: { startsAt: "desc" } },
    take: 5,
  });

  return (
    <>
      <Link href={`/report?year=${year}`} className={`card ${styles.reportLink}`}>
        <span>
          <strong>{year} 직관 리포트</strong>
          <br />
          <span>올해 지금까지의 기록 보기</span>
        </span>
        <span aria-hidden>→</span>
      </Link>

      <h2 className={styles.sectionTitle}>최근 기록</h2>
      {recent.length === 0 ? (
        <p className="card muted">아직 직관 기록이 없어요.</p>
      ) : (
        <ul className={styles.list}>
          {recent.map((attendance) => {
            const { year: y, month, day } = toKstParts(attendance.game.startsAt);
            const spent = attendance.expenses.reduce((sum, e) => sum + e.amount, 0);
            return (
              <li key={attendance.id} className={`card ${styles.item}`}>
                <span>
                  <strong>
                    {teamName(attendance.game.awayTeam)} @ {teamName(attendance.game.homeTeam)}
                  </strong>
                  <br />
                  <span className={`muted ${styles.itemMeta}`}>
                    {y}.{month}.{day} · {attendance.game.stadium}
                  </span>
                </span>
                <span>{formatWon(spent)}</span>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
