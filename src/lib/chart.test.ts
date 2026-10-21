import { describe, expect, it } from "vitest";
import { niceTicks } from "@/lib/chart";

describe("niceTicks", () => {
  it("최댓값을 덮는 1·2·5 간격 눈금을 만든다", () => {
    expect(niceTicks(185800)).toEqual([0, 50000, 100000, 150000, 200000]);
    expect(niceTicks(100000)).toEqual([0, 50000, 100000]);
    expect(niceTicks(37000)).toEqual([0, 10000, 20000, 30000, 40000]);
    expect(niceTicks(7)).toEqual([0, 2, 4, 6, 8]);
  });

  it("값이 없으면 0 하나", () => {
    expect(niceTicks(0)).toEqual([0]);
  });
});
