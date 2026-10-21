const wonFormatter = new Intl.NumberFormat("ko-KR");

/** 원 단위 정수 금액 표시: 12345 → "12,345원" */
export function formatWon(amount: number): string {
  return `${wonFormatter.format(amount)}원`;
}

/** 0~1 비율을 소수점 첫째 자리 퍼센트로: 0.6667 → "66.7%" */
export function formatPercent(ratio: number): string {
  return `${(Math.round(ratio * 1000) / 10).toFixed(1)}%`;
}

/** 축 눈금용 짧은 금액: 0 / 5천 / 1만 / 15만 / 120만 */
export function formatCompactWon(amount: number): string {
  if (amount === 0) return "0";
  if (amount >= 10000) {
    const man = amount / 10000;
    return `${Number.isInteger(man) ? man : man.toFixed(1)}만`;
  }
  if (amount >= 1000) return `${Math.round(amount / 1000)}천`;
  return String(amount);
}
