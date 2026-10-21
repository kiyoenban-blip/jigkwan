# 직관 가계부

KBO 경기를 직접 보러 간 기록(직관)과 그날의 지출을 함께 남기는 가계부 앱.

- Next.js (App Router) + TypeScript
- Prisma 7 + SQLite (`@prisma/adapter-better-sqlite3`)
- 금액은 모두 `Int`(원 단위), 날짜 판단은 Asia/Seoul 기준 (`src/lib/kst.ts`)

## 시작하기

```bash
cp .env.example .env
npm install          # postinstall 에서 prisma generate 실행
npm run db:migrate   # 마이그레이션 적용 (dev.db 생성)
npm run db:seed      # 데모 사용자와 2025~2026 직관 기록
npm run dev
```

## 스크립트

| 명령 | 내용 |
| --- | --- |
| `npm run lint` | ESLint |
| `npm run typecheck` | 라우트 타입 생성 후 `tsc --noEmit` |
| `npm test` | Vitest 단위 테스트 |
| `npm run build` | 프로덕션 빌드 |

## 인증

현재는 자리표시자다(`src/lib/auth.ts`). `jigkwan_uid` 쿠키의 사용자 ID를 현재 사용자로 보고,
쿠키가 없으면 개발 환경(또는 `DEMO_USER=1`)에서 가장 먼저 만들어진 사용자를 사용한다.

## API 응답 형식

성공 시 `{ "data": ... }`, 실패 시 `{ "error": { "code": "...", "message": "..." } }`.
