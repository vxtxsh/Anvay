export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  role: string;
  name: string;
  userId: number;
  institutionId: number;
  leadingClubId?: number;
  studentIdNumber?: string;
}

export interface RegisterStudentRequest {
  name: string;
  email: string;
  password: string;
  institutionId?: number;
  studentIdNumber?: string;
}

export interface RegisterInstitutionRequest {
  institutionName: string;
  adminName: string;
  email: string;
  password: string;
  address?: string;
}
