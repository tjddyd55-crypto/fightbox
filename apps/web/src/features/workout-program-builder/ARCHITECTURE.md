# Workout Program Builder — 아키텍처 기준 (STEP 1)

API 연동 전까지의 로컬 프론트엔드 기준입니다. STEP 2 이후 기능은 이 문서를 확장합니다.

## 레이어 구조

| 레이어 | 경로 | 책임 |
|--------|------|------|
| Pages | `pages/` | 레이아웃 조립, 모바일 탭 상태, 하위 패널 연결 |
| Components | `components/` | UI 표시·이벤트 전달 (상태 최소화) |
| Hooks | `hooks/useProgramBuilderState.ts` | 편집 중 템플릿·블록·선택·토스트·테스트 재생 플래그 |
| Utils | `utils/` | 순수 함수: 시간, 타임라인, 표시 라벨, 뷰포트 |
| Data | `data/` | 더미 영상·초기 템플릿 (API 전 mock) |
| Types | `types/` | 도메인 타입·상수 |
| Storage | `storage/` (STEP 2+) | localStorage — repository 뒤로 이동 예정 |

## 핵심 상태 (`useProgramBuilderState`)

- `template`: 현재 편집 중 `WorkoutProgramTemplate` (blocks 포함)
- `activeTemplateId` (STEP 2+): localStorage에 저장된 템플릿 id. 없으면 신규 저장
- `selectedBlockId`: 타임라인 ↔ 우측 미리보기/설정 동기화의 단일 기준
- `statusMessage` / `isTestPlaying`: 토스트·테스트 모달

블록 변경은 `updateBlocks` → `reindexBlocks` + `calculateTotalDurationSec`로 `template.totalDurationSec` 갱신.

## `selectedBlockId` 규칙

- 타임라인 행 클릭 → `setSelectedBlockId`
- 영상 추가 → 새 블록 id 선택
- 블록 삭제 → 같은 인덱스의 다음 블록, 없으면 이전, 없으면 `null`
- compact 뷰(≤1199px)에서 타임라인 선택 시 설정 탭으로 전환 (`WorkoutProgramBuilderPage`)

## 시간 계산 (`programTimelineUtils`)

- `computeVideoBlockDuration`: playMode별 영상 블록 길이
- `calculateTotalDurationSec`: 블록 `durationSec` 합 (STEP 8에서 restAfter 등 정책 고도화 예정)
- `formatDuration`: `durationUtils` — UI 표시용

## 데이터 소스 (현재)

- 영상: `mockWorkoutVideos` (고정 배열)
- 초기 템플릿: `mockProgramTemplate`
- 저장 (STEP 2+): `fightbox.workoutProgramTemplates.v1` localStorage

## UI 브레이크포인트

- Desktop: `min-width: 1200px` — 사이드바 + 3컬럼
- Compact: `max-width: 1199px` — 탭(영상/타임라인/설정), 사이드바 숨김
- Phone: `max-width: 767px` — 헤더·하단 바 compact

## STEP별 예상 수정 위치

| STEP | 주요 파일 |
|------|-----------|
| 2–3 | `storage/`, `useProgramBuilderState`, `BottomActionBar`, `TemplateLibraryModal` |
| 4 | `useProgramBuilderState`, `TimelineBlockRow`, `ProgramTimelinePanel` |
| 5 | `VideoLibraryPanel`, `videoFilterUtils.ts` |
| 6 | `VideoLibraryPanel`, `VideoCard`, `useProgramBuilderState` |
| 7–8 | `BlockSettingsForm`, `programTimelineUtils.ts` |
| 9 | `TestPlaybackModal.tsx` |
| 10 | `TimelineBlockRow.tsx`, CSS |
| 11 | `programValidationUtils.ts` |
| 12–13 | `types/`, 배지·모달 |
| 14 | `repositories/` |
