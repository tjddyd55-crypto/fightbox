# Workout Program Builder — 기능 현황 (STEP 1~15)

최종 갱신: 로컬 `main` 기준 1차 기능 개발 완료.

## 구현 완료

| 영역 | 내용 |
|------|------|
| 구조 | `types` / `data` / `hooks` / `utils` / `components` / `repositories` / `storage` |
| 템플릿 | localStorage 저장·목록·불러오기·복사·삭제 |
| 타임라인 | 영상·휴식·카운트다운·음성 블록, DnD(PC), 모바일 ↑↓·복제·삭제 |
| 영상 라이브러리 | 검색·태그·난이도·길이·반복 가능 필터, 선택 미리보기 |
| 설정 | 블록별 재생/휴식/음성 설정 → 상태 반영 |
| 시간 | 블록 표시(운동만) vs 총 시간(운동+블록 후 휴식) 정책 |
| 테스트 재생 | interval 시뮬레이션, 빠른 모드, 이전/다음/처음부터 |
| 검증 | 저장·테스트 재생 전 오류/경고 |
| 공용 신청 | 모달 제출 → `visibility: public_pending`, 목록 배지 |
| 확장 타입 | 크레딧·권한 placeholder, 헤더 크레딧·프리미엄 배지 |
| Repository | `programTemplateRepository`, `videoRepository` |

## 더미 / localStorage (API 미연동)

- 영상 목록 API
- 템플릿 서버 동기화
- 공용 승인 워크플로 (실제 `public_approved` 전환)
- 크레딧 차감·결제
- `playbackOnly` 라우트 가드

## API 교체 지점

- `repositories/programTemplateRepository.ts` — 템플릿 CRUD·공용 신청
- `repositories/videoRepository.ts` — 영상 목록·검색
- `storage/programTemplateStorage.ts` — 현재 localStorage 구현체

## QA 체크리스트 (수동)

### 레이아웃

- [ ] PC 1440px / 1280px — 3컬럼, 타임라인 DnD
- [ ] 태블릿 1024px / 768px — 탭 UI, 패널 전환
- [ ] 모바일 430px / 390px / 360px — 탭·하단 바·모달

### 기능

- [ ] 템플릿 저장 → 목록 표시 → 불러오기
- [ ] 검색·필터·필터 초기화
- [ ] 블록 추가·설정 변경 → 총 시간 갱신
- [ ] 모바일 블록 ↑↓·복제·삭제(confirm)
- [ ] 테스트 재생·빠른 모드
- [ ] 빈 타임라인 저장 차단
- [ ] 공용 신청 → 승인 대기 배지

### 명령

```bash
npm run typecheck
npm run lint
npm run build
```

## 다음 단계 추천

1. 백엔드 API 스펙 확정 후 repository 구현 교체
2. 실제 영상 스트리밍·썸네일 URL
3. 인증·체육관 멀티테넌트·역할 기반 라우팅
4. E2E 테스트 (Playwright 등)
