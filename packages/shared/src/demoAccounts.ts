import type { FightboxSessionUser, FightboxStaffPermissions } from './authContext.js';

/**
 * 개발/테스트 전용 데모 로그인 계정입니다.
 * 운영 환경에서 사용하지 마세요. 비밀번호는 DB에 저장하지 않으며,
 * 추후 JWT/session + password hash 인증으로 교체할 예정입니다.
 */
export interface DemoAccount {
  loginId: string;
  password: string;
  user: FightboxSessionUser;
}

const GYM_STAFF_PERMISSIONS: Partial<FightboxStaffPermissions> = {
  canUploadVideos: true,
  canManageVideos: false,
  canCreateTemplates: true,
  canEditTemplates: true,
  canDeleteTemplates: false,
  canSubmitPublicTemplates: true,
};

export const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    loginId: 'superadmin',
    password: '123456!!',
    user: {
      loginId: 'superadmin',
      userId: 'demo-super-admin',
      gymId: 'demo-gym',
      role: 'super_admin',
      displayName: '슈퍼관리자',
      accountScope: 'platform',
    },
  },
  {
    loginId: 'gymadmin',
    password: '123456!!',
    user: {
      loginId: 'gymadmin',
      userId: 'demo-gym-admin',
      gymId: 'demo-gym',
      role: 'gym_admin',
      displayName: '체육관관리자',
      accountScope: 'gym',
      gymCode: 'DEMO-GYM',
      gymName: '데모 체육관',
    },
  },
  {
    loginId: 'gymstaff',
    password: '123456!!',
    user: {
      loginId: 'gymstaff',
      userId: 'demo-staff-001',
      gymId: 'demo-gym',
      role: 'gym_staff',
      displayName: '체육관직원',
      accountScope: 'gym',
      gymCode: 'DEMO-GYM',
      gymName: '데모 체육관',
      staffPermissions: GYM_STAFF_PERMISSIONS,
    },
  },
  {
    loginId: 'creator',
    password: '123456!!',
    user: {
      loginId: 'creator',
      userId: 'demo-video-creator',
      role: 'video_creator',
      displayName: '운동영상 크리에이터',
      accountScope: 'creator',
      creatorId: 'demo-creator-001',
      creatorCode: 'CREATOR-DEMO',
      creatorName: '데모 영상 크리에이터',
    },
  },
];
