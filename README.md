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

### 프론트 (web) — 현재 app 서비스

| 항목 | 값 |
|------|-----|
| Build Command | `npm run build:web` |
| Start Command | `npm run start:web` |

루트 `npm run build` / `npm run start` 도 web 기준으로 동작합니다.

### API — 추후 별도 서비스

| 항목 | 값 |
|------|-----|
| Build Command | `npm run build:api` |
| Start Command | `npm run start:api` |

R2 presign 등 업로드 API는 다음 단계에서 `apps/api`에 구현합니다.

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
| `VITE_API_BASE_URL` | `api`일 때 백엔드 origin (예: `http://localhost:3000`) |

`.env.example`을 복사해 `apps/web/.env.local` 또는 루트 `.env.local`에 설정하세요.

#### Presign API 계약

`POST {VITE_API_BASE_URL}/api/workout-videos/uploads/presign`

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
  "uploadUrl": "https://...",
  "storageKey": "videos/...",
  "playbackUrl": "https://...",
  "thumbnailUrl": "https://...",
  "expiresAt": "2026-05-19T12:00:00.000Z"
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
