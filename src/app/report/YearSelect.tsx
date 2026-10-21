"use client";

import { useRouter } from "next/navigation";

export function YearSelect({ year, years }: { year: number; years: number[] }) {
  const router = useRouter();
  return (
    <label className="yearSelect">
      <span className="sr-only">연도 선택</span>
      <select
        value={year}
        onChange={(event) => router.push(`/report?year=${event.target.value}`)}
      >
        {years.map((y) => (
          <option key={y} value={y}>
            {y}년
          </option>
        ))}
      </select>
    </label>
  );
}
