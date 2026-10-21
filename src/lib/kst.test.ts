import { describe, expect, it } from "vitest";
import { currentKstYear, kstDate, kstYearRange, toKstParts } from "@/lib/kst";

describe("kst", () => {
  it("UTC 시각을 KST 날짜로 변환한다", () => {
    expect(toKstParts(new Date("2025-12-31T14:59:59Z"))).toEqual({ year: 2025, month: 12, day: 31 });
    expect(toKstParts(new Date("2025-12-31T15:00:00Z"))).toEqual({ year: 2026, month: 1, day: 1 });
  });

  it("KST 연도 구간은 전년도 12/31 15:00Z부터 시작한다", () => {
    const { start, end } = kstYearRange(2026);
    expect(start.toISOString()).toBe("2025-12-31T15:00:00.000Z");
    expect(end.toISOString()).toBe("2026-12-31T15:00:00.000Z");
  });

  it("kstDate는 KST 벽시계 시각을 만든다", () => {
    expect(kstDate(2026, 1, 1).toISOString()).toBe("2025-12-31T15:00:00.000Z");
    expect(currentKstYear(new Date("2026-12-31T15:00:00Z"))).toBe(2027);
  });
});
