import { describe, expect, it } from "vitest";
import { formatCompactWon, formatPercent, formatWon } from "@/lib/format";

describe("format", () => {
  it("금액", () => {
    expect(formatWon(727800)).toBe("727,800원");
    expect(formatWon(0)).toBe("0원");
  });

  it("짧은 금액", () => {
    expect(formatCompactWon(0)).toBe("0");
    expect(formatCompactWon(5000)).toBe("5천");
    expect(formatCompactWon(50000)).toBe("5만");
    expect(formatCompactWon(150000)).toBe("15만");
    expect(formatCompactWon(15000)).toBe("1.5만");
  });

  it("퍼센트", () => {
    expect(formatPercent(0.75)).toBe("75.0%");
    expect(formatPercent(2 / 3)).toBe("66.7%");
    expect(formatPercent(0)).toBe("0.0%");
  });
});
