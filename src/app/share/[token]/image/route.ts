import { fail } from "@/lib/api";
import { getAnnualReport, getFavoriteTeam } from "@/lib/reports/annual-service";
import { renderShareCard } from "@/lib/share/card";
import { verifyShareToken } from "@/lib/share/token";

// GET /share/{token}/image → 공유 링크용 카드 PNG (로그인 불필요, 서명된 토큰으로만 접근)
export async function GET(_request: Request, { params }: RouteContext<"/share/[token]/image">) {
  const { token } = await params;
  const shared = verifyShareToken(token);
  if (!shared) return fail(404, "NOT_FOUND", "공유 링크를 찾을 수 없습니다.");

  const [report, favoriteTeam] = await Promise.all([
    getAnnualReport(shared.userId, shared.year),
    getFavoriteTeam(shared.userId),
  ]);
  return renderShareCard(report, favoriteTeam, {
    headers: { "Cache-Control": "public, max-age=300" },
  });
}
