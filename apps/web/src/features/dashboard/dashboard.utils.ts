import type { FightboxUserRole } from '@fightbox/shared';

export function buildBuilderUrl(params?: Record<string, string>): string {
  if (!params || Object.keys(params).length === 0) {
    return '/workout-program-builder';
  }
  const search = new URLSearchParams(params);
  return `/workout-program-builder?${search.toString()}`;
}

const ROLE_GREETING: Record<FightboxUserRole, string> = {
  super_admin: '슈퍼관리자',
  gym_admin: '체육관관리자',
  gym_staff: '체육관직원',
  video_creator: '크리에이터',
};

export function getRoleGreeting(role: FightboxUserRole): string {
  return ROLE_GREETING[role] ?? '사용자';
}

export function getDashboardTitle(role: FightboxUserRole): string {
  switch (role) {
    case 'super_admin':
      return 'FIGHTBOX 관리자 대시보드';
    case 'gym_admin':
      return '체육관관리자 대시보드';
    case 'gym_staff':
      return '체육관직원 대시보드';
    case 'video_creator':
      return '운동영상 크리에이터 대시보드';
    default:
      return '대시보드';
  }
}
