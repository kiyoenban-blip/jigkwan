import { cookies } from "next/headers";
import { prisma } from "@/lib/db";

// 인증 자리표시자: 세션 쿠키에 담긴 사용자 ID를 현재 사용자로 본다.
// 실제 로그인 방식이 붙으면 이 함수만 교체한다.
export const SESSION_COOKIE = "jigkwan_uid";

function demoUserEnabled() {
  return process.env.NODE_ENV !== "production" || process.env.DEMO_USER === "1";
}

export async function getCurrentUserId(): Promise<string | null> {
  const store = await cookies();
  const fromCookie = store.get(SESSION_COOKIE)?.value;
  if (fromCookie) return fromCookie;

  if (demoUserEnabled()) {
    const demo = await prisma.user.findFirst({
      orderBy: { createdAt: "asc" },
      select: { id: true },
    });
    return demo?.id ?? null;
  }
  return null;
}
