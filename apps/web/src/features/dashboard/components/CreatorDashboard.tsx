import type { DashboardViewProps } from '../dashboard.types';
import { DashboardHome } from './DashboardHome';
import { DashboardMenuCard } from './DashboardMenuCard';

export function CreatorDashboard({ user, scopeLabel, actions }: DashboardViewProps) {
  return (
    <DashboardHome
      user={user}
      scopeLabel={scopeLabel}
      title="운동영상 크리에이터 대시보드"
      subtitle="영상 등록 및 템플릿 구성"
    >
      <DashboardMenuCard
        icon="🎬"
        title="영상 등록"
        description="운동 영상 업로드 및 메타데이터 관리"
        onClick={() => actions.goToBuilder({ panel: 'videos' })}
      />
      <DashboardMenuCard
        icon="🛠"
        title="운동 템플릿 세팅"
        description="타임라인 구성 및 프로그램 템플릿 저장"
        onClick={() => actions.goToBuilder()}
      />
      <DashboardMenuCard
        icon="▶"
        title="프로그램 실행 확인"
        description="저장한 프로그램 실행 화면 확인"
        hint="템플릿 저장 후 프로그램 실행 버튼을 사용하세요."
        onClick={() => actions.goToBuilder()}
      />
    </DashboardHome>
  );
}
