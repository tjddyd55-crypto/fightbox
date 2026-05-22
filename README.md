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

브라우저에서 `http://localhost:5173/login` 으로 접속한 뒤 개발용 계정으로 로그인합니다. 로그인 후 `/workout-program-builder` 로 이동합니다.

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
| `VITE_FIGHTBOX_GYM_ID` | (선택) 로그인 세션 없을 때만 fallback gym scope |
| `VITE_FIGHTBOX_USER_ID` | (선택) 로그인 세션 없을 때만 fallback user id |
| `VITE_FIGHTBOX_USER_ROLE` | (선택) 로그인 세션 없을 때만 fallback role |
| `VITE_FIGHTBOX_STAFF_PERMISSIONS` | (선택) `gym_staff` fallback granular JSON |

API presign이 정상 확인된 후 `VITE_VIDEO_UPLOAD_PROVIDER=api`와 `VITE_API_BASE_URL`을 설정하세요.
Workout builder DB CRUD가 준비되면 `VITE_WORKOUT_BUILDER_STORAGE=api`로 전환합니다. 기본값 `local`은 localStorage fallback을 유지합니다.

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
| `JWT_SECRET` | JWT 서명 시크릿 (API 서비스에만, 커밋 금지). production에서 미설정 시 기동 실패 |
| `JWT_EXPIRES_IN` | 액세스 토큰 만료 (예: `12h`). 기본 `12h` |
| `JWT_EXPIRES_IN_SEC` | (레거시) 초 단위 만료. `JWT_EXPIRES_IN` 미설정 시 `43200`(12h) |
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

루트 `npm run build` / `npm run start` 도 web 기준으로 동작합니다.

## 주요 라우트

프론트 라우트는 `apps/web/src/main.tsx`를 참고하세요. 운동 프로그램 빌더는 `/workout-program-builder` 경로입니다.

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
- refresh token / httpOnly cookie / login rate limit: **미구현** (운영 전 추가 필요)

**운영 전 보안 체크리스트**

- `JWT_SECRET`을 강한 랜덤 값으로 설정하고 주기적으로 교체 검토
- migration seed/demo 비밀번호(`123456!!`) 변경 — `users.password_hash` bcrypt 재생성
- `AUTH_PROVIDER=db` + production에서 header fallback 비활성화 검토
- HTTPS only + httpOnly cookie 세션 저장 검토
- 로그인 시도 rate limiting 추가

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
- 로그인 UI: `/login` → 성공 시 `/workout-program-builder`
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

#### 직원 권한 관리 MVP

`gym_staff_permissions` 테이블에 체육관 직원별 granular 권한을 저장합니다. **운영 Auth 전환 전** demo 계정과 연동된 1차 MVP입니다.

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
