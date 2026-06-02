export interface StudentDashboardData {
  firstName: string;
  institutionName: string;
  totalPoints: number;
  rank: number;
  registeredEventsCount: number;
  achievementCount: number;
  joinedClubsCount: number;
  upcomingEvents: EventRecord[];
  joinedClubs: ClubRecord[];
  achievements: any[];
}

export interface EventRecord {
  title: string;
  institution: string;
  dateTime: string;
  type: string;
}

export interface ClubRecord {
  name: string;
  memberCount: number;
  category: string;
}