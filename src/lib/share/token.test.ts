import { afterEach, describe, expect, it, vi } from "vitest";
import { createShareToken, verifyShareToken } from "@/lib/share/token";

describe("share token", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("서명한 토큰은 사용자와 연도로 복원된다", () => {
    vi.stubEnv("SHARE_SECRET", "test-secret");
    const token = createShareToken("cmuser123", 2026);

    expect(token).not.toContain("cmuser123");
    expect(verifyShareToken(token)).toEqual({ userId: "cmuser123", year: 2026 });
  });

  it("변조되거나 다른 비밀값으로 만든 토큰은 거부한다", () => {
    vi.stubEnv("SHARE_SECRET", "test-secret");
    const token = createShareToken("cmuser123", 2026);
    const [, signature] = token.split(".");
    const forged = `${Buffer.from("other:2026").toString("base64url")}.${signature}`;

    expect(verifyShareToken(forged)).toBeNull();
    expect(verifyShareToken(`${token}x`)).toBeNull();
    expect(verifyShareToken("garbage")).toBeNull();

    vi.stubEnv("SHARE_SECRET", "another-secret");
    expect(verifyShareToken(token)).toBeNull();
  });

  it("운영 환경에서 비밀값이 없으면 토큰을 만들지 않는다", () => {
    vi.stubEnv("SHARE_SECRET", "");
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("DEMO_USER", "");

    expect(() => createShareToken("cmuser123", 2026)).toThrow("SHARE_SECRET");
  });
});
