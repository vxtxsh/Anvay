import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth.service';

interface StudentDashboard {
  firstName: string; institutionName: string; totalPoints: number; rank: number;
  registeredEventsCount: number; joinedClubsCount: number; achievementCount: number;
  upcomingEvents: EventRecord[]; joinedClubs: ClubRecord[]; achievements: AchievementRecord[];
}
interface EventRecord { title: string; institution: string; dateTime: string; type: string; }
interface ClubRecord { name: string; memberCount: number; category: string; }
interface AchievementRecord { title: string; year: string; badgeType: string; }
interface EventFeed {
  eventId: number; title: string; location: string; institution: string; institutionId: number;
  type: string; participantType: string; registeredCount: number; totalCapacity: number;
  isRegistered: boolean; startDate?: string; endDate?: string; status?: string; hasWinners?: boolean;
  imageData?: string; registrationDeadline?: string;
}
interface Club { clubId: number; clubName: string; category: string; type: string; membersCount: number; memberCount: number; institutionId: number; }
interface LeadershipApp { applicationId: number; clubId: number; status: string; }
interface LeaderboardUser { userId: number; firstName: string; lastName: string; email: string; totalPoints: number; joinedClubsCount: number; registeredEventsCount: number; }
interface InstitutionRank { institutionId: number; institutionName: string; totalPoints: number; studentCount: number; eventCount: number; }
interface UserProfile { userId: number; firstName: string; lastName: string; email: string; totalPoints: number; rank: number; registeredEventsCount: number; joinedClubsCount: number; role: string; studentIdNumber?: string; }

@Component({
  selector: 'app-student',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './student.component.html',
  styleUrls: ['./student.component.css']
})
export class StudentComponent implements OnInit, OnDestroy {
  activeView: 'dashboard' | 'events' | 'clubs' | 'leaderboard' | 'profile' = 'dashboard';
  sidebarOpen = true;
  studentId: number = 0;
  institutionId: number = 0;

  dashboard: StudentDashboard | null = null;
  dashLoading = false;

  // Events
  events: EventFeed[] = [];
  eventsLoading = false;
  searchEvent = '';
  searchSuggestions: string[] = [];
  showSuggestions = false;
  eventTab: 'feed' | 'registered' = 'feed';
  myRegistrations: EventFeed[] = [];
  myRegistrationsLoading = false;

  // Filters
  filterCategory = '';
  filterDateFrom = '';
  filterDateTo = '';
  get availableCategories(): string[] {
    const cats = this.events.map(e => e.type).filter(Boolean);
    return [...new Set(cats)];
  }

  // Wishlist
  wishlist: number[] = [];

  // Carousel
  carouselIndex = 0;
  carouselInterval: any = null;
  hoveredCarouselEvent: EventFeed | null = null;

  // Clubs
  allClubs: Club[] = [];
  myApprovedClubIds: number[] = [];
  myPendingClubIds: number[] = [];
  myLeadershipClubIds: number[] = [];
  clubsLoading = false;

  // Leadership modal
  showLeadershipModal = false;
  leadershipClubId: number | null = null;
  leadershipClubName = '';
  leadershipExperience = '';
  leadershipLoading = false;

  // Leaderboard
  leaderboard: LeaderboardUser[] = [];
  lbLoading = false;
  globalLeaderboard: LeaderboardUser[] = [];
  globalLbLoading = false;
  lbTab: 'institution' | 'global' | 'colleges' = 'institution';
  collegeLb: InstitutionRank[] = [];
  collegeLbLoading = false;

  profile: UserProfile | null = null;
  profileLoading = false;

  // Profile picture
  profilePicture = '';

  // Profile dropdown
  showProfileMenu = false;

  // Notifications
  showNotifDropdown = false;
  notifications: {text: string; type: 'info'|'warn'|'success'; link?: string}[] = [];

  message = ''; messageType = '';

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    const user = this.authService.getCurrentUser();
    this.studentId = user?.userId ?? 0;
    this.institutionId = user?.institutionId ?? 0;
    this.wishlist = JSON.parse(localStorage.getItem(`wishlist_${this.studentId}`) || '[]');
    this.profilePicture = localStorage.getItem(`profilePic_${this.studentId}`) || '';
    this.route.queryParams.subscribe(params => {
      const v = (params['view'] || 'dashboard') as 'dashboard'|'events'|'clubs'|'leaderboard'|'profile';
      this.applyView(v);
    });
  }

  ngOnDestroy() {
    if (this.carouselInterval) clearInterval(this.carouselInterval);
  }

  setView(v: 'dashboard'|'events'|'clubs'|'leaderboard'|'profile') {
    this.router.navigate([], { queryParams: { view: v }, replaceUrl: false });
  }

  private applyView(v: 'dashboard'|'events'|'clubs'|'leaderboard'|'profile') {
    this.activeView = v; this.message = '';
    if (v === 'dashboard') this.loadDashboard();
    if (v === 'events') this.loadEvents();
    if (v === 'clubs') this.loadClubs();
    if (v === 'leaderboard') this.loadLeaderboard();
    if (v === 'profile') this.loadProfile();
  }

  loadDashboard() {
    if (!this.studentId) return;
    this.dashLoading = true;
    this.http.get<StudentDashboard>(`/api/students/${this.studentId}/dashboard`).subscribe({
      next: d => { this.dashboard = d; this.dashLoading = false; },
      error: () => this.dashLoading = false
    });
  }

  // ── EVENTS ──
  switchEventTab(tab: 'feed' | 'registered') {
    this.eventTab = tab;
    if (tab === 'registered' && this.myRegistrations.length === 0) this.loadMyRegistrations();
  }

  loadEvents() {
    this.eventsLoading = true;
    this.http.get<EventFeed[]>(`/api/events/feed?userId=${this.studentId}&institutionId=${this.institutionId}`).subscribe({
      next: e => {
        this.events = e;
        this.eventsLoading = false;
        this.startCarousel();
      },
      error: () => this.eventsLoading = false
    });
  }

  loadMyRegistrations() {
    this.myRegistrationsLoading = true;
    this.http.get<EventFeed[]>(`/api/events/my-registrations?userId=${this.studentId}`).subscribe({
      next: e => { this.myRegistrations = e; this.myRegistrationsLoading = false; },
      error: () => this.myRegistrationsLoading = false
    });
  }

  get filteredEvents() {
    const q = this.searchEvent.toLowerCase();
    return this.events.filter(e => {
      const matchQ = !q || e.title.toLowerCase().includes(q) || e.institution?.toLowerCase().includes(q) || e.type?.toLowerCase().includes(q);
      const matchCat = !this.filterCategory || e.type === this.filterCategory;
      const matchFrom = !this.filterDateFrom || (e.startDate && new Date(e.startDate) >= new Date(this.filterDateFrom));
      const matchTo = !this.filterDateTo || (e.startDate && new Date(e.startDate) <= new Date(this.filterDateTo));
      return matchQ && matchCat && matchFrom && matchTo;
    });
  }

  get upcomingEvents() {
    const now = new Date();
    return this.filteredEvents.filter(e => e.startDate && new Date(e.startDate) > now && e.status !== 'ended');
  }

  get currentEvents() {
    const now = new Date();
    return this.filteredEvents.filter(e => {
      const start = e.startDate ? new Date(e.startDate) : null;
      const end = e.endDate ? new Date(e.endDate) : null;
      if (!start) return false;
      if (start <= now && (!end || end >= now) && e.status !== 'ended') return true;
      return false;
    });
  }

  get pastEvents() {
    const now = new Date();
    return this.filteredEvents.filter(e => {
      if (e.status === 'ended') return true;
      if (e.endDate && new Date(e.endDate) < now) return true;
      return false;
    });
  }

  get featuredEvents(): EventFeed[] {
    const evs = this.events.filter(e => e.status !== 'ended' && e.startDate && new Date(e.startDate) > new Date());
    return evs.slice(0, 6);
  }

  private get carouselMax(): number { return Math.max(0, this.featuredEvents.length - 4); }

  startCarousel() {
    if (this.carouselInterval) clearInterval(this.carouselInterval);
    if (this.featuredEvents.length > 4) {
      this.carouselInterval = setInterval(() => {
        this.carouselIndex = this.carouselIndex >= this.carouselMax ? 0 : this.carouselIndex + 1;
        this.cdr.detectChanges();
      }, 3500);
    }
  }

  prevCarousel() {
    this.carouselIndex = this.carouselIndex > 0 ? this.carouselIndex - 1 : this.carouselMax;
  }

  nextCarousel() {
    this.carouselIndex = this.carouselIndex < this.carouselMax ? this.carouselIndex + 1 : 0;
  }

  onSearchInput() {
    const q = this.searchEvent.toLowerCase().trim();
    if (!q) { this.searchSuggestions = []; this.showSuggestions = false; return; }
    this.searchSuggestions = this.events
      .map(e => e.title)
      .filter(t => t.toLowerCase().includes(q))
      .slice(0, 6);
    this.showSuggestions = this.searchSuggestions.length > 0;
  }

  selectSuggestion(s: string) {
    this.searchEvent = s;
    this.showSuggestions = false;
    this.searchSuggestions = [];
  }

  clearFilters() {
    this.filterCategory = '';
    this.filterDateFrom = '';
    this.filterDateTo = '';
    this.searchEvent = '';
    this.showSuggestions = false;
  }

  registerEvent(eventId: number) {
    this.http.post('/api/events/register', { eventId, userId: this.studentId }).subscribe({
      next: () => {
        this.showMessage('Registered successfully!', 'success');
        const ev = this.events.find(e => e.eventId === eventId);
        if (ev) { ev.isRegistered = true; ev.registeredCount = (ev.registeredCount || 0) + 1; }
      },
      error: () => this.showMessage('Registration failed', 'error')
    });
  }

  isEventOpen(ev: EventFeed): boolean {
    if (ev.status === 'ended') return false;
    if (ev.endDate && new Date(ev.endDate) < new Date()) return false;
    if (ev.registrationDeadline && new Date(ev.registrationDeadline) < new Date()) return false;
    return true;
  }

  isDeadlinePassed(ev: EventFeed): boolean {
    return !!(ev.registrationDeadline && new Date(ev.registrationDeadline) < new Date()
      && ev.endDate && new Date(ev.endDate) >= new Date());
  }

  // Wishlist
  isWishlisted(eventId: number): boolean {
    return this.wishlist.includes(eventId);
  }

  toggleWishlist(eventId: number) {
    if (this.isWishlisted(eventId)) {
      this.wishlist = this.wishlist.filter(id => id !== eventId);
    } else {
      this.wishlist.push(eventId);
    }
    localStorage.setItem(`wishlist_${this.studentId}`, JSON.stringify(this.wishlist));
  }

  // ── CLUBS ──
  loadClubs() {
    this.clubsLoading = true;
    this.http.get<any[]>(`/api/clubs/user/${this.studentId}`).subscribe({
      next: memberships => {
        this.myApprovedClubIds = memberships.filter(m => m.status === 'APPROVED').map(m => m.clubId);
        this.myPendingClubIds = memberships.filter(m => m.status === 'PENDING').map(m => m.clubId);
      },
      error: () => {}
    });
    this.http.get<Club[]>(`/api/clubs/institution/${this.institutionId}`).subscribe({
      next: c => { this.allClubs = c; this.clubsLoading = false; },
      error: () => this.clubsLoading = false
    });
    this.loadMyLeadershipApps();
  }

  loadMyLeadershipApps() {
    this.http.get<any[]>(`/api/leadership-applications/user/${this.studentId}`).subscribe({
      next: apps => { this.myLeadershipClubIds = apps.map(a => a.clubId); },
      error: () => {}
    });
  }

  joinClub(clubId: number) {
    this.http.post(`/api/clubs/${clubId}/join`, { userId: this.studentId }).subscribe({
      next: () => { this.showMessage('Join request sent!', 'success'); this.myPendingClubIds.push(clubId); },
      error: (e) => this.showMessage(e.error?.message || 'Request already sent', 'error')
    });
  }

  isApproved(clubId: number) { return this.myApprovedClubIds.includes(clubId); }
  isPending(clubId: number) { return this.myPendingClubIds.includes(clubId); }
  hasAppliedLeadership(clubId: number) { return this.myLeadershipClubIds.includes(clubId); }

  openLeadershipModal(clubId: number, clubName: string) {
    this.leadershipClubId = clubId;
    this.leadershipClubName = clubName;
    this.leadershipExperience = '';
    this.showLeadershipModal = true;
  }

  submitLeadership() {
    if (!this.leadershipExperience.trim()) { this.showMessage('Please describe your experience', 'error'); return; }
    this.leadershipLoading = true;
    this.http.post('/api/leadership-applications', { clubId: this.leadershipClubId, userId: this.studentId, experience: this.leadershipExperience }).subscribe({
      next: () => {
        this.showMessage('Leadership application submitted!', 'success');
        if (this.leadershipClubId) this.myLeadershipClubIds.push(this.leadershipClubId);
        this.showLeadershipModal = false;
        this.leadershipLoading = false;
      },
      error: () => { this.showMessage('Failed to apply', 'error'); this.leadershipLoading = false; }
    });
  }

  // ── LEADERBOARD ──
  loadLeaderboard() {
    this.lbLoading = true;
    const url = this.institutionId ? `/api/students/institution/${this.institutionId}/leaderboard` : '/api/students/leaderboard';
    this.http.get<LeaderboardUser[]>(url).subscribe({
      next: l => { this.leaderboard = l.sort((a,b) => (b.totalPoints||0) - (a.totalPoints||0)); this.lbLoading = false; },
      error: () => this.lbLoading = false
    });
    this.loadGlobalLeaderboard();
    this.loadCollegeLeaderboard();
  }

  loadGlobalLeaderboard() {
    this.globalLbLoading = true;
    this.http.get<LeaderboardUser[]>('/api/students/leaderboard').subscribe({
      next: l => { this.globalLeaderboard = l.sort((a,b) => (b.totalPoints||0) - (a.totalPoints||0)); this.globalLbLoading = false; },
      error: () => this.globalLbLoading = false
    });
  }

  loadCollegeLeaderboard() {
    this.collegeLbLoading = true;
    this.http.get<InstitutionRank[]>('/api/institutions/leaderboard').subscribe({
      next: d => { this.collegeLb = d; this.collegeLbLoading = false; },
      error: () => this.collegeLbLoading = false
    });
  }

  switchLbTab(tab: 'institution' | 'global' | 'colleges') { this.lbTab = tab; }

  get myRankInInstitution(): number {
    const idx = this.leaderboard.findIndex(u => u.userId === this.studentId);
    return idx >= 0 ? idx + 1 : 0;
  }

  // ── PROFILE ──
  loadProfile() {
    if (!this.studentId) return;
    this.profileLoading = true;
    this.http.get<UserProfile>(`/api/students/${this.studentId}/profile`).subscribe({
      next: p => { this.profile = p; this.profileLoading = false; },
      error: () => this.profileLoading = false
    });
    if (this.leaderboard.length === 0) this.loadLeaderboard();
    // Chart reads from this.events — ensure it's populated regardless of nav order
    if (this.events.length === 0) this.loadEvents();
  }

  get profileRank(): number | string {
    const idx = this.leaderboard.findIndex(u => u.userId === this.studentId);
    return idx >= 0 ? idx + 1 : (this.profile?.rank || '–');
  }

  onProfilePicSelected(event: any) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e: any) => {
      this.profilePicture = e.target.result;
      localStorage.setItem(`profilePic_${this.studentId}`, this.profilePicture);
    };
    reader.readAsDataURL(file);
  }

  removeProfilePic() {
    this.profilePicture = '';
    localStorage.removeItem(`profilePic_${this.studentId}`);
  }

  // Trend chart data
  get eventTrendData(): { label: string; value: number }[] {
    const months: Record<string, number> = {};
    this.events.forEach(e => {
      if (e.startDate) {
        const d = new Date(e.startDate);
        const key = d.toLocaleString('default', { month: 'short', year: '2-digit' });
        months[key] = (months[key] || 0) + 1;
      }
    });
    return Object.entries(months).map(([label, value]) => ({ label, value })).slice(-8);
  }

  get chartPoints(): string {
    const data = this.eventTrendData;
    if (!data.length) return '';
    const W = 480, H = 120, pad = 30;
    const maxV = Math.max(...data.map(d => d.value), 1);
    return data.map((d, i) => {
      const x = pad + (i / Math.max(data.length - 1, 1)) * (W - pad * 2);
      const y = H - pad - ((d.value / maxV) * (H - pad * 2));
      return `${x},${y}`;
    }).join(' ');
  }

  get chartDots(): { x: number; y: number; value: number; label: string }[] {
    const data = this.eventTrendData;
    if (!data.length) return [];
    const W = 480, H = 120, pad = 30;
    const maxV = Math.max(...data.map(d => d.value), 1);
    return data.map((d, i) => ({
      x: pad + (i / Math.max(data.length - 1, 1)) * (W - pad * 2),
      y: H - pad - ((d.value / maxV) * (H - pad * 2)),
      value: d.value,
      label: d.label
    }));
  }

  // Notifications
  toggleNotifications() {
    this.showNotifDropdown = !this.showNotifDropdown;
    this.showProfileMenu = false;
    if (this.showNotifDropdown) this.buildNotifications();
  }

  buildNotifications() {
    this.notifications = [];
    const pending = this.myPendingClubIds.length;
    if (pending > 0) this.notifications.push({ text: `${pending} club join request${pending > 1 ? 's' : ''} awaiting approval`, type: 'warn', link: 'clubs' });
    const leadApps = this.myLeadershipClubIds.length;
    if (leadApps > 0) this.notifications.push({ text: `${leadApps} leadership application${leadApps > 1 ? 's' : ''} submitted`, type: 'info', link: 'clubs' });
    if (this.notifications.length === 0) this.notifications.push({ text: 'No new notifications', type: 'success' });
  }

  navigateFromNotif(link?: string) {
    this.showNotifDropdown = false;
    if (link) this.setView(link as any);
  }

  get totalNotifCount(): number {
    return this.myPendingClubIds.length;
  }

  toggleProfileMenu() {
    this.showProfileMenu = !this.showProfileMenu;
    this.showNotifDropdown = false;
  }

  showMessage(msg: string, type: string) { this.message = msg; this.messageType = type; setTimeout(() => this.message = '', 3500); }
  getRankLabel(i: number) { return i===0?'1st':i===1?'2nd':i===2?'3rd':`#${i+1}`; }
  logout() { this.authService.logout(); this.router.navigate(['/login']); }
  getCapacityPct(r: number, t: number) { return t ? Math.min(100, Math.round((r/t)*100)) : 0; }
}
