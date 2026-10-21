import { createHmac, timingSafeEqual } from "node:crypto";

// 공유 링크 토큰: base64url("userId:year") + "." + HMAC-SHA256 서명
// 사용자 ID를 그대로 노출하지 않고, 서명이 없으면 다른 사람의 리포트를 열 수 없다.

const DEV_SECRET = "jigkwan-dev-share-secret";

function secret(): string {
  const value = process.env.SHARE_SECRET;
  if (value) return value;
  if (process.env.NODE_ENV !== "production" || process.env.DEMO_USER === "1") return DEV_SECRET;
  throw new Error("SHARE_SECRET is not set");
}

function sign(payload: string): string {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

export function createShareToken(userId: string, year: number): string {
  const payload = Buffer.from(`${userId}:${year}`).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function verifyShareToken(token: string): { userId: string; year: number } | null {
  const [payload, signature, ...rest] = token.split(".");
  if (!payload || !signature || rest.length > 0) return null;

  const expected = Buffer.from(sign(payload));
  const actual = Buffer.from(signature);
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null;

  const match = /^(.+):(\d{4})$/.exec(Buffer.from(payload, "base64url").toString());
  if (!match) return null;
  return { userId: match[1], year: Number(match[2]) };
}
