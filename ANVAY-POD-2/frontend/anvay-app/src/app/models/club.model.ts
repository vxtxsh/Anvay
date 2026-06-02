export interface LeadershipApplication {
  applicationId: number;
  clubId: number;
  userId: number;
  status: string;
  reason: string;
  // Add these nested objects to match your Java Entity
  user?: {
    firstName: string;
    lastName: string;
    email?: string;
  };
  club?: {
    clubName: string;
    category?: string;
  };
}

export interface ClubDashboardDTO {
  clubId: number;
  clubName: string;
  type: string;
  membersCount: number;
  joinRequestsCount: number;
  leadershipAppsCount: number;
  createdDate: string;
}