import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth.service';

interface InstitutionDto {
  institutionId: number;
  institutionName: string;
  email: string;
  phone: string;
  address: string;
  status: string;
  registeredAt: string;
  studentCount: number;
  eventCount: number;
  clubCount: number;
  totalPoints: number;
}

interface DashboardStats {
  totalColleges: number;
  activeColleges: number;
  pendingColleges: number;
  inactiveColleges: number;
  totalEvents: number;
  totalClubs: number;
  totalStudents: number;
  topColleges: InstitutionDto[];
  eventTrendsByMonth: Record<string, number>;
}

interface AnalyticsDto {
  totalUsers: number;
  totalStudents: number;
  totalInstitutions: number;
  totalEvents: number;
  totalClubs: number;
  totalPayments: number;
  totalRevenue: number;
  institutionRankings: InstitutionDto[];
}

interface Event {
  eventId: number;
  eventName: string;
  description: string;
  category: string;
  location: string;
  startDate: string;
  endDate: string;
  status: string;
  maxParticipants: number;
}

interface WinnersApproval {
  eventId: number;
  eventName: string;
  institutionName: string;
  winner1UserId: number | null;
  winner1Name: string | null;
  winner2UserId: number | null;
  winner2Name: string | null;
  winner3UserId: number | null;
  winner3Name: string | null;
}

interface Club {
  clubId: number;
  clubName: string;
  type: string;
  membersCount: number;
  joinRequestsCount: number;
  createdDate: string;
}

@Component({
  selector: 'app-super-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './super-admin.component.html',
  styleUrls: ['./super-admin.component.css']
})
export class SuperAdminComponent implements OnInit {
  private readonly API = '/api/super-admin';

  activeView: 'dashboard' | 'colleges' | 'events' | 'analytics' | 'approvals' | 'settings' = 'dashboard';
  adminName = '';
  sidebarOpen = true;

  stats: DashboardStats | null = null;
  dashboardLoading = false;

  institutions: InstitutionDto[] = [];
  searchQuery = '';
  collegesLoading = false;

  analytics: AnalyticsDto | null = null;
  analyticsLoading = false;

  selectedInstitution: InstitutionDto | null = null;
  institutionEvents: Event[] = [];
  institutionClubs: Club[] = [];
  institutionDetailTab: 'events' | 'clubs' = 'events';
  institutionDetailLoading = false;

  actionMessage = '';
  actionError = '';

  approveModal = false;
  approveVerified = false;
  pendingApproveId: number | null = null;

  pendingWinners: WinnersApproval[] = [];
  pendingWinnersLoading = false;

  allEvents: Event[] = [];
  allEventsLoading = false;
  eventsSearch = '';
  eventsFilterCategory = '';
  eventsFilterDateFrom = '';
  eventsFilterDateTo = '';
  eventsFilterStatus = '';

  // Notifications
  showNotifDropdown = false;
  notifications: {text: string; type: 'info'|'warn'|'success'; link?: string}[] = [];

  // Profile dropdown
  showProfileMenu = false;

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    this.adminName = user?.name ?? 'Super Admin';
    this.loadPendingWinners();
    this.route.queryParams.subscribe(params => {
      const v = (params['view'] || 'dashboard') as 'dashboard'|'colleges'|'events'|'analytics'|'approvals'|'settings';
      this.applyView(v);
    });
  }

  setView(view: 'dashboard' | 'colleges' | 'events' | 'analytics' | 'approvals' | 'settings'): void {
    this.router.navigate([], { queryParams: { view }, replaceUrl: false });
  }

  private applyView(view: 'dashboard' | 'colleges' | 'events' | 'analytics' | 'approvals' | 'settings'): void {
    this.activeView = view;
    this.clearMessages();
    this.selectedInstitution = null;
    if (view === 'dashboard') this.loadDashboard();
    if (view === 'colleges') this.loadColleges();
    if (view === 'events') this.loadAllEvents();
    if (view === 'analytics') this.loadAnalytics();
    if (view === 'approvals') this.loadPendingWinners();
  }

  loadAllEvents(): void {
    this.allEventsLoading = true;
    this.http.get<Event[]>('/api/events/').subscribe({
      next: d => { this.allEvents = d; this.allEventsLoading = false; },
      error: () => { this.allEventsLoading = false; }
    });
  }

  get availableEventCategories(): string[] {
    const cats = this.allEvents.map(e => e.category).filter(Boolean);
    return [...new Set(cats)];
  }

  get filteredAllEvents(): Event[] {
    const q = this.eventsSearch.toLowerCase();
    const now = new Date();
    return this.allEvents.filter(e => {
      const matchQ = !q || e.eventName?.toLowerCase().includes(q) || e.category?.toLowerCase().includes(q) || e.location?.toLowerCase().includes(q);
      const matchCat = !this.eventsFilterCategory || e.category === this.eventsFilterCategory;
      const matchFrom = !this.eventsFilterDateFrom || (e.startDate && new Date(e.startDate) >= new Date(this.eventsFilterDateFrom));
      const matchTo = !this.eventsFilterDateTo || (e.startDate && new Date(e.startDate) <= new Date(this.eventsFilterDateTo + 'T23:59:59'));
      let matchStatus = true;
      if (this.eventsFilterStatus === 'ended') {
        matchStatus = e.status === 'ended' || (!!e.endDate && new Date(e.endDate) < now);
      } else if (this.eventsFilterStatus === 'active') {
        const start = e.startDate ? new Date(e.startDate) : null;
        const end = e.endDate ? new Date(e.endDate) : null;
        matchStatus = e.status !== 'ended' && !!start && start <= now && (!end || end >= now);
      } else if (this.eventsFilterStatus === 'upcoming') {
        matchStatus = e.status !== 'ended' && !!e.startDate && new Date(e.startDate) > now;
      }
      return matchQ && matchCat && matchFrom && matchTo && matchStatus;
    });
  }

  clearEventFilters(): void {
    this.eventsSearch = '';
    this.eventsFilterCategory = '';
    this.eventsFilterDateFrom = '';
    this.eventsFilterDateTo = '';
    this.eventsFilterStatus = '';
  }

  get upcomingEventsAdmin(): Event[] {
    const now = new Date();
    return this.filteredAllEvents.filter(e => e.startDate && new Date(e.startDate) > now && e.status !== 'ended');
  }

  get currentEventsAdmin(): Event[] {
    const now = new Date();
    return this.filteredAllEvents.filter(e => {
      const start = e.startDate ? new Date(e.startDate) : null;
      const end   = e.endDate   ? new Date(e.endDate)   : null;
      if (!start) return false;
      return start <= now && (!end || end >= now) && e.status !== 'ended';
    });
  }

  get pastEventsAdmin(): Event[] {
    const now = new Date();
    return this.filteredAllEvents.filter(e => e.status === 'ended' || (e.endDate && new Date(e.endDate) < now));
  }

  loadPendingWinners(): void {
    this.pendingWinnersLoading = true;
    this.http.get<WinnersApproval[]>('/api/events/pending-winners').subscribe({
      next: d => { this.pendingWinners = d; this.pendingWinnersLoading = false; },
      error: () => { this.pendingWinnersLoading = false; }
    });
  }

  approveEventWinners(eventId: number): void {
    this.http.post(`/api/events/${eventId}/approve-winners`, {}).subscribe({
      next: () => { this.actionMessage = 'Winners approved and points awarded!'; this.loadPendingWinners(); },
      error: () => { this.actionError = 'Failed to approve winners.'; }
    });
  }

  loadDashboard(): void {
    this.dashboardLoading = true;
    this.http.get<DashboardStats>(`${this.API}/dashboard`).subscribe({
      next: (data) => { this.stats = data; this.dashboardLoading = false; },
      error: () => { this.dashboardLoading = false; }
    });
  }

  loadColleges(): void {
    this.collegesLoading = true;
    const url = this.searchQuery
      ? `${this.API}/institutions?search=${encodeURIComponent(this.searchQuery)}`
      : `${this.API}/institutions`;
    this.http.get<InstitutionDto[]>(url).subscribe({
      next: (data) => { this.institutions = data; this.collegesLoading = false; },
      error: () => { this.collegesLoading = false; }
    });
  }

  onSearch(): void { this.loadColleges(); }

  loadAnalytics(): void {
    this.analyticsLoading = true;
    this.http.get<AnalyticsDto>(`${this.API}/analytics`).subscribe({
      next: (data) => { this.analytics = data; this.analyticsLoading = false; },
      error: () => { this.analyticsLoading = false; }
    });
  }

  viewInstitutionDetail(inst: InstitutionDto): void {
    this.selectedInstitution = inst;
    this.institutionDetailTab = 'events';
    this.loadInstitutionEvents(inst.institutionId);
  }

  loadInstitutionEvents(id: number): void {
    this.institutionDetailLoading = true;
    this.http.get<Event[]>(`${this.API}/institutions/${id}/events`).subscribe({
      next: (data) => { this.institutionEvents = data; this.institutionDetailLoading = false; },
      error: () => { this.institutionDetailLoading = false; this.institutionEvents = []; }
    });
  }

  loadInstitutionClubs(id: number): void {
    this.institutionDetailLoading = true;
    this.http.get<Club[]>(`${this.API}/institutions/${id}/clubs`).subscribe({
      next: (data) => { this.institutionClubs = data; this.institutionDetailLoading = false; },
      error: () => { this.institutionDetailLoading = false; this.institutionClubs = []; }
    });
  }

  switchInstitutionTab(tab: 'events' | 'clubs'): void {
    this.institutionDetailTab = tab;
    if (tab === 'events') this.loadInstitutionEvents(this.selectedInstitution!.institutionId);
    if (tab === 'clubs') this.loadInstitutionClubs(this.selectedInstitution!.institutionId);
  }

  openApproveModal(id: number): void {
    this.pendingApproveId = id;
    this.approveVerified = false;
    this.approveModal = true;
  }

  confirmApprove(): void {
    if (!this.approveVerified || !this.pendingApproveId) return;
    this.clearMessages();
    this.http.put<InstitutionDto>(`${this.API}/institutions/${this.pendingApproveId}/approve`, {}).subscribe({
      next: (updated) => { this.updateList(updated); this.actionMessage = 'Institution approved!'; this.approveModal = false; },
      error: () => { this.actionError = 'Failed to approve.'; this.approveModal = false; }
    });
  }

  approveInstitution(id: number): void { this.openApproveModal(id); }

  deactivateInstitution(id: number): void {
    this.clearMessages();
    this.http.put<InstitutionDto>(`${this.API}/institutions/${id}/deactivate`, {}).subscribe({
      next: (updated) => { this.updateList(updated); this.actionMessage = 'Institution deactivated.'; },
      error: () => { this.actionError = 'Failed to deactivate.'; }
    });
  }

  private updateList(updated: InstitutionDto): void {
    const idx = this.institutions.findIndex(i => i.institutionId === updated.institutionId);
    if (idx !== -1) this.institutions[idx] = updated;
    if (this.selectedInstitution?.institutionId === updated.institutionId) {
      this.selectedInstitution = updated;
    }
  }

  getTrendEntries(): { month: string; count: number; pct: number }[] {
    if (!this.stats?.eventTrendsByMonth) return [];
    const entries = Object.entries(this.stats.eventTrendsByMonth);
    const max = Math.max(...entries.map(([, v]) => v)) || 1;
    return entries.map(([month, count]) => ({ month, count, pct: Math.round((count / max) * 100) }));
  }

  getStatusClass(status: string): string {
    const m: Record<string, string> = { active: 'badge-active', pending: 'badge-pending', inactive: 'badge-inactive' };
    return m[status] ?? 'badge-pending';
  }

  getRankLabel(i: number): string {
    return i === 0 ? '1st' : i === 1 ? '2nd' : i === 2 ? '3rd' : `#${i + 1}`;
  }

  toggleNotifications(): void {
    this.showNotifDropdown = !this.showNotifDropdown;
    if (this.showNotifDropdown) this.buildNotifications();
  }

  buildNotifications(): void {
    this.notifications = [];
    const pendingColleges = this.institutions.filter(i => i.status === 'pending').length;
    if (pendingColleges > 0) this.notifications.push({ text: `${pendingColleges} institution${pendingColleges > 1 ? 's' : ''} awaiting approval`, type: 'warn', link: 'colleges' });
    const pendingWinnersCount = this.pendingWinners.length;
    if (pendingWinnersCount > 0) this.notifications.push({ text: `${pendingWinnersCount} event winner submission${pendingWinnersCount > 1 ? 's' : ''} awaiting review`, type: 'info', link: 'approvals' });
    if (this.notifications.length === 0) this.notifications.push({ text: 'No new notifications', type: 'success' });
  }

  navigateFromNotif(link?: string): void {
    this.showNotifDropdown = false;
    if (link) this.setView(link as any);
  }

  toggleProfileMenu(): void {
    this.showProfileMenu = !this.showProfileMenu;
    this.showNotifDropdown = false;
  }

  get totalNotifCount(): number {
    return this.institutions.filter(i => i.status === 'pending').length + this.pendingWinners.length;
  }

  logout(): void { this.authService.logout(); this.router.navigate(['/login']); }

  private clearMessages(): void { this.actionMessage = ''; this.actionError = ''; }
}
