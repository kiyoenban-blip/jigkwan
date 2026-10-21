// Asia/Seoul(UTC+9, 서머타임 없음) 기준 날짜 계산
const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

export type KstDateParts = { year: number; month: number; day: number };

/** UTC 시각을 KST 기준 연/월(1~12)/일로 변환 */
export function toKstParts(date: Date): KstDateParts {
  const shifted = new Date(date.getTime() + KST_OFFSET_MS);
  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth() + 1,
    day: shifted.getUTCDate(),
  };
}

/** KST 기준 해당 연도의 [시작, 끝) 구간을 UTC Date로 반환 */
export function kstYearRange(year: number): { start: Date; end: Date } {
  return {
    start: new Date(Date.UTC(year, 0, 1) - KST_OFFSET_MS),
    end: new Date(Date.UTC(year + 1, 0, 1) - KST_OFFSET_MS),
  };
}

/** KST 기준 현재 연도 */
export function currentKstYear(now: Date = new Date()): number {
  return toKstParts(now).year;
}

/** KST 벽시계 시각으로 UTC Date 생성 (시드·테스트용) */
export function kstDate(year: number, month: number, day: number, hour = 0, minute = 0): Date {
  return new Date(Date.UTC(year, month - 1, day, hour, minute) - KST_OFFSET_MS);
}
