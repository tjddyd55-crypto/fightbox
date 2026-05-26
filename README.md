# FightBox

체육관용 운동 프로그램 빌더를 포함한 npm workspaces 모노레포입니다.

```
fightbox/
  apps/
    web/          # Vite + React 프론트엔드
    api/          # Express API (health 서버, 추후 presign 등)
  packages/
    shared/       # 공통 타입·상수 (추후 확장)
```

## 실행 방법

```bash
npm install
npm run dev:web
```

브라우저에서 `http://localhost:5173/login` 으로 접속한 뒤 개발용 계정으로 로그인합니다. 로그인 후 `/dashboard` 로 이동합니다.

API health 확인:

```bash
npm run dev:api
# http://localhost:3000/health
```

## 개발 명령어

| 명령 | 설명 |
|------|------|
| `npm run dev` / `npm run dev:web` | 프론트 개발 서버 |
| `npm run dev:api` | API 개발 서버 |
| `npm run typecheck` | 전체 TypeScript 검사 |
| `npm run lint` | ESLint |
| `npm run build` | shared → web → api 빌드 |
| `npm run build:web` | 프론트만 빌드 |
| `npm run build:api` | API만 빌드 |
| `npm run start:web` | 프론트 preview (Railway 배포용) |
| `npm run start:api` | API 프로덕션 실행 |

## Railway 배포

### 프론트 (web) — app 서비스

| 항목 | 값 |
|------|-----|
| Build Command | `npm run build:web` |
| Start Command | `npm run start:web` |

**환경변수 (VITE_ 만 설정 — R2 시크릿 금지)**

| 변수 | 설명 |
|------|------|
| `VITE_AUTH_PROVIDER` | `api` (기본) 또는 `demo` — JWT login API / 클라이언트 demo fallback |
| `VITE_VIDEO_UPLOAD_PROVIDER` | `mock` (기본) 또는 `api` |
| `VITE_API_BASE_URL` | API 서비스 public URL (예: `https://<api-domain>`) |
| `VITE_WORKOUT_BUILDER_STORAGE` | `local` (기본) 또는 `api` — 템플릿/업로드 영상 메타데이터 저장소 |
| `VITE_ENABLE_PROGRAM_PLAYER_DEMO` | `false` (기본) — `true`일 때만 `/program-player-demo` mock route 허용 |
| `VITE_ENABLE_WORKOUT_BUILDER_MOCK_DATA` | `false` (기본) — `true`일 때만 local mode에서 mock 영상/템플릿 catalog 표시 |
| `VITE_FIGHTBOX_GYM_ID` | (선택) 로그인 세션 없을 때만 fallback gym scope |
| `VITE_FIGHTBOX_USER_ID` | (선택) 로그인 세션 없을 때만 fallback user id |
| `VITE_FIGHTBOX_USER_ROLE` | (선택) 로그인 세션 없을 때만 fallback role |
| `VITE_FIGHTBOX_STAFF_PERMISSIONS` | (선택) `gym_staff` fallback granular JSON |

API presign이 정상 확인된 후 `VITE_VIDEO_UPLOAD_PROVIDER=api`와 `VITE_API_BASE_URL`을 설정하세요.
Workout builder DB CRUD가 준비되면 `VITE_WORKOUT_BUILDER_STORAGE=api`로 전환합니다. 기본값 `local`은 localStorage fallback을 유지합니다.

**실제 데이터 테스트 권장 env (web)**

| 변수 | 권장값 |
|------|--------|
| `VITE_WORKOUT_BUILDER_STORAGE` | `api` |
| `VITE_VIDEO_UPLOAD_PROVIDER` | `api` |
| `VITE_AUTH_PROVIDER` | `api` |
| `VITE_ENABLE_PROGRAM_PLAYER_DEMO` | `false` |
| `VITE_ENABLE_WORKOUT_BUILDER_MOCK_DATA` | `false` |

### API — api 서비스

| 항목 | 값 |
|------|-----|
| Build Command | `npm run build:api` |
| Start Command | `npm run start:api` |

**환경변수**

| 변수 | 설명 |
|------|------|
| `PORT` | Railway가 주입 (예: `3000`) |
| `FRONTEND_ORIGIN` | web app origin (CORS, 예: `https://app-production-6692.up.railway.app`) |
| `FRONTEND_PUBLIC_URL` | publish API `shareUrl` 생성용 web public URL (미설정 시 요청 `Origin` fallback) |
| `JWT_SECRET` | JWT 서명 시크릿 (API 서비스에만, 커밋 금지). production에서 미설정 시 기동 실패 |
| `JWT_EXPIRES_IN` | 액세스 토큰 만료 (예: `12h`). 기본 `12h` |
| `JWT_EXPIRES_IN_SEC` | (레거시) 초 단위 만료. `JWT_EXPIRES_IN` 미설정 시 `43200`(12h) |
| `PAYMENT_PROVIDER` | `manual` (기본) — 결제 provider. 2차: `portone` / `stripe` |
| `FRONTEND_PUBLIC_URL` | 결제 checkout return URL (web public URL, `FRONTEND_ORIGIN` fallback) |
| `AUTH_PROVIDER` | `db` (기본) — Bearer JWT 우선. `header`는 헤더 fallback 전용 실험용 |
| `ENABLE_R2_DIAGNOSTICS` | `true`일 때만 R2 CORS 진단 endpoint 활성화 |
| `R2_ACCOUNT_ID` | Cloudflare account ID |
| `R2_ACCESS_KEY_ID` | R2 access key |
| `R2_SECRET_ACCESS_KEY` | R2 secret (API 서비스에만) |
| `R2_BUCKET_NAME` / `R2_BUCKET` | 버킷명 (`fightbox`) |
| `R2_ENDPOINT` | S3 API endpoint (버킷명 미포함) |
| `R2_PRESIGN_URL_STYLE` | `path` (기본) 또는 `virtual` — presign URL 스타일 비교 테스트용 |
| `R2_PUBLIC_URL` / `R2_PUBLIC_CDN_BASE` | 선택 — Public/Custom URL (없으면 `playbackUrl`은 `""`) |
| `DATABASE_URL` | Railway Postgres 연결 문자열 (workout builder CRUD용) |

**엔드포인트**

- `GET /health` — 서비스 상태
- `POST /api/auth/login` — DB users + bcrypt 로그인, JWT 발급
- `GET /api/auth/me` — Bearer JWT로 현재 사용자(직원 권한 포함) 조회
- `POST /api/workout-videos/uploads/presign` — R2 presigned PUT URL 발급
- `GET /api/workout-videos/uploads/diagnostics/r2-cors` — `ENABLE_R2_DIAGNOSTICS=true`일 때 R2 OPTIONS preflight 진단
- `GET/POST/PATCH/DELETE /api/workout-builder/videos` — 업로드 영상 메타데이터 CRUD
- `GET/POST/PATCH/DELETE /api/workout-builder/templates` — 프로그램 템플릿 CRUD
- `GET /api/gym/staff-permissions` — 체육관 직원 권한 목록 (`gym_admin` / `super_admin`)
- `PATCH /api/gym/staff-permissions/:userId` — 직원 권한 수정
- `GET /api/gym/staff-permissions/me` — 현재 사용자 직원 권한 조회 (`gym_staff` hydrate용)
- `GET/POST/PATCH/DELETE /api/admin/gyms` — 체육관 테넌트 코드 관리 (`super_admin` + `manageGyms`)
- `GET/POST/PATCH/DELETE /api/admin/users` — 사용자 관리 (`super_admin` / `gym_admin` + `manageUsers`)
- `GET /api/admin/auth-audit-logs` — 로그인 감사 로그 조회 (`super_admin` + `viewAuthAuditLogs`)

**DB 마이그레이션**

```bash
npm run db:migrate:api
```

Railway api 서비스에서 Postgres 연결 후:

```bash
railway service link api
railway run npm run db:migrate:api
```

또는 배포 후 one-off:

```bash
npm run db:migrate:prod -w @fightbox/api
```

`postgres.railway.internal` DNS 오류 시 Railway Postgres 서비스의 **public** 연결 URL을 로컬 `DATABASE_URL`에만 임시 지정한 뒤 `npm run db:migrate:api`를 실행하세요. DB URL·비밀번호는 커밋·로그·PR 본문에 넣지 마세요.

### main merge 후 배포·migration 체크리스트

1. **Railway 배포 확인** — `api` / `app` 서비스 redeploy **SUCCESS**
2. **migration 포함 PR인지 확인** — `apps/api/src/db/migrations/*.sql` 변경이 있으면 **반드시** `npm run db:migrate:api` 실행
3. **migration 적용 확인** — `schema_migrations`에 새 파일 id 기록, 기존 `users` / `gym_staff_permissions` 데이터 유지
4. **공통 smoke** — `GET /health` 200
5. **인증 migration 후** — `POST /api/auth/login`, `GET /api/auth/me` (Bearer)
6. **사용자 관리 migration 후** — `GET /api/admin/users` (super_admin / gym_admin Bearer)
7. **직원 권한 migration 후** — `GET /api/gym/staff-permissions`, `GET /api/gym/staff-permissions/me` (`gym_staff`)

migration 자동 실행은 아직 CI/Railway hook에 연결되어 있지 않습니다. 배포 후 수동 실행을 기본 절차로 둡니다.

루트 `npm run build` / `npm run start` 도 web 기준으로 동작합니다.

## 주요 라우트

프론트 라우트는 `apps/web/src/main.tsx`를 참고하세요.

| 경로 | 설명 |
|------|------|
| `/dashboard` | 로그인 후 기본 진입점 — 역할별 대시보드 |
| `/dashboard/program-schedule` | 주간 프로그램 스케줄 편성 |
| `/workout-program-builder` | 운동 프로그램 빌더 (대시보드 메뉴에서 진입) |
| `/programs/:templateId/play` | 저장된 템플릿 프로그램 실행 (로그인 필요) |
| `/share/programs/:shareToken` | 공유 링크 공개 페이지 (로그인 불필요) |
| `/login` | 로그인 |

### 역할별 대시보드 (`/dashboard`)

로그인 성공 시 역할에 맞는 대시보드가 표시됩니다. 기존 기능 URL(`/workout-program-builder`, 플레이어, 공유 링크)은 그대로 유지됩니다.

| 역할 | 대시보드 | 주요 메뉴 |
|------|----------|-----------|
| `super_admin` | FIGHTBOX 관리자 대시보드 | 사용자 관리, 프로그램 빌더, 공용 승인, 감사 로그, 직원 권한, **결제/크레딧**, **주간 스케줄** |
| `gym_admin` | 체육관관리자 대시보드 | 프로그램 빌더, 영상·템플릿, 직원 권한, 사용자 관리, **크레딧 충전**, **주간 스케줄** |
| `gym_staff` | 체육관직원 대시보드 | `staffPermissions`에 따라 영상 업로드·빌더·공용 신청·**주간 스케줄** 등 |
| `video_creator` | 크리에이터 대시보드 | 영상 등록, 템플릿 세팅, 프로그램 실행 확인 |

- 관리자 모달(사용자 관리·직원 권한·감사 로그)은 대시보드에서 직접 열 수 있습니다.
- 빌더 진입 시 query param 지원(선택): `?panel=videos`, `?modal=templates`, `?tab=pending`
- 추후 관리자 기능을 `/dashboard` 하위 전용 페이지로 분리할 예정입니다.

### 결제/크레딧 1차 (`/dashboard/billing`)

체육관(`gym_id`) 단위 **크레딧 지갑** + **원장(ledger)** 기반 충전/수동조정 MVP입니다.

| 경로 | 설명 |
|------|------|
| `/dashboard/billing` | 크레딧 잔액·충전·**정액제 구독**·결제 내역·원장 (gym_admin / super_admin) |

**DB 테이블**

| 테이블 | 역할 |
|--------|------|
| `credit_wallets` | gym별 잔액·누적 통계 |
| `credit_ledger_entries` | 모든 증감 원장 (삭제 없음, `idempotency_key` unique) |
| `payment_products` | **credit_pack** + **subscription_plan** 상품 catalog |
| `payment_orders` | 결제 주문 (`credit_purchase` / `subscription_start` 등) |
| `billing_subscriptions` | gym별 구독 상태·기간·취소 예정 |
| `payment_webhook_events` | PG webhook 이벤트 저장 (2차 연동용) |

**상품 유형**

| `product_type` | 설명 |
|----------------|------|
| `credit_pack` | 100 / 500 / 1000 크레딧 1회성 충전 (`purchase` ledger) |
| `subscription_plan` | 월정액·연간정액 (`monthly_basic`, `yearly_basic`, `monthly_pro`, `yearly_pro`) |

**정액제 구독 (manual activation 1차)**

| 항목 | 정책 |
|------|------|
| 생성 | `POST /api/billing/subscriptions` → `pending` subscription + `subscription_start` order |
| 활성화 | `POST .../manual-complete` → `active`, 기존 active 구독 `cancelled` 처리 |
| 포함 크레딧 | `includedCreditsPerPeriod` → wallet **grant** (`source_type=subscription`) |
| idempotency | `subscription:{subscriptionId}:initial-grant` |
| 취소 | `POST .../cancel` → `cancel_at_period_end=true` (현재 기간까지 active 유지) |
| 자동 갱신 | **미구현** (2차 PG 정기결제) |

**API**

| Method | Path | 설명 |
|--------|------|------|
| GET | `/api/billing/summary` | wallet + activeSubscription |
| GET | `/api/billing/subscriptions` | gym 구독 목록 |
| GET | `/api/billing/subscriptions/active` | 활성 구독 |
| POST | `/api/billing/subscriptions` | 구독 시작 (pending) |
| POST | `/api/billing/subscriptions/:id/manual-complete` | manual 활성화 |
| POST | `/api/billing/subscriptions/:id/cancel` | 기간 종료 시 취소 예약 |

Migration: `013_billing_subscriptions.sql`

**원칙**

- `credit_wallets.balance`는 ledger entry와 **트랜잭션으로 함께** 갱신합니다.
- 카드번호·결제 민감정보는 **저장하지 않습니다**. PG 결제창/외부 URL 이동 구조를 전제로 합니다.

**크레딧 사용 차감 1차 (프로그램 게시)**

| 항목 | 정책 |
|------|------|
| 과금 시점 | 프로그램 템플릿 **최초 게시** (`published_at`이 null → publish) |
| 비용 | `CREDIT_USAGE_COSTS.programPublish` = **1 credit** |
| idempotency | `program_publish:{templateId}:first_publish` |
| 재게시 | `published_at`이 이미 있으면 **추가 차감 없음** (게시 취소 후 재게시 포함) |
| super_admin | MVP에서 **차감 면제** |
| 차감 대상 | `gym_admin`, `gym_staff`, `video_creator` |
| ledger | `entry_type=spend`, `amount=-1`, `source_type=program_publish` |
| 잔액 부족 | `402 INSUFFICIENT_CREDITS` — `/dashboard/billing`에서 충전 |

publish API는 **크레딧 차감과 share 활성화를 단일 DB 트랜잭션**으로 처리합니다.

**Payment provider**

| 변수 | 설명 |
|------|------|
| `PAYMENT_PROVIDER` | `manual` (기본) — 테스트용 수동 결제 완료 흐름 |
| `FRONTEND_PUBLIC_URL` | checkout return URL 생성 (미설정 시 `FRONTEND_ORIGIN` fallback) |

`manual` provider: 주문 생성 → `/dashboard/billing`에서 「수동 결제 완료」→ wallet 충전 + ledger `purchase` entry.

**2차 예정 (미구현)**

- PortOne billing key / Stripe Subscription
- webhook signature 검증, renewal payment, failed payment (`past_due`)
- 영수증/세금계산서, invoice/receipt
- 자동 갱신 시 `subscription_renewal` order + grant
- 업로드·AI·회원배정별 크레딧 차감 정책
- 상품별/플랜별 publish 비용, 환불(credit restore)

**API env (선택, 2차 PG용 — 코드/커밋에 secret 금지)**

| 변수 | 설명 |
|------|------|
| `PORTONE_STORE_ID` | PortOne store id |
| `PORTONE_CHANNEL_KEY` | PortOne channel key |
| `PORTONE_API_SECRET` | PortOne API secret (API 서비스만) |
| `STRIPE_SECRET_KEY` | Stripe secret (API 서비스만) |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook secret |

Migration: `011_billing_credits.sql`, `013_billing_subscriptions.sql` — `npm run db:migrate:api`

### 주간 프로그램 스케줄 (`/dashboard/program-schedule`)

체육관 운영자가 저장된 **운동 프로그램 템플릿**을 요일·시간에 배치하는 **매주 반복 기본 시간표** MVP입니다.

| 항목 | 설명 |
|------|------|
| 경로 | `/dashboard/program-schedule` |
| 표시 | 일요일~토요일 7일 grid, 06:00~23:00, 30분 단위 |
| 연동 | `program_templates` + `/programs/:templateId/play` 실행 |
| 권한 | 조회: super_admin / gym_admin / gym_staff · 편집: admin 또는 템플릿 권한 있는 staff |

- PC/대형 모니터 우선 레이아웃, 모바일은 horizontal scroll fallback
- 같은 요일·시간 다중 수업 허용, **roomName**이 겹치면 409 `SCHEDULE_CONFLICT`
- Migration: `012_program_weekly_schedules.sql`

**향후 예정:** 특정 날짜 예외, 휴무일, 코치/룸 필터, CRM·출석·결제 연동

## Workout Program Builder

관리자(코치)가 영상·휴식·카운트다운·음성 블록으로 타임라인을 구성하고, 로컬에 템플릿을 저장·불러오기·테스트 재생할 수 있는 MVP입니다.

### UI

- **PC (≥1200px):** 좌측 영상 라이브러리 · 중앙 타임라인 · 우측 선택 블록 미리보기/설정 (3컬럼)
- **태블릿·모바일 (≤1199px):** 영상 / 타임라인 / 설정 탭 전환, 하단 액션 바

### 데이터

- 영상·초기 템플릿: 더미 데이터 (`mockWorkoutVideos`, `mockProgramTemplate`)
- 템플릿/업로드 영상 메타데이터: `localStorage` (기본) 또는 API + Postgres (`VITE_WORKOUT_BUILDER_STORAGE=api`)
- `repositories/` 계층이 localStorage fallback과 API sync를 처리합니다

### 기능 요약

- 영상 검색·필터, 라이브러리 미리보기, 타임라인 추가
- 블록 추가/복제/이동/삭제, `selectedBlockId` 동기화
- 재생 설정(반복·휴식·음성 가이드) 및 총 시간 계산
- 템플릿 저장·목록·복사·삭제, 공용 신청(로컬 상태)
- 테스트 재생 시뮬레이션(빠른 모드)
- 저장·테스트 전 유효성 검사

상세 구현 상태는 [dev/workout_program_builder_feature_status.md](dev/workout_program_builder_feature_status.md)를 참고하세요.

### 영상 업로드 (mock / API adapter)

프론트는 `videoUploadService`가 선택한 adapter로 presign → PUT 업로드를 수행합니다. 기본값은 **mock**이며, 백엔드 연동 시 환경변수로 전환합니다.

| 환경변수 | 설명 |
|----------|------|
| `VITE_VIDEO_UPLOAD_PROVIDER` | `mock` (기본) 또는 `api` |
| `VITE_API_BASE_URL` | `api`일 때 API origin. 없으면 상대 경로 `/api/...` 사용 |
| `VITE_WORKOUT_BUILDER_STORAGE` | `local` (기본) 또는 `api` |

`.env.example`을 참고해 Railway app/api 서비스 또는 로컬 `.env.local`에 설정하세요.

### 영상 등록 방식 (R2 업로드 · YouTube 링크)

빌더 **영상 등록** 모달에서 두 가지 방식을 선택할 수 있습니다.

| 방식 | `sourceType` | 설명 |
|------|--------------|------|
| **파일 업로드** | `uploaded` | 기존과 동일 — R2 presign → PUT → `playbackUrl` / `storageKey` |
| **유튜브 링크** | `youtube` | YouTube URL만 저장 · **다운로드/저장 없음** · embed 재생 |

YouTube 등록 시:

- 지원 URL: `watch?v=`, `youtu.be/`, `/embed/`, `/shorts/`
- `externalVideoId`, `embedUrl`, YouTube 썸네일 URL을 DB에 저장
- embed는 `youtube-nocookie.com` + IFrame API (`enablejsapi=1`, `playsinline=1`, `rel=0`, `iv_load_policy=3`, `controls=0`, `disablekb=1`)
- **YouTube 로고·브랜딩을 CSS로 완전히 제거하는 것은 불가**합니다. 앱 타이머·컨트롤 중심으로 최대한 영상에 집중합니다.
- `modestbranding`은 deprecated 정책이라 사용하지 않습니다.
- autoplay·음성·브랜딩 표시는 브라우저·YouTube 정책 영향을 받을 수 있습니다.

삭제 정책:

- `uploaded`: R2 원본·썸네일 객체 삭제 시도 후 DB soft delete
- `youtube`: R2 삭제 없음 · DB soft delete만 (YouTube 원본은 그대로)

#### Workout builder storage API

공통 타입: `packages/shared/src/workoutBuilderContracts.ts`

- `GET /api/workout-builder/videos`
- `POST /api/workout-builder/videos`
- `PATCH /api/workout-builder/videos/:id`
- `DELETE /api/workout-builder/videos/:id`
- `GET /api/workout-builder/templates`
- `GET /api/workout-builder/templates/:id`
- `POST /api/workout-builder/templates`
- `PATCH /api/workout-builder/templates/:id`
- `DELETE /api/workout-builder/templates/:id`
- `POST /api/workout-builder/templates/:id/submit-public` — 공용 라이브러리 신청 (`visibility: public_pending`)
- `POST /api/workout-builder/templates/:id/publish` — 회원용 공유 링크 게시 (`share_enabled=true`, `share_token` 생성)
- `POST /api/workout-builder/templates/:id/unpublish` — 게시 취소 (`share_enabled=false`, 링크 접근 차단)
- `GET /api/public/programs/:shareToken` — **인증 없음** · 게시된 프로그램 읽기 전용 조회
- `GET /api/workout-builder/admin/public-submissions` — 승인 대기 목록 (demo admin, **인증 없음**)
- `POST /api/workout-builder/admin/public-submissions/:id/approve` — 승인 (`visibility: public`)
- `POST /api/workout-builder/admin/public-submissions/:id/reject` — 반려 (`visibility: public_rejected`, body `{ "reason": "..." }`)

템플릿 visibility: `private` · `gym_only` · `public_pending` · `public` · `public_rejected`  
템플릿 status: `draft` · `active` · `archived`  
레거시 값 `gym`, `public_approved`는 API/web에서 읽을 때 정규화합니다.

#### 공용 라이브러리 신청/승인 워크플로

1. 코치가 템플릿 저장 후 `POST .../submit-public` (또는 UI 「공용 신청」)
2. DB `visibility = public_pending`, `public_review_status = pending`
3. demo admin이 `GET .../admin/public-submissions`로 대기 목록 확인
4. 승인 → `visibility = public`, `public_review_status = approved`
5. 반려 → `visibility = public_rejected`, `public_rejection_reason` 저장

web UI는 템플릿 목록 모달의 「승인 대기」 탭에서 MVP 승인/반려를 제공합니다 (`super_admin`만 표시).

#### 프로그램 게시/공유 (회원용 링크)

체육관 코치가 저장한 템플릿을 **회원에게 공유할 수 있는 읽기 전용 링크**로 게시합니다. (회원 DB·회원 로그인은 이번 범위 아님)

1. 템플릿 저장 후 `POST /api/workout-builder/templates/:id/publish` (또는 UI 「게시」)
2. **최초 게시** 시 체육관 wallet에서 **1 credit** 차감 (`super_admin` 제외). 잔액 부족 시 `402 INSUFFICIENT_CREDITS`
3. API가 `share_token`을 생성(또는 재게시 시 기존 token 재사용)하고 `shareUrl` 반환
4. web `/share/programs/:shareToken` 공개 페이지에서 로그인 없이 프로그램·타임라인·영상 재생
5. `POST .../unpublish` 또는 UI 「게시 취소」 → `share_enabled=false` → 동일 URL 404

| API env | 용도 |
|---------|------|
| `FRONTEND_PUBLIC_URL` | publish 응답 `shareUrl` 생성 (예: `https://app-production-6692.up.railway.app`) |

- share token: `crypto.randomBytes(24).base64url` — URL에만 노출, 추측 어려움
- public endpoint에는 password/token/사용자 관리 정보 없음
- 게시 취소 후 재게시(MVP): `published_at`이 있으면 **추가 크레딧 차감 없음**
- 게시 취소 후에도 DB `share_token`은 유지 가능 — `share_enabled=false`면 접근 차단
- **향후:** 회원 배정, 만료일, 조회수, 접근 로그, 비밀번호 보호, 커스텀 도메인

#### 프로그램 실행 화면 — 실제 데이터 연결 1차

저장된 템플릿·공유 프로그램을 Program Player UI에 연결합니다. `/program-player-demo`는 **기본 비활성** (`VITE_ENABLE_PROGRAM_PLAYER_DEMO=false`)이며, 개발용 mock 확인 시에만 `true`로 켭니다.

| URL | 용도 | 로그인 |
|-----|------|--------|
| `/programs/:templateId/play` | 저장된 템플릿 실행 (single) | 필요 |
| `/programs/:templateId/play?view=display` | 회원용 대형 표시 화면 | 필요 |
| `/programs/:templateId/play?view=coach` | 코치 컨트롤 화면 | 필요 |
| `/programs/:templateId/play?view=queue` | 순서/대기 큐 화면 | 필요 |
| `/share/programs/:shareToken` | 게시된 공유 프로그램 (Program Player UI 재사용) | 불필요 |
| `/share/programs/:shareToken?view=display` | 공유 프로그램 표시 화면 | 불필요 |
| `/program-player-demo` | mock UI (demo env `true`일 때만) | 불필요 |

**데이터 연결**

- workout template `blocks` → `ProgramPlayerProgram` adapter
- uploaded video `playbackUrl` / `thumbnailUrl` → video block 재생
- rest / countdown block 타이머·fallback UI
- 빌더 하단 「프로그램 실행」→ `/programs/:templateId/play` (저장된 템플릿 필요)

**향후 TODO:** 실시간 multi-window sync 고도화, 자동 타이머 정확도, 음성 가이드, 회원 배정/완료 기록, 공개 공유 조회 로그, share page 비밀번호/만료일

#### 프로그램 실행 화면 — 자동 타이머/진행 1차

**자동 타이머**

- `isPlaying=true`이고 `mode`가 `video` / `rest` / `countdown`일 때 1초 간격 tick
- `start` / `complete` 화면에서는 tick 없음
- 현재 블록 `remainingSec`이 0이 되면 다음 블록 자동 이동, 마지막 블록이면 `complete`

**블록 duration 규칙** (`programPlayerTimeUtils`)

| 타입 | 우선순위 |
|------|----------|
| video | `durationSec` → `targetDurationSec` → 10초 |
| rest | `durationSec` → 30초 |
| countdown | `durationSec` → 10초 |

**video 재생 vs timer**

- Program Player block timer가 **전체 진행 기준**
- `<video>` 실제 재생 시각과 100% 동기화하지 않음
- `isPlaying`이면 `video.play()` 시도, `pause`면 `video.pause()`
- autoplay 차단 시에도 timer는 계속 진행 (사용자가 controls로 재생 가능)
- 브라우저 정책상 **첫 재생은 사용자 gesture(시작 버튼 등) 이후** 안정적

**컨트롤**

| 동작 | 규칙 |
|------|------|
| 이전 | `elapsedSec > 3` → 현재 블록 처음 / `≤ 3` → 이전 블록 / 첫 블록 → start 화면 |
| 다음 | 다음 블록 / 마지막이면 complete |
| 다시시작 | 첫 블록부터 재생 |
| 완료 화면 종료 | start 화면으로 복귀 |

**키보드** (single / coach): Space 재생·일시정지 · ← → 이전·다음 · R 다시시작 · F 전체화면

**BroadcastChannel 멀티 창 동기화**

- 채널 키: `fightbox-program-player:{programId}:{source}` (demo/template/share 분리)
- 명령 broadcast: PLAY / PAUSE / NEXT / PREVIOUS / RESTART / JUMP_TO_BLOCK / START / COMPLETE
- state sync: 블록 전환·명령 직후 + 재생 중 5초마다 (`currentIndex`, `elapsedSec`, `isPlaying`, `mode`)
- 같은 `sourceId` 메시지는 무시 (echo 방지)
- BroadcastChannel 미지원 시 각 창 독립 동작

**현재 한계**

- 1초 `setInterval` 기준 — 백그라운드 탭 drift 가능 (추후 timestamp/`requestAnimationFrame` 개선)
- 여러 물리 PC·기기 간 동기화 없음 (같은 브라우저/PC 창 간 1차)
- video autoplay는 브라우저 정책 영향

#### 프로그램 실행 화면 UI 1차 (mock demo)

체육관 PC·대형 TV·프로젝터·듀얼/트리플 모니터에서 운동 프로그램을 **실행 전용**으로 재생하는 UI 데모입니다. 빌더 UI와 분리되어 있습니다.

| URL | 용도 |
|-----|------|
| `/program-player-demo` | 기본 (single view) |
| `/program-player-demo?view=single` | PC 통합 실행 화면 |
| `/program-player-demo?view=display` | 회원용 대형 표시 화면 |
| `/program-player-demo?view=coach` | 코치 컨트롤 화면 |
| `/program-player-demo?view=queue` | 순서/대기 큐 화면 |

- **로그인 불필요** — `VITE_ENABLE_PROGRAM_PLAYER_DEMO=true`일 때만 접근 가능
- **PC/대형 모니터 우선** — desktop-first CSS, 900px 이하 1열 fallback
- **2~3 모니터 운영** — 「표시/코치/순서 화면 열기」로 브라우저 새 창 → 각 모니터로 이동
- **BroadcastChannel** — 같은 브라우저 내 창 간 mock 상태 동기화 (미지원 시 독립 fallback)

#### 실제 데이터 테스트 전 mock 데이터 제거 확인

코드는 mock catalog·demo route를 **기본 비활성**합니다. production/Railway에서 아래 env를 확인하세요.

- `VITE_WORKOUT_BUILDER_STORAGE=api`
- `VITE_ENABLE_PROGRAM_PLAYER_DEMO=false`
- `VITE_ENABLE_WORKOUT_BUILDER_MOCK_DATA=false`

**브라우저 확인**

1. `/program-player-demo` → `/workout-program-builder` redirect (demo env off)
2. 영상 라이브러리 — DB `uploaded_videos`만, 없으면 「등록된 영상이 없습니다」
3. 템플릿 목록 — DB `program_templates`만, 없으면 「저장된 템플릿이 없습니다」
4. 새 영상 업로드 → `GET /api/workout-builder/videos` + R2 `playbackUrl`
5. 새 템플릿 저장 → `/programs/:templateId/play` 실행
6. 게시 → `/share/programs/:shareToken` 접근

**DB 정리 원칙 (코드 hard delete 없음)**

| 대상 | 방법 |
|------|------|
| `uploaded_videos` | UI/API 삭제 — R2 best-effort 삭제 |
| `program_templates` | UI/API 삭제 — 공유 중이면 먼저 게시 취소 |
| `users` | hard delete 금지 — disabled 처리 |
| `auth_audit_logs` | 삭제하지 않음 |
| `schema_migrations` | 절대 삭제 금지 |

#### API 로그인 MVP (JWT)

운영 전환 1차: web `VITE_AUTH_PROVIDER=api` + API `JWT_SECRET` 설정 시 DB `users` 테이블 기반 로그인을 사용합니다.

| web | API |
|-----|-----|
| `VITE_AUTH_PROVIDER=api` | `JWT_SECRET`, `JWT_EXPIRES_IN=12h`, `AUTH_PROVIDER=db`, `DATABASE_URL` |
| `VITE_API_BASE_URL` = API public URL | `FRONTEND_ORIGIN` = web origin |

- `POST /api/auth/login` — body `{ "loginId", "password" }` → `{ token, user }`
- `GET /api/auth/me` — `Authorization: Bearer <token>` → `{ user }` (gym_staff 권한 DB hydrate)
- JWT payload는 ASCII 식별자만 (`sub`, `role`, `accountScope`, `gymId`, `creatorId`, `gymCode`, `creatorCode`)
- web 세션: `localStorage` `fightbox.auth.session.v1` — `{ user, token }` (비밀번호 미저장)
- API 요청: Bearer + 기존 `x-*` context 헤더 병행 (transitional). R2 presigned **PUT**에는 Authorization 미포함
- `VITE_AUTH_PROVIDER=demo`: 기존 `demoAccounts.ts` 클라이언트 로그인 fallback (로컬 개발용)
- API `requestContext`: Bearer JWT가 있으면 **헤더 `x-user-role` 조작을 무시**하고 DB/JWT 사용자 컨텍스트 사용. JWT 없을 때만 `x-*` 헤더 fallback (curl·로컬 개발용 — production에서는 JWT 필수 권장)
- refresh token / httpOnly cookie: **미구현** (운영 전 추가 필요)

**로그인 rate limit (in-memory, 1차)**

| 항목 | 값 |
|------|-----|
| 대상 | `POST /api/auth/login` |
| key | `{clientIp}:{loginId}` — loginId는 trim + lowercase |
| window | 15분 |
| max failures | 5 (`INVALID_CREDENTIALS`, `ACCOUNT_DISABLED` 모두 카운트) |
| 차단 | 5회 실패 기록 후 **다음 시도(6회째)** 부터 429 — 1~5회는 401 |
| 성공 로그인 | 해당 key 실패 카운터 초기화 |
| 응답 | `429` + `AUTH_RATE_LIMITED` + `Retry-After` (초) |

- 구현: `apps/api/src/services/authRateLimiter.ts` — process 메모리 `Map` (Railway **단일 replica** 기준)
- multi-replica / 수평 확장 시 Redis 또는 DB 기반 rate limit으로 교체 필요
- Express `trust proxy: 1` — Railway 프록시 뒤 `req.ip` / `X-Forwarded-For` 반영

**로그인 감사 로그 (DB, 1차)**

| 항목 | 값 |
|------|-----|
| 테이블 | `auth_audit_logs` (migration `009_auth_audit_logs.sql`) |
| 기록 이벤트 | `login_success`, `login_failed`, `login_rate_limited` |
| 저장하지 않음 | password, JWT token |
| 저장 필드 | loginId, userId, gymId, role, eventType, success, failureCode, ipAddress, userAgent, createdAt |
| 조회 | `GET /api/admin/auth-audit-logs` — **super_admin** only |
| UI | 빌더 헤더 「감사 로그」 모달 (super_admin) |

- audit insert 실패는 로그인 응답을 막지 않음 (`console.warn` only)
- 운영 TODO: retention policy, export, suspicious login alert, IP geo lookup, Redis/DB rate limit 연계

**운영 전 보안 체크리스트**

- `JWT_SECRET`을 강한 랜덤 값으로 설정하고 주기적으로 교체 검토
- migration seed/demo 비밀번호(`123456!!`) 변경 — `users.password_hash` bcrypt 재생성
- `AUTH_PROVIDER=db` + production에서 header fallback 비활성화 검토
- HTTPS only + httpOnly cookie 세션 저장 검토
- 로그인 rate limit Redis/DB화 (multi-replica 배포 전)
- audit retention / export / alert
- account lock / unlock UI
- password reset flow

데모 DB 계정 (migration `007_users.sql` + `008_auth_users_hardening.sql`, 비밀번호 `123456!!` — **운영 전 교체**):

| loginId | role | userId |
|---------|------|--------|
| `superadmin` | super_admin | demo-super-admin |
| `gymadmin` | gym_admin | demo-gym-admin |
| `gymstaff` | gym_staff | demo-staff-001 |
| `creator` | video_creator | demo-creator-001 |

#### 계정 스코프 (demo / API login 공통)

| 역할 | accountScope | 소속/식별 | 비고 |
|------|--------------|-----------|------|
| `super_admin` | `platform` | 전체 관리자 | 체육관·크리에이터 테넌트 생성/관리 |
| `gym_admin` | `gym` | `gymId` + `gymCode` | 체육관 테넌트 운영 |
| `gym_staff` | `gym` | `gymId` + `gymCode` | granular 직원 권한 |
| `video_creator` | `creator` | `creatorId` + `creatorCode` | **체육관 소속 아님** — 영상 제작/업로드 전문 계정 |

- **gymCode**: 슈퍼관리자가 `gyms` 테이블에 등록하는 체육관 테넌트 코드 (예: `DEMO-GYM`)
- **creator**: `creators` 테이블에 프로필만 준비 (정산·마켓플레이스 UI는 미구현). 추후 체육관에서 본인 영상이 사용될 때 수익 쉐어 대상
- `video_creator` 세션에는 `gymId`를 넣지 않습니다. 기존 workout builder API 호환을 위해 API `requestContext` 내부에서만 `demo-gym` fallback이 적용될 수 있습니다.

#### 개발/테스트용 데모 로그인

`VITE_AUTH_PROVIDER=demo`일 때만 클라이언트 `demoAccounts.ts`로 로그인합니다. `api` 모드에서는 위 JWT login API를 사용합니다.

**운영 환경에서 아래 비밀번호를 그대로 두지 마세요.** API 모드에서는 DB `users.password_hash`(bcrypt)로 검증합니다.

| 아이디 | 비밀번호 | 역할 | 헤더 스코프 표시 예 |
|--------|----------|------|---------------------|
| `superadmin` | `123456!!` | 슈퍼관리자 | 전체 관리자 |
| `gymadmin` | `123456!!` | 체육관관리자 | `DEMO-GYM` |
| `gymstaff` | `123456!!` | 체육관직원 | `DEMO-GYM` |
| `creator` | `123456!!` | 운동영상 크리에이터 | `CREATOR-DEMO` (체육관 코드 아님) |

- 계정 정의: `packages/shared/src/demoAccounts.ts` (비밀번호는 DB에 저장하지 않음)
- web 세션: `localStorage` key `fightbox.auth.session.v1` (`user` + optional `token`, 비밀번호 미저장)
- 로그인 UI: `/login` → 성공 시 `/dashboard`
- 슈퍼관리자 빌더 헤더 **「체육관 관리」**: `GET/POST/PATCH/DELETE /api/admin/gyms` (demo DB `gyms` 테이블)

API 요청 헤더 (로그인 세션 우선, 없으면 env fallback):

- `Authorization: Bearer <token>` — API login 시 (R2 PUT 제외)
- `x-gym-id`
- `x-user-id`
- `x-user-role` — `super_admin` · `gym_admin` · `gym_staff` · `video_creator`
- `x-account-scope` — `platform` · `gym` · `creator`
- `x-gym-code` · `x-creator-id` · `x-creator-code` — gym/creator scope (display name은 세션/UI 전용)
- `x-staff-permissions` (JSON) — `gym_staff` 전용 granular 권한

API 기본값 (헤더 없을 때): `demo-gym` / `demo-gym-admin` / `gym_admin`

#### 사용자 관리 MVP

`users` 테이블 계정을 빌더 헤더 **「사용자 관리」** 모달과 `GET/POST/PATCH/DELETE /api/admin/users` API로 관리합니다.

| 역할 | 사용자 관리 |
|------|-------------|
| `super_admin` | 전체 사용자 조회·생성·수정·비활성화 (모든 role) |
| `gym_admin` | 본인 `gymId`의 `gym_staff` · `video_creator`만 |
| `gym_staff` / `video_creator` | 불가 (403) |

- 비밀번호는 **bcrypt** hash 저장, API 응답에 `passwordHash` 없음
- **hard delete 없음** — `DELETE`는 `status = disabled` 처리
- `gym_staff` 생성·수정 시 `gym_staff_permissions` row upsert (역할 변경 후 row는 DB에 남을 수 있음 — README 참고)
- 본인 계정 비활성화 불가 (`CANNOT_DISABLE_SELF`)
- 마지막 활성 `super_admin` 비활성화 불가 (`LAST_SUPER_ADMIN`)
- **「직원 권한」** 모달과 기능이 겹칠 수 있음 — 추후 통합 예정

**운영 전 보완:** 비밀번호 재설정 플로우 · 초대 이메일 · 감사 로그 · gym scope 세분화 · 검색/페이지네이션

#### 직원 권한 관리 MVP

`gym_staff_permissions` 테이블에 체육관 직원별 granular 권한을 저장합니다.

| 역할 | 직원 권한 관리 UI/API |
|------|----------------------|
| `super_admin` | 가능 (요청 context `gymId` 기준) |
| `gym_admin` | 가능 (본인 gym) |
| `gym_staff` | 불가 (`GET /me`로 본인 권한만 조회) |
| `video_creator` | 불가 |

관리 가능 권한: `canUploadVideos` · `canManageVideos` · `canCreateTemplates` · `canEditTemplates` · `canDeleteTemplates` · `canSubmitPublicTemplates`

- web 빌더 헤더 **「직원 권한」** 버튼 → 모달에서 체크박스 저장 (`PATCH`)
- `gym_staff` 로그인·페이지 로드 시 `GET /api/gym/staff-permissions/me`로 DB 권한을 세션에 반영 (localStorage `staffPermissions`)
- 관리자가 권한을 바꾼 뒤 직원은 **새로고침 또는 재로그인** 시 반영 (mount 시 `/me` 재조회)
- seed: `demo-gym` / `demo-staff-001` / `gymstaff` — migration `004_gym_staff_permissions.sql`
- API login + Bearer 시 `gym_staff` 권한은 서버가 DB에서 로드 (`/api/auth/me` 또는 request context)

#### 역할/권한 MVP

| 역할 | 주요 권한 |
|------|-----------|
| `super_admin` | 전체 + 체육관 코드 관리 + 공용 라이브러리 승인/반려 |
| `gym_admin` | 체육관(gym scope) 영상/템플릿/공용 신청/직원 권한 |
| `gym_staff` | gym scope · `x-staff-permissions` / env JSON granular |
| `video_creator` | creator scope · 영상 업로드·관리, 템플릿 생성/수정/공용 신청 (삭제·승인·체육관 관리 불가) |

공용 승인/반려 admin endpoint는 **`super_admin`만** 허용합니다.

#### 체육관 직원 권한 (추후 DB)

현재 MVP는 로그인 세션의 `staffPermissions`와 API `x-staff-permissions` 헤더로 시뮬레이션합니다. 직원 권한 설정 UI는 아직 없으며, `gymadmin` 계정의 추후 설정 화면과 아래 테이블로 이전할 예정입니다.

추후 Postgres 테이블:

`gym_staff_permissions`

- `id`, `gym_id`, `user_id`
- `can_upload_videos`, `can_manage_videos`, `can_create_templates`, `can_edit_templates`, `can_delete_templates`, `can_submit_public_templates`
- `created_at`, `updated_at`

권한 helper는 `packages/shared/src/authContext.ts`에 정의되어 API middleware와 web UI가 공유합니다.

#### 업로드 영상 삭제 정책

업로드 영상(`uploaded_videos`) 삭제 시:

- DB row는 **soft delete** (`deleted_at` 설정)로 유지합니다.
- R2 원본(`storage_key`)과 썸네일(`thumbnail_storage_key`) 객체 삭제는 **best-effort**로 시도합니다.
- R2 삭제가 일부 실패해도 DB soft delete는 진행합니다.
- 실패한 object key는 API 응답 `data.r2.failed`와 서버 로그에 남깁니다.
- 더미/mock 카탈로그 영상은 삭제 대상이 아닙니다.
- orphan R2 객체 정리는 추후 배치 job으로 보완할 수 있습니다.

CDN/Public URL이 없으면 presign 응답의 `playbackUrl`은 빈 문자열(`""`)입니다. 실제 재생 URL은 추후 R2 Public Development URL 또는 Custom Domain 연결 후 `R2_PUBLIC_URL` / `R2_PUBLIC_CDN_BASE`를 설정하세요.

#### Presign API 계약

`POST {API_BASE_URL}/api/workout-videos/uploads/presign`

공통 타입: `packages/shared/src/videoUploadContract.ts`

**Request**

```json
{
  "fileName": "squat-demo.mp4",
  "fileSize": 10485760,
  "contentType": "video/mp4",
  "gymId": "optional-gym-id",
  "uploaderId": "optional-user-id"
}
```

**Response**

```json
{
  "uploadUrl": "https://...r2.cloudflarestorage.com/fightbox/workout-videos/...",
  "storageKey": "workout-videos/demo-gym/2026/05/...",
  "playbackUrl": "",
  "thumbnailUrl": null,
  "expiresAt": "2026-05-19T12:00:00.000Z",
  "debug": {
    "urlStyle": "path",
    "uploadUrlOrigin": "https://18b23915....r2.cloudflarestorage.com",
    "uploadUrlPathPrefix": "/fightbox/workout-videos/"
  }
}
```

`R2_PRESIGN_URL_STYLE=virtual`로 전환하면 `debug.urlStyle`이 `virtual`이며 host가 `fightbox.{account}.r2.cloudflarestorage.com` 형태가 될 수 있습니다. 브라우저 PUT TLS/CORS 비교 테스트용입니다.

에러 응답:

```json
{
  "error": {
    "code": "UNSUPPORTED_CONTENT_TYPE",
    "message": "Only video uploads are supported."
  }
}
```

**파일 업로드 (클라이언트 → 스토리지)**

```
PUT {uploadUrl}
Content-Type: {contentType}
Body: raw file bytes
```

타입 정의: `apps/web/src/features/workout-program-builder/types/videoUpload.types.ts`  
Adapter: `mockVideoUploadAdapter.ts`, `apiVideoUploadAdapter.ts`

## 문서

- `dev/fightbox_workout_program_builder_feature_steps.md` — 단계별 개발 지시서
- `dev/workout_program_builder_feature_status.md` — 구현 현황·QA 체크리스트
- `apps/web/src/features/workout-program-builder/ARCHITECTURE.md` — 모듈 구조
