import type { DashboardViewProps } from '../dashboard.types';
import { DashboardHome } from './DashboardHome';
import { DashboardMenuCard } from './DashboardMenuCard';

export function GymAdminDashboard({ user, scopeLabel, actions }: DashboardViewProps) {
  return (
    <DashboardHome
      user={user}
      scopeLabel={scopeLabel}
      title="체육관관리자 대시보드"
      subtitle="주요 액션: 프로그램 만들기"
    >
      <DashboardMenuCard
        icon="🛠"
        title="운동 프로그램 빌더"
        description="영상 등록, 타임라인 구성, 템플릿 저장"
        onClick={() => actions.goToBuilder()}
      />
      <DashboardMenuCard
        icon="🎬"
        title="영상 라이브러리"
        description="등록된 운동 영상 검색·관리"
        onClick={() => actions.goToBuilder({ panel: 'videos' })}
      />
      <DashboardMenuCard
        icon="📁"
        title="템플릿 관리"
        description="저장된 프로그램 템플릿 불러오기·복사"
        onClick={() => actions.goToBuilder({ modal: 'templates' })}
      />
      <DashboardMenuCard
        icon="▶"
        title="프로그램 실행"
        description="저장한 프로그램을 대형 모니터에서 실행"
        hint="템플릿 선택 후 프로그램 실행 버튼을 사용하세요."
        onClick={() => actions.goToBuilder()}
      />
      <DashboardMenuCard
        icon="🔐"
        title="직원 권한 관리"
        description="체육관 직원의 작업 권한 조정"
        onClick={actions.openStaffPermissions}
      />
      <DashboardMenuCard
        icon="👥"
        title="사용자 관리"
        description="gym_staff·video_creator 계정 관리"
        onClick={actions.openUserManagement}
      />
      <DashboardMenuCard
        icon="🌐"
        title="공용 신청·공유"
        description="템플릿 공용 라이브러리 신청 및 공유 링크"
        onClick={() => actions.goToBuilder()}
      />
      <DashboardMenuCard
        icon="💳"
        title="크레딧 충전/결제"
        description="체육관 크레딧 잔액 확인 및 충전 요청"
        badge="결제"
        onClick={actions.goToBilling}
      />
      <DashboardMenuCard
        icon="📅"
        title="주간 프로그램 스케줄"
        description="요일·시간별 운동 프로그램 배치"
        onClick={actions.goToProgramSchedule}
      />
    </DashboardHome>
  );
}
