import type { TeamCode } from "@/generated/prisma/enums";

// 구단 로고·엠블럼은 사용하지 않고, 팀명 텍스트와 대표 색상만 사용한다.
export const TEAMS: Record<TeamCode, { name: string; color: string }> = {
  LG: { name: "LG 트윈스", color: "#C30452" },
  KT: { name: "KT 위즈", color: "#000000" },
  SSG: { name: "SSG 랜더스", color: "#CE0E2D" },
  NC: { name: "NC 다이노스", color: "#315288" },
  DOOSAN: { name: "두산 베어스", color: "#131230" },
  KIA: { name: "KIA 타이거즈", color: "#EA0029" },
  LOTTE: { name: "롯데 자이언츠", color: "#041E42" },
  SAMSUNG: { name: "삼성 라이온즈", color: "#074CA1" },
  HANWHA: { name: "한화 이글스", color: "#FC4E00" },
  KIWOOM: { name: "키움 히어로즈", color: "#570514" },
};

export const DEFAULT_TEAM_COLOR = "#1F2937";

export function teamName(code: TeamCode | null | undefined): string | null {
  return code ? TEAMS[code].name : null;
}

export function teamColor(code: TeamCode | null | undefined): string {
  return code ? TEAMS[code].color : DEFAULT_TEAM_COLOR;
}
