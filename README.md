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

API presign이 정상 확인된 후 `VITE_VIDEO_UPLOAD_PROVIDER=api`와 `VITE_API_BASE_URL`을 설정하세요.

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
| `R2_ACCOUNT_ID` | Cloudflare account ID |
| `R2_ACCESS_KEY_ID` | R2 access key |
| `R2_SECRET_ACCESS_KEY` | R2 secret (API 서비스에만) |
| `R2_BUCKET_NAME` / `R2_BUCKET` | 버킷명 (`fightbox`) |
| `R2_ENDPOINT` | S3 API endpoint (버킷명 미포함) |
| `R2_PUBLIC_URL` / `R2_PUBLIC_CDN_BASE` | 선택 — Public/Custom URL (없으면 `playbackUrl`은 `""`) |

**엔드포인트**

- `GET /health` — 서비스 상태
- `POST /api/workout-videos/uploads/presign` — R2 presigned PUT URL 발급

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
- 템플릿 저장: `localStorage` (`fightbox.workoutProgramTemplates.v1`)
- API 연동 전: `repositories/` 계층이 storage·더미 데이터를 감쌉니다

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

`.env.example`을 참고해 Railway app/api 서비스 또는 로컬 `.env.local`에 설정하세요.

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
  "uploadUrl": "https://...r2.cloudflarestorage.com/...",
  "storageKey": "workout-videos/demo-gym/2026/05/...",
  "playbackUrl": "",
  "thumbnailUrl": null,
  "expiresAt": "2026-05-19T12:00:00.000Z"
}
```

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
