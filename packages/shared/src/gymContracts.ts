export type GymStatus = 'active' | 'suspended' | 'archived';

export interface GymDto {
  id: string;
  gymCode: string;
  name: string;
  ownerName: string;
  phone: string;
  address: string;
  memo: string;
  status: GymStatus;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateGymRequest {
  gymCode: string;
  name: string;
  ownerName?: string;
  phone?: string;
  address?: string;
  memo?: string;
  status?: GymStatus;
}

export interface UpdateGymRequest {
  gymCode?: string;
  name?: string;
  ownerName?: string;
  phone?: string;
  address?: string;
  memo?: string;
  status?: GymStatus;
}

export const GYM_API_PATHS = {
  gyms: '/api/admin/gyms',
} as const;

export interface GymListResponse {
  data: GymDto[];
}

export interface GymItemResponse {
  data: GymDto;
}
