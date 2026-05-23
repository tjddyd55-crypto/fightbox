import type { DashboardViewProps } from '../dashboard.types';
import { DashboardHome } from './DashboardHome';
import { DashboardMenuCard } from './DashboardMenuCard';

export function SuperAdminDashboard({ user, scopeLabel, actions }: DashboardViewProps) {
  return (
    <DashboardHome
      user={user}
      scopeLabel={scopeLabel}
      title="FIGHTBOX 관리자 대시보드"
      subtitle="전체 플랫폼 운영 및 관리 기능"
    >
      <DashboardMenuCard
        icon="👥"
        title="사용자 관리"
        description="계정 생성, 비활성화, 역할 관리"
        badge="관리자"
        onClick={actions.openUserManagement}
      />
      <DashboardMenuCard
        icon="🏢"
        title="체육관 관리"
        description="체육관 계정·지점 관리 (예정)"
        badge="준비 중"
        disabled
      />
      <DashboardMenuCard
        icon="🛠"
        title="운동 프로그램 빌더"
        description="영상 등록, 타임라인 구성, 템플릿 저장"
        onClick={() => actions.goToBuilder()}
      />
      <DashboardMenuCard
        icon="▶"
        title="프로그램 실행 화면"
        description="저장한 프로그램을 대형 모니터에서 실행"
        hint="템플릿 선택 후 프로그램 실행 버튼을 사용하세요."
        onClick={() => actions.goToBuilder()}
      />
      <DashboardMenuCard
        icon="📚"
        title="공용 라이브러리 승인"
        description="제출된 공용 템플릿 승인·반려"
        badge="승인"
        onClick={() => actions.goToBuilder({ modal: 'templates', tab: 'pending' })}
      />
      <DashboardMenuCard
        icon="📋"
        title="로그인 감사 로그"
        description="로그인 성공·실패·차단 기록 확인"
        badge="감사"
        onClick={actions.openAuthAuditLogs}
      />
      <DashboardMenuCard
        icon="🔐"
        title="직원 권한 관리"
        description="체육관 직원 권한 조정"
        onClick={actions.openStaffPermissions}
      />
      <DashboardMenuCard
        icon="💳"
        title="결제/크레딧 관리"
        description="체육관 크레딧 지갑 조회, 수동 지급/차감, 결제 내역"
        badge="결제"
        onClick={actions.goToBilling}
      />
    </DashboardHome>
  );
}
