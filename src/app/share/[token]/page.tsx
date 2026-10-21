import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { SHARE_CARD_SIZE } from "@/lib/share/card";
import { verifyShareToken } from "@/lib/share/token";
import styles from "./share.module.css";

export async function generateMetadata({ params }: PageProps<"/share/[token]">): Promise<Metadata> {
  const { token } = await params;
  const shared = verifyShareToken(token);
  if (!shared) return { title: "직관 가계부" };

  const title = `${shared.year} 올해의 직관 리포트`;
  return {
    title,
    description: "직관 횟수, 승률, 지출을 한 장으로 정리했어요.",
    openGraph: {
      title,
      images: [{ url: `/share/${token}/image`, ...SHARE_CARD_SIZE }],
    },
  };
}

export default function SharePage({ params }: PageProps<"/share/[token]">) {
  return (
    <main className={`page ${styles.page}`}>
      <Suspense fallback={<div className={styles.placeholder} />}>
        <SharedCard params={params} />
      </Suspense>
      <Link href="/" className={styles.cta}>
        나도 직관 기록하기
      </Link>
    </main>
  );
}

async function SharedCard({ params }: Pick<PageProps<"/share/[token]">, "params">) {
  const { token } = await params;
  const shared = verifyShareToken(token);
  if (!shared) notFound();

  return (
    // 서버에서 만든 PNG를 그대로 보여준다 (next/image 최적화 불필요)
    // eslint-disable-next-line @next/next/no-img-element
    <img
      className={styles.card}
      src={`/share/${token}/image`}
      alt={`${shared.year} 올해의 직관 리포트 카드`}
      {...SHARE_CARD_SIZE}
    />
  );
}
