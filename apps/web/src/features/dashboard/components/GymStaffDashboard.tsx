import type { DashboardViewProps } from '../dashboard.types';
import { DashboardHome } from './DashboardHome';
import { DashboardMenuCard } from './DashboardMenuCard';

export function GymStaffDashboard({ user, scopeLabel, permissions, actions }: DashboardViewProps) {
  const canAccessBuilder =
    permissions.canUploadVideos ||
    permissions.canCreateTemplates ||
    permissions.canEditTemplates;

  const hasAnyPermission =
    canAccessBuilder ||
    permissions.canSubmitPublicTemplates ||
    permissions.canDeleteTemplates;

  if (!hasAnyPermission) {
    return (
      <DashboardHome user={user} scopeLabel={scopeLabel} title="체육관직원 대시보드">
        <div className="dash-empty-state">
          <p>부여된 작업 권한이 없습니다. 체육관 관리자에게 문의하세요.</p>
        </div>
      </DashboardHome>
    );
  }

  return (
    <DashboardHome user={user} scopeLabel={scopeLabel} title="체육관직원 대시보드">
      {permissions.canUploadVideos ? (
        <DashboardMenuCard
          icon="🎬"
          title="영상 업로드·라이브러리"
          description="운동 영상 업로드 및 라이브러리 관리"
          badge="업로드"
          onClick={() => actions.goToBuilder({ panel: 'videos' })}
        />
      ) : null}
      {permissions.canCreateTemplates || permissions.canEditTemplates ? (
        <DashboardMenuCard
          icon="🛠"
          title="운동 프로그램 빌더"
          description="타임라인 구성 및 템플릿 편집"
          badge="빌더"
          onClick={() => actions.goToBuilder()}
        />
      ) : null}
      {permissions.canSubmitPublicTemplates ? (
        <DashboardMenuCard
          icon="🌐"
          title="공용 신청"
          description="템플릿을 공용 라이브러리에 신청할 수 있습니다."
          badge="공용"
          onClick={() => actions.goToBuilder()}
        />
      ) : null}
      {permissions.canDeleteTemplates ? (
        <DashboardMenuCard
          icon="🗑"
          title="템플릿 삭제"
          description="저장된 템플릿을 삭제할 수 있습니다."
          badge="삭제"
          onClick={() => actions.goToBuilder({ modal: 'templates' })}
        />
      ) : null}
      {canAccessBuilder ? (
        <DashboardMenuCard
          icon="▶"
          title="프로그램 실행 확인"
          description="저장한 프로그램 실행 화면 확인"
          hint="템플릿 저장 후 프로그램 실행 버튼을 사용하세요."
          onClick={() => actions.goToBuilder()}
        />
      ) : null}
    </DashboardHome>
  );
}
