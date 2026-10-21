const wonFormatter = new Intl.NumberFormat("ko-KR");

/** 원 단위 정수 금액 표시: 12345 → "12,345원" */
export function formatWon(amount: number): string {
  return `${wonFormatter.format(amount)}원`;
}

/** 0~1 비율을 소수점 첫째 자리 퍼센트로: 0.6667 → "66.7%" */
export function formatPercent(ratio: number): string {
  return `${(Math.round(ratio * 1000) / 10).toFixed(1)}%`;
}
