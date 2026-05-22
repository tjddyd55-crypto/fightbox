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

브라우저에서 `http://localhost:5173/workout-program-builder` 로 접속합니다.

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
| `VITE_VIDEO_UPLOAD_PROVIDER` | `mock` (기본) 또는 `api` |
| `VITE_API_BASE_URL` | API 서비스 public URL (예: `https://<api-domain>`) |
| `VITE_WORKOUT_BUILDER_STORAGE` | `local` (기본) 또는 `api` — 템플릿/업로드 영상 메타데이터 저장소 |
| `VITE_FIGHTBOX_GYM_ID` | demo gym scope (기본 `demo-gym`) |
| `VITE_FIGHTBOX_USER_ID` | demo user id (기본 `demo-coach`) |
| `VITE_FIGHTBOX_USER_ROLE` | `gym_admin` (기본) · `super_admin` · `gym_staff` · `video_creator` |
| `VITE_FIGHTBOX_STAFF_PERMISSIONS` | `gym_staff` granular JSON (선택) |

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
- `POST /api/workout-videos/uploads/presign` — R2 presigned PUT URL 발급
- `GET /api/workout-videos/uploads/diagnostics/r2-cors` — `ENABLE_R2_DIAGNOSTICS=true`일 때 R2 OPTIONS preflight 진단
- `GET/POST/PATCH/DELETE /api/workout-builder/videos` — 업로드 영상 메타데이터 CRUD
- `GET/POST/PATCH/DELETE /api/workout-builder/templates` — 프로그램 템플릿 CRUD

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

인증/역할 분리는 아직 없습니다. admin endpoint는 추후 auth middleware로 보호할 예정입니다.  
web UI는 템플릿 목록 모달의 「승인 대기」 탭에서 MVP 승인/반려를 제공합니다.

인증 전까지 gym/user/role scope header (JWT/session auth 교체 예정):

- `x-gym-id` (기본 `demo-gym`)
- `x-user-id` (기본 `demo-coach`)
- `x-user-role` (기본 `gym_admin`) — `super_admin` · `gym_admin` · `gym_staff` · `video_creator`
- `x-staff-permissions` (선택, JSON) — `gym_staff` 전용 granular 권한

web 환경변수 (Railway app 기본값):

- `VITE_FIGHTBOX_GYM_ID=demo-gym`
- `VITE_FIGHTBOX_USER_ID=demo-coach`
- `VITE_FIGHTBOX_USER_ROLE=gym_admin`
- `VITE_FIGHTBOX_STAFF_PERMISSIONS=` (예: `{"canUploadVideos":true,"canEditTemplates":true}`)

#### 역할/권한 MVP

| 역할 | 주요 권한 |
|------|-----------|
| `super_admin` | 전체 + 공용 라이브러리 승인/반려 |
| `gym_admin` | 체육관 영상/템플릿/공용 신청/직원 권한 설정(추후 UI) |
| `gym_staff` | `x-staff-permissions` / env JSON에 따라 granular 허용 |
| `video_creator` | 영상 업로드·관리, 템플릿 생성/수정/공용 신청 (삭제·승인 불가) |

공용 승인/반려 admin endpoint는 **`super_admin`만** 허용합니다.

#### 체육관 직원 권한 (추후 DB)

현재 MVP는 header/env JSON으로 시뮬레이션합니다. 추후 Postgres 테이블:

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
