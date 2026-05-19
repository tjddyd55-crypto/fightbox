# Cursor 구현 지시문: 체육관 운동 프로그램 빌더 관리자 화면 1차 MVP

## 0. 프로젝트 목표

체육관 코치/관장/스태프가 운동 영상을 검색하고, 드래그앤드롭으로 운동 프로그램 타임라인을 구성하며, 각 블록의 미리보기와 반복/휴식/카운트다운/음성 안내를 설정해서 하나의 운동 프로그램 템플릿으로 저장·복사·테스트할 수 있는 관리자용 프로그램 빌더 화면을 구현한다.

이번 1차 구현 범위는 **실제 재생 엔진, 클라우드 업로드, 권한/크레딧/승인 시스템 전체 구현이 아니라**, 우선 화면과 상태 모델 중심의 **프론트엔드 MVP**다.

최종적으로 사용자는 다음 흐름을 경험해야 한다.

```text
영상 라이브러리 검색
→ 영상 카드 미리보기
→ 타임라인에 추가
→ 타임라인 순서 변경
→ 타임라인 항목 클릭
→ 우측 미리보기 자동 업데이트
→ 반복/휴식/카운트다운/음성 안내 설정
→ 총 시간 자동 계산
→ 구간 미리보기/템플릿 저장/복사 저장/테스트 재생
```

---

## 1. 핵심 사용자 시나리오

### 1.1 관리자/코치가 프로그램을 만드는 흐름

1. 코치가 `운동 프로그램 빌더` 화면에 들어온다.
2. 좌측 `영상 라이브러리`에서 검색어 또는 태그로 운동 영상을 찾는다.
3. 영상 카드를 보고 제목, 썸네일, 길이, 난이도, 태그, 반복 가능 여부를 확인한다.
4. 영상 카드의 `추가` 버튼을 누르거나 드래그해서 중앙 타임라인에 넣는다.
5. 중앙 타임라인에서 순서를 드래그앤드롭으로 변경한다.
6. 타임라인에서 특정 항목을 클릭하면 해당 블록이 선택된다.
7. 선택된 블록은 노란색 포인트로 강조된다.
8. 우측 패널의 `선택 블록 미리보기`가 즉시 해당 항목의 썸네일/미리보기로 변경된다.
9. 우측 설정 패널에서 반복 방식, 지정 시간 반복, 휴식, 음성 안내를 설정한다.
10. 총 시간이 자동 계산된다.
11. 코치가 `구간 미리보기`, `템플릿 저장`, `복사 저장`, `테스트 재생`을 실행할 수 있다.

---

## 2. 우선 구현 범위

### 반드시 구현할 것

- 검은색/차콜 배경 + 노란색 포인트 UI
- PC 웹 대시보드형 레이아웃
- 3컬럼 구조
  - 좌측: 영상 라이브러리/검색
  - 중앙: 프로그램 타임라인
  - 우측: 선택 블록 미리보기 + 설정 패널
- 영상 카드 더미 데이터
- 태그 필터 UI
- 검색 UI
- 영상 카드 추가 버튼
- 타임라인 블록 목록
- 타임라인 항목 선택 상태
- 타임라인 선택 시 우측 미리보기 자동 변경
- 영상 블록/휴식 블록/카운트다운 블록/음성 안내 블록 타입 구분
- 반복 설정 UI
  - 원본 길이 재생
  - 반복 횟수
  - 지정 시간까지 반복
- 블록 이후 휴식 설정 UI
- 음성 안내 체크박스
  - Ready
  - Go
  - Stop
  - 마지막 10초 카운트
- 총 시간 자동 계산
- 하단 액션 버튼
  - 구간 미리보기
  - 템플릿 저장
  - 복사 저장
  - 테스트 재생

### 이번 단계에서 실제 구현하지 않아도 되는 것

- 실제 영상 업로드
- 실제 클라우드 저장소 연동
- 실제 S3/R2 연동
- 실제 영상 스트리밍
- 실제 로컬 캐시
- 실제 인증/권한
- 실제 크레딧 정산
- 실제 공용 라이브러리 승인 플로우
- 실제 AI 영상 변환

단, 나중에 확장 가능하도록 타입과 구조는 분리해서 작성한다.

---

## 3. UI 디자인 방향

### 3.1 색상

검은색 배경에 노란색 포인트를 사용한다.

권장 색상:

```ts
const colors = {
  background: '#0B0B0E',
  surface: '#15161A',
  surface2: '#1F2026',
  border: '#2C2D34',
  primary: '#FFD60A',
  primarySoft: 'rgba(255, 214, 10, 0.12)',
  textPrimary: '#FFFFFF',
  textSecondary: '#A7AAB3',
  textMuted: '#6F737C',
  danger: '#EF4444',
  success: '#22C55E',
};
```

### 3.2 레이아웃

전체 화면은 다음 구조로 만든다.

```text
┌──────────────────────────────────────────────────────────────┐
│ Top Header: 체육관 운동 프로그램 빌더 / 저장 상태 / 사용자     │
├───────────────┬─────────────────────┬────────────────────────┤
│ Sidebar       │ Video Library       │ Program Timeline       │ Selected Preview / Settings
│ Navigation    │ Search + Cards      │ Builder                │
├───────────────┴─────────────────────┴────────────────────────┤
│ Bottom Action Bar: 총 시간 / 구간 미리보기 / 저장 / 테스트     │
└──────────────────────────────────────────────────────────────┘
```

실제 구현에서는 사이드바와 3컬럼을 아래처럼 구성한다.

```text
[Sidebar 220px]
[Library 380~440px]
[Timeline flex 1]
[Right Panel 420~480px]
```

### 3.3 핵심 UX 규칙

- 타임라인 항목은 클릭 가능해야 한다.
- 선택된 항목은 노란색 테두리/배경으로 강조한다.
- 선택된 항목이 변경되면 우측 미리보기와 설정 패널의 데이터가 즉시 바뀌어야 한다.
- 영상 카드는 썸네일, 길이, 제목, 태그, 난이도, 추가 버튼을 명확히 표시한다.
- 반복 가능한 짧은 영상은 `반복 가능` 또는 `Loop` 표시를 한다.
- 휴식/카운트다운/음성 안내는 영상과 다른 블록 타입으로 시각적으로 구분한다.

---

## 4. 권장 파일 구조

현재 프로젝트 구조를 먼저 확인하고, 기존 컨벤션을 우선 따른다.

신규 기능을 독립적으로 추가할 경우 권장 구조는 다음과 같다.

```text
src/features/workout-program-builder/
  components/
    BuilderHeader.tsx
    BuilderSidebar.tsx
    VideoLibraryPanel.tsx
    VideoCard.tsx
    FilterChips.tsx
    ProgramTimelinePanel.tsx
    TimelineBlockRow.tsx
    SelectedBlockPanel.tsx
    BlockPreviewCard.tsx
    BlockSettingsForm.tsx
    BottomActionBar.tsx
  data/
    mockWorkoutVideos.ts
    mockProgramTemplate.ts
  hooks/
    useProgramBuilderState.ts
  types/
    workoutProgramBuilder.types.ts
  utils/
    durationUtils.ts
    programTimelineUtils.ts
  pages/
    WorkoutProgramBuilderPage.tsx
  index.ts
```

라우팅/페이지 구조가 이미 존재한다면 기존 방식에 맞게 연결한다.

---

## 5. 데이터 모델 초안

### 5.1 운동 영상 타입

```ts
export type WorkoutDifficulty = 'beginner' | 'intermediate' | 'advanced';

export interface WorkoutVideo {
  id: string;
  title: string;
  description?: string;
  durationSec: number;
  thumbnailUrl: string;
  previewUrl?: string;
  tags: string[];
  difficulty: WorkoutDifficulty;
  bodyParts: string[];
  isLoopable: boolean;
  sourceType: 'private' | 'gym' | 'public';
}
```

### 5.2 프로그램 블록 타입

```ts
export type ProgramBlockType = 'video' | 'rest' | 'countdown' | 'voice';

export type VideoPlayMode =
  | 'original_duration'
  | 'repeat_count'
  | 'loop_until_duration';

export interface BaseProgramBlock {
  id: string;
  type: ProgramBlockType;
  title: string;
  order: number;
  durationSec: number;
}

export interface VideoProgramBlock extends BaseProgramBlock {
  type: 'video';
  videoId: string;
  playMode: VideoPlayMode;
  repeatCount?: number;
  targetDurationSec?: number;
  restAfterSec?: number;
  voiceCues: {
    ready: boolean;
    go: boolean;
    stop: boolean;
    lastTenCount: boolean;
  };
}

export interface RestProgramBlock extends BaseProgramBlock {
  type: 'rest';
  message?: string;
  nextBlockTitle?: string;
}

export interface CountdownProgramBlock extends BaseProgramBlock {
  type: 'countdown';
  countFromSec: number;
}

export interface VoiceProgramBlock extends BaseProgramBlock {
  type: 'voice';
  cueText: string;
}

export type ProgramBlock =
  | VideoProgramBlock
  | RestProgramBlock
  | CountdownProgramBlock
  | VoiceProgramBlock;
```

### 5.3 프로그램 템플릿 타입

```ts
export interface WorkoutProgramTemplate {
  id: string;
  title: string;
  description?: string;
  tags: string[];
  totalDurationSec: number;
  blocks: ProgramBlock[];
  visibility: 'private' | 'gym' | 'public_pending' | 'public_approved';
  updatedAt: string;
}
```

---

## 6. 더미 데이터 예시

처음 구현은 API 없이 더미 데이터로 진행한다.

### 6.1 영상 예시

```ts
export const mockWorkoutVideos: WorkoutVideo[] = [
  {
    id: 'video_warmup_001',
    title: '다이내믹 워밍업',
    durationSec: 312,
    thumbnailUrl: '/mock/workout/warmup.jpg',
    previewUrl: '/mock/workout/warmup-preview.mp4',
    tags: ['준비운동', '전신', '스트레칭'],
    difficulty: 'beginner',
    bodyParts: ['전신'],
    isLoopable: false,
    sourceType: 'public',
  },
  {
    id: 'video_squat_001',
    title: '스쿼트 기본',
    durationSec: 225,
    thumbnailUrl: '/mock/workout/squat.jpg',
    previewUrl: '/mock/workout/squat-preview.mp4',
    tags: ['하체', '근력', '초급'],
    difficulty: 'intermediate',
    bodyParts: ['대퇴사두근', '둔근', '햄스트링'],
    isLoopable: false,
    sourceType: 'gym',
  },
  {
    id: 'video_burpee_loop_001',
    title: '버피 10초 루프',
    durationSec: 10,
    thumbnailUrl: '/mock/workout/burpee.jpg',
    previewUrl: '/mock/workout/burpee-preview.mp4',
    tags: ['고강도', '전신', '루프'],
    difficulty: 'advanced',
    bodyParts: ['전신'],
    isLoopable: true,
    sourceType: 'public',
  }
];
```

이미지 파일이 없으면 우선 gradient placeholder 또는 CSS placeholder로 대체한다.

---

## 7. 단계별 구현 계획 및 커밋 단위

각 단계가 끝날 때마다 아래 검증을 실행한다.

권장 검증 명령은 프로젝트에 맞게 조정한다.

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

프로젝트에 없는 명령은 실행하지 말고, `package.json`에 존재하는 스크립트만 사용한다.

---

# STEP 1. 기능 폴더와 타입/더미 데이터 추가

## 목표

운동 프로그램 빌더 기능의 기반 타입, 더미 데이터, 유틸을 추가한다.

## 작업

1. `src/features/workout-program-builder/` 폴더 생성
2. 타입 파일 생성
   - `types/workoutProgramBuilder.types.ts`
3. 더미 데이터 생성
   - `data/mockWorkoutVideos.ts`
   - `data/mockProgramTemplate.ts`
4. 시간 포맷 유틸 생성
   - `utils/durationUtils.ts`
5. 타임라인 총 시간 계산 유틸 생성
   - `utils/programTimelineUtils.ts`

## 구현 포인트

`formatDuration`은 다음 출력이 가능해야 한다.

```ts
formatDuration(30) // '00:30'
formatDuration(185) // '03:05'
formatDuration(3600) // '60:00' 또는 '1:00:00' 중 프로젝트 기준 선택
```

`calculateTotalDurationSec(blocks)`는 모든 블록의 `durationSec` 합계를 반환한다.

## 커밋 메시지

```bash
git add .
git commit -m "feat: add workout program builder data model"
```

---

# STEP 2. 관리자 빌더 페이지 레이아웃 생성

## 목표

검은색 배경 + 노란색 포인트의 3컬럼 대시보드 기본 레이아웃을 만든다.

## 작업

1. 페이지 컴포넌트 생성
   - `pages/WorkoutProgramBuilderPage.tsx`
2. 레이아웃 컴포넌트 생성
   - `components/BuilderHeader.tsx`
   - `components/BuilderSidebar.tsx`
   - `components/VideoLibraryPanel.tsx`
   - `components/ProgramTimelinePanel.tsx`
   - `components/SelectedBlockPanel.tsx`
   - `components/BottomActionBar.tsx`
3. 페이지 라우트 연결
   - 기존 라우팅 구조 확인 후 `/workout-program-builder` 또는 적절한 경로에 연결

## UI 요구사항

- 전체 배경: `#0B0B0E`
- 카드/패널: `#15161A`
- 선: `#2C2D34`
- 포인트: `#FFD60A`
- 텍스트: 흰색/회색 계열
- 라운드 코너 적용
- 패널 사이 간격 충분히 확보

## 커밋 메시지

```bash
git add .
git commit -m "feat: scaffold workout program builder layout"
```

---

# STEP 3. 영상 라이브러리 패널 구현

## 목표

좌측 영상 라이브러리에서 영상을 검색하고 필터링하고 타임라인에 추가할 수 있게 한다.

## 작업

1. `VideoLibraryPanel.tsx` 구현
2. `VideoCard.tsx` 구현
3. `FilterChips.tsx` 구현
4. 검색 상태 추가
5. 태그 필터 상태 추가
6. 영상 카드 `추가` 버튼 구현

## UI 요구사항

영상 카드에는 다음 정보가 표시되어야 한다.

- 썸네일/placeholder
- 영상 길이 badge
- 제목
- 태그
- 난이도
- 반복 가능 여부
- `추가` 버튼

검색/필터는 우선 클라이언트 상태로 처리한다.

## 동작 요구사항

- 검색어를 입력하면 제목/태그 기준으로 목록이 필터링된다.
- 태그 칩을 클릭하면 해당 태그 기준으로 필터링된다.
- `추가` 버튼을 누르면 중앙 타임라인에 영상 블록이 추가된다.

## 커밋 메시지

```bash
git add .
git commit -m "feat: implement workout video library panel"
```

---

# STEP 4. 프로그램 타임라인 구현

## 목표

중앙 타임라인에 프로그램 블록을 표시하고, 선택/추가/순서 변경 기반을 만든다.

## 작업

1. `ProgramTimelinePanel.tsx` 구현
2. `TimelineBlockRow.tsx` 구현
3. 선택 상태 `selectedBlockId` 구현
4. 타임라인 행 클릭 시 선택 처리
5. 선택된 행 노란색 강조
6. 블록 타입별 아이콘/라벨 표시

## 우선 구현

드래그앤드롭 라이브러리가 이미 프로젝트에 있으면 기존 라이브러리를 사용한다.
없다면 우선 위/아래 이동 버튼 또는 기본 구조만 먼저 구현하고, 다음 단계에서 DnD를 추가한다.

추천 DnD 후보:

- 이미 설치되어 있으면 `@dnd-kit/core`, `@dnd-kit/sortable`
- 새로 설치가 부담이면 1차는 순서 변경 버튼으로 대체

## 타임라인 예시

```text
1. 준비운동 5분
2. 스쿼트 3분
3. 휴식 30초
4. 버피 10초 영상 · 3분 반복
5. 카운트다운 10초
6. 복근 5분
7. 마무리 스트레칭 4분
```

## 커밋 메시지

```bash
git add .
git commit -m "feat: implement workout program timeline"
```

---

# STEP 5. 선택 블록 미리보기 자동 업데이트 구현

## 목표

가장 중요한 UX인 **타임라인 항목 클릭 → 우측 미리보기 자동 변경**을 구현한다.

## 작업

1. `SelectedBlockPanel.tsx` 구현
2. `BlockPreviewCard.tsx` 구현
3. 선택된 블록에 연결된 영상 데이터 조회
4. 우측 미리보기에서 블록 타입별 다른 UI 표시
   - video: 썸네일/미리보기/메타정보
   - rest: 휴식 타이머 화면
   - countdown: 카운트다운 화면
   - voice: 음성 안내 메시지 화면

## 동작 요구사항

- 타임라인에서 `스쿼트` 클릭 → 우측에 스쿼트 썸네일/메타정보 표시
- 타임라인에서 `버피` 클릭 → 우측에 버피 썸네일/반복 설정 표시
- 타임라인에서 `휴식` 클릭 → 우측에 휴식 30초 설정 표시
- 타임라인에서 `카운트다운` 클릭 → 우측에 카운트다운 설정 표시

## 우측 미리보기 표시 정보

영상 블록일 때:

- 제목
- 썸네일/플레이어 placeholder
- 길이
- 태그
- 난이도
- 운동 부위
- 반복 가능 여부

휴식 블록일 때:

- 휴식 시간
- 다음 운동명
- 화면 문구

카운트다운 블록일 때:

- 카운트다운 초
- 표시 문구

## 커밋 메시지

```bash
git add .
git commit -m "feat: sync selected timeline block with preview panel"
```

---

# STEP 6. 블록 설정 폼 구현

## 목표

우측 패널에서 선택된 블록의 재생 방식, 반복, 휴식, 음성 안내를 수정할 수 있게 한다.

## 작업

1. `BlockSettingsForm.tsx` 구현
2. 영상 블록 설정 구현
   - 원본 길이 재생
   - 반복 횟수
   - 지정 시간까지 반복
   - 블록 이후 휴식
   - 음성 안내 체크박스
3. 휴식 블록 설정 구현
   - 휴식 시간
   - 안내 문구
4. 카운트다운 블록 설정 구현
   - 카운트다운 시간
5. 설정 변경 시 타임라인 상태 업데이트
6. 총 시간 자동 재계산

## 핵심 로직

영상 블록에서 `playMode` 변경 시 durationSec을 적절히 업데이트한다.

예시:

```ts
// 원본 길이
block.durationSec = video.durationSec;

// 반복 횟수
block.durationSec = video.durationSec * repeatCount;

// 지정 시간까지 반복
block.durationSec = targetDurationSec;
```

## 커밋 메시지

```bash
git add .
git commit -m "feat: add selected block settings form"
```

---

# STEP 7. 하단 액션 바 및 저장/복사/테스트 인터랙션 구현

## 목표

하단 액션 바를 구현하고 사용자가 현재 프로그램의 상태를 확인할 수 있게 한다.

## 작업

1. `BottomActionBar.tsx` 구현
2. 총 시간 표시
3. 버튼 구현
   - 구간 미리보기
   - 템플릿 저장
   - 복사 저장
   - 테스트 재생
4. 버튼 클릭 시 우선 toast/alert 또는 상태 메시지 표시

## 동작 요구사항

- `템플릿 저장` 클릭 시 “템플릿이 저장되었습니다.” 메시지 표시
- `복사 저장` 클릭 시 “복사본으로 저장되었습니다.” 메시지 표시
- `구간 미리보기` 클릭 시 현재 선택 블록 기준 미리보기 상태 표시
- `테스트 재생` 클릭 시 테스트 모달 또는 간단한 테스트 상태 표시

프로젝트에 toast 시스템이 있으면 기존 toast 사용.
없으면 임시 alert 대신 페이지 내부 상태 메시지 사용.

## 커밋 메시지

```bash
git add .
git commit -m "feat: add program builder action bar"
```

---

# STEP 8. 드래그앤드롭 순서 변경 구현

## 목표

타임라인 블록 순서를 드래그앤드롭으로 변경할 수 있게 한다.

## 작업

1. 프로젝트의 의존성 확인
2. 이미 `@dnd-kit`이 있으면 사용
3. 없으면 설치 여부를 판단하되, 프로젝트 정책상 새 의존성 추가가 부담이면 간단한 reorder 버튼 유지
4. 드래그 완료 시 blocks 순서 변경
5. order 값 재정렬
6. 선택된 블록 상태 유지

## 권장 구현

```ts
function reorderBlocks(blocks: ProgramBlock[], activeId: string, overId: string): ProgramBlock[] {
  // activeId 위치와 overId 위치를 찾아 재정렬
  // order를 1부터 다시 부여
}
```

## 커밋 메시지

```bash
git add .
git commit -m "feat: enable drag and drop timeline reordering"
```

---

# STEP 9. 반응형/시각 디테일 정리

## 목표

UI를 실제 서비스 화면처럼 정리한다.

## 작업

1. 간격/패딩/높이 정리
2. 스크롤 영역 분리
   - 영상 라이브러리 목록
   - 타임라인 목록
   - 우측 설정 패널
3. 선택 상태/hover 상태 정리
4. 빈 상태 UI 추가
5. 긴 제목 말줄임 처리
6. 접근성 기본 처리
   - 버튼 aria-label
   - 키보드 포커스 표시

## 커밋 메시지

```bash
git add .
git commit -m "style: polish workout program builder interface"
```

---

# STEP 10. 검증 및 리팩터링

## 목표

코드 품질을 확인하고 오류 없이 빌드되도록 정리한다.

## 작업

1. 사용하지 않는 import 제거
2. 타입 오류 제거
3. lint 오류 제거
4. build 오류 제거
5. 상태 로직이 너무 커졌으면 hook으로 분리
   - `useProgramBuilderState.ts`
6. 유틸 함수 테스트 가능하면 추가

## 검증 명령

`package.json` 확인 후 가능한 명령만 실행한다.

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

## 커밋 메시지

```bash
git add .
git commit -m "refactor: stabilize workout program builder MVP"
```

---

## 8. Cursor Composer 작업 방식 지시

Cursor Composer 2 Fast 기준으로 다음 방식으로 진행한다.

### 작업 원칙

- 한 번에 전체 구현하지 말고 STEP 단위로 진행한다.
- 각 STEP 완료 후 반드시 변경 파일 목록을 요약한다.
- 각 STEP 완료 후 가능한 검증 명령을 실행한다.
- 검증 실패 시 다음 STEP으로 넘어가지 말고 오류를 먼저 수정한다.
- 커밋 메시지는 위에 지정된 메시지를 따른다.
- 기존 프로젝트 구조와 스타일을 우선 존중한다.
- 새 라이브러리 설치는 꼭 필요한 경우에만 제안하고, 가능하면 기존 의존성으로 구현한다.
- API 연동은 하지 말고 더미 데이터와 로컬 상태로 먼저 구현한다.

### Cursor에 줄 시작 프롬프트

```text
이 파일의 지시문을 기준으로 체육관 운동 프로그램 빌더 관리자 화면 1차 MVP를 구현해줘.

중요:
- 한 번에 전체 구현하지 말고 STEP 1부터 순서대로 진행해줘.
- 각 STEP 완료 후 변경 파일 목록, 구현 내용, 검증 결과를 요약해줘.
- 검증 오류가 있으면 다음 단계로 넘어가지 말고 먼저 수정해줘.
- 기존 프로젝트 구조와 스타일을 먼저 파악하고 그에 맞게 파일 위치와 구현 방식을 조정해줘.
- 이번 범위는 API/업로드/권한/크레딧이 아니라 프론트엔드 빌더 MVP야.
- 핵심 UX는 타임라인 항목 클릭 시 우측 선택 블록 미리보기가 즉시 자동 업데이트되는 것이야.
- 디자인은 검은색/차콜 배경에 노란색 포인트를 사용하는 고급스러운 SaaS 관리자 UI로 구현해줘.

먼저 STEP 1만 진행해줘.
```

---

## 9. 최종 완료 기준

아래 조건을 만족하면 1차 MVP 완료로 본다.

- `/workout-program-builder` 또는 프로젝트 기준 경로에서 화면 접근 가능
- 좌측 영상 라이브러리 표시
- 검색/태그 필터 가능
- 영상 카드에서 타임라인 추가 가능
- 중앙 타임라인 표시
- 타임라인 항목 선택 가능
- 선택 항목 노란색 강조
- 우측 미리보기 자동 업데이트
- 영상/휴식/카운트다운/음성 블록 타입별 미리보기 구분
- 영상 블록 반복/시간/휴식/음성 설정 가능
- 설정 변경 시 총 시간 반영
- 하단 액션 버튼 표시
- lint/typecheck/build 중 프로젝트에서 제공되는 검증 명령 통과

---

## 10. 이후 확장 예정

1차 MVP 이후 다음 기능을 별도 단계로 확장한다.

- 실제 영상 업로드
- Cloudflare R2/S3 저장소 연동
- 썸네일/프리뷰 자동 생성
- 템플릿 API 저장
- 체육관별 권한 관리
- 공용 라이브러리 승인
- 크레딧 장부
- 체육관 기기 등록
- 로컬 암호화 캐시
- 실제 전체화면 재생기
- AI 캐릭터 영상 변환 파이프라인
