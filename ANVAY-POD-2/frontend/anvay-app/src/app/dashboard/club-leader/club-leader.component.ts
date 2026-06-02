import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth.service';

interface ManagedClub { clubId: number; clubName: string; category: string; }
interface ClubMember { id: number; userId: number; clubId: number; status: string; user?: { firstName: string; lastName: string; email: string }; }
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
interface BrowseClub { clubId: number; clubName: string; category: string; type: string; membersCount: number; memberCount: number; institutionId: number; }
interface LeaderboardUser { userId: number; firstName: string; lastName: string; email: string; totalPoints: number; joinedClubsCount: number; registeredEventsCount: number; }
interface InstitutionRank { institutionId: number; institutionName: string; totalPoints: number; studentCount: number; eventCount: number; }
interface UserProfile { userId: number; firstName: string; lastName: string; email: string; totalPoints: number; rank: number; registeredEventsCount: number; joinedClubsCount: number; role: string; }

@Component({
  selector: 'app-club-leader',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './club-leader.component.html',
  styleUrls: ['./club-leader.component.css']
})
export class ClubLeaderComponent implements OnInit, OnDestroy {
  leaderName = '';
  studentId: number = 0;
  institutionId: number = 0;
  leadingClubId: number = 0;
  managedClub: ManagedClub | null = null;
  sidebarOpen = true;
  activeView: 'dashboard' | 'events' | 'clubs' | 'leaderboard' | 'profile' | 'requests' | 'members' = 'dashboard';
  message = ''; messageType = '';

  // Wishlist
  wishlist: number[] = [];

  // Profile picture
  profilePicture = '';

  // Profile dropdown
  showProfileMenu = false;

  // Filters
  filterCategory = '';
  filterDateFrom = '';
  filterDateTo = '';

  // Search suggestions
  searchSuggestions: string[] = [];
  showSuggestions = false;

  // Carousel
  carouselIndex = 0;
  carouselInterval: any = null;
  hoveredCarouselEvent: EventFeed | null = null;

  // Club management
  joinRequests: ClubMember[] = [];
  members: ClubMember[] = [];
  requestsLoading = false;
  membersLoading = false;

  // Student dashboard
  dashboard: StudentDashboard | null = null;
  dashLoading = false;

  // Events
  events: EventFeed[] = [];
  eventsLoading = false;
  searchEvent = '';
  eventTab: 'feed' | 'registered' = 'feed';
  myRegistrations: EventFeed[] = [];
  myRegistrationsLoading = false;

  // Clubs browse
  allClubs: BrowseClub[] = [];
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

  // Profile
  profile: UserProfile | null = null;
  profileLoading = false;

  // Notifications
  showNotifDropdown = false;
  notifications: {text: string; type: 'info'|'warn'|'success'; link?: string}[] = [];

  get availableCategories(): string[] {
    const cats = this.events.map(e => e.type).filter(Boolean);
    return [...new Set(cats)];
  }

  get featuredEvents(): EventFeed[] {
    return this.events.filter(e => e.status !== 'ended' && e.startDate && new Date(e.startDate) > new Date()).slice(0, 6);
  }

  constructor(private http: HttpClient, private authService: AuthService, private router: Router, private route: ActivatedRoute, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    const user = this.authService.getCurrentUser();
    this.leaderName = user?.name ?? 'Leader';
    this.studentId = user?.userId ?? 0;
    this.institutionId = user?.institutionId ?? 0;
    this.leadingClubId = (user as any)?.leadingClubId ?? 0;
    this.wishlist = JSON.parse(localStorage.getItem(`wishlist_${this.studentId}`) || '[]');
    this.profilePicture = localStorage.getItem(`profilePic_${this.studentId}`) || '';
    if (this.leadingClubId) {
      this.loadManagedClub();
      this.loadJoinRequests();
    }
    this.route.queryParams.subscribe(params => {
      const v = (params['view'] || 'dashboard') as 'dashboard'|'events'|'clubs'|'leaderboard'|'profile'|'requests'|'members';
      this.applyView(v);
    });
  }

  ngOnDestroy() {
    if (this.carouselInterval) clearInterval(this.carouselInterval);
  }

  setView(v: 'dashboard'|'events'|'clubs'|'leaderboard'|'profile'|'requests'|'members') {
    this.router.navigate([], { queryParams: { view: v }, replaceUrl: false });
  }

  private applyView(v: 'dashboard'|'events'|'clubs'|'leaderboard'|'profile'|'requests'|'members') {
    this.activeView = v; this.message = '';
    if (v === 'dashboard') this.loadDashboard();
    if (v === 'events') this.loadEvents();
    if (v === 'clubs') this.loadClubs();
    if (v === 'leaderboard') this.loadLeaderboard();
    if (v === 'profile') this.loadProfile();
    if (v === 'requests') this.loadJoinRequests();
    if (v === 'members') this.loadMembers();
  }

  // ── Club management ──────────────────────────────────────
  loadManagedClub() {
    this.http.get<ManagedClub>(`/api/clubs/${this.leadingClubId}`).subscribe({
      next: c => this.managedClub = c, error: () => {}
    });
  }

  loadJoinRequests() {
    this.requestsLoading = true;
    this.http.get<ClubMember[]>(`/api/clubs/${this.leadingClubId}/join-requests`).subscribe({
      next: d => { this.joinRequests = d; this.requestsLoading = false; },
      error: () => this.requestsLoading = false
    });
  }

  loadMembers() {
    this.membersLoading = true;
    this.http.get<ClubMember[]>(`/api/clubs/${this.leadingClubId}/members/approved`).subscribe({
      next: d => { this.members = d; this.membersLoading = false; },
      error: () => this.membersLoading = false
    });
  }

  approveRequest(memberId: number) {
    this.http.put(`/api/clubs/${this.leadingClubId}/join-requests/${memberId}/approve`, {}).subscribe({
      next: () => { this.showMessage('Member approved!', 'success'); this.loadJoinRequests(); },
      error: () => this.showMessage('Failed to approve', 'error')
    });
  }

  rejectRequest(memberId: number) {
    this.http.put(`/api/clubs/${this.leadingClubId}/join-requests/${memberId}/reject`, {}).subscribe({
      next: () => { this.showMessage('Request rejected', 'success'); this.loadJoinRequests(); },
      error: () => this.showMessage('Failed to reject', 'error')
    });
  }

  removeMember(memberId: number) {
    if (!confirm('Remove this member from the club?')) return;
    this.http.delete(`/api/clubs/${this.leadingClubId}/members/${memberId}`).subscribe({
      next: () => { this.showMessage('Member removed', 'success'); this.loadMembers(); },
      error: () => this.showMessage('Failed to remove', 'error')
    });
  }

  // ── Student pages ─────────────────────────────────────────
  loadDashboard() {
    if (!this.studentId) return;
    this.dashLoading = true;
    this.http.get<StudentDashboard>(`/api/students/${this.studentId}/dashboard`).subscribe({
      next: d => { this.dashboard = d; this.dashLoading = false; },
      error: () => this.dashLoading = false
    });
  }

  loadEvents() {
    this.eventsLoading = true;
    this.http.get<EventFeed[]>(`/api/events/feed?userId=${this.studentId}&institutionId=${this.institutionId}`).subscribe({
      next: e => { this.events = e; this.eventsLoading = false; this.startCarousel(); },
      error: () => this.eventsLoading = false
    });
  }

  private get carouselMax(): number { return Math.max(0, this.featuredEvents.length - 4); }

  startCarousel() {
    if (this.carouselInterval) clearInterval(this.carouselInterval);
    if (this.featuredEvents.length > 4) {
      this.carouselInterval = setInterval(() => { this.carouselIndex = this.carouselIndex >= this.carouselMax ? 0 : this.carouselIndex + 1; this.cdr.detectChanges(); }, 3500);
    }
  }

  prevCarousel() { this.carouselIndex = this.carouselIndex > 0 ? this.carouselIndex - 1 : this.carouselMax; }
  nextCarousel() { this.carouselIndex = this.carouselIndex < this.carouselMax ? this.carouselIndex + 1 : 0; }

  onSearchInput() {
    const q = this.searchEvent.toLowerCase().trim();
    if (!q) { this.searchSuggestions = []; this.showSuggestions = false; return; }
    this.searchSuggestions = this.events.map(e => e.title).filter(t => t.toLowerCase().includes(q)).slice(0, 6);
    this.showSuggestions = this.searchSuggestions.length > 0;
  }

  selectSuggestion(s: string) { this.searchEvent = s; this.showSuggestions = false; }

  clearFilters() { this.filterCategory = ''; this.filterDateFrom = ''; this.filterDateTo = ''; this.searchEvent = ''; this.showSuggestions = false; }

  isWishlisted(eventId: number) { return this.wishlist.includes(eventId); }

  toggleWishlist(eventId: number) {
    if (this.isWishlisted(eventId)) { this.wishlist = this.wishlist.filter(id => id !== eventId); }
    else { this.wishlist.push(eventId); }
    localStorage.setItem(`wishlist_${this.studentId}`, JSON.stringify(this.wishlist));
  }

  onProfilePicSelected(event: any) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e: any) => { this.profilePicture = e.target.result; localStorage.setItem(`profilePic_${this.studentId}`, this.profilePicture); };
    reader.readAsDataURL(file);
  }

  removeProfilePic() { this.profilePicture = ''; localStorage.removeItem(`profilePic_${this.studentId}`); }

  toggleProfileMenu() { this.showProfileMenu = !this.showProfileMenu; this.showNotifDropdown = false; }

  navigateFromNotif(link?: string) { this.showNotifDropdown = false; if (link) this.setView(link as any); }

  switchEventTab(tab: 'feed' | 'registered') {
    this.eventTab = tab;
    if (tab === 'registered' && this.myRegistrations.length === 0) this.loadMyRegistrations();
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

  get upcomingEvents() { const now = new Date(); return this.filteredEvents.filter(e => e.startDate && new Date(e.startDate) > now); }
  get currentEvents() { const now = new Date(); return this.filteredEvents.filter(e => { const s = e.startDate ? new Date(e.startDate) : null; const en = e.endDate ? new Date(e.endDate) : null; return s && s <= now && (!en || en >= now) && e.status !== 'ended'; }); }
  get pastEvents() { const now = new Date(); return this.filteredEvents.filter(e => e.status === 'ended' || (e.endDate && new Date(e.endDate) < now)); }

  isEventOpen(ev: EventFeed) { if (ev.status === 'ended') return false; if (ev.endDate && new Date(ev.endDate) < new Date()) return false; if (ev.registrationDeadline && new Date(ev.registrationDeadline) < new Date()) return false; return true; }
  isDeadlinePassed(ev: EventFeed): boolean { return !!(ev.registrationDeadline && new Date(ev.registrationDeadline) < new Date() && ev.endDate && new Date(ev.endDate) >= new Date()); }

  registerEvent(eventId: number) {
    this.http.post('/api/events/register', { eventId, userId: this.studentId }).subscribe({
      next: () => { this.showMessage('Registered successfully!', 'success'); const ev = this.events.find(e => e.eventId === eventId); if (ev) { ev.isRegistered = true; ev.registeredCount = (ev.registeredCount || 0) + 1; } },
      error: () => this.showMessage('Registration failed', 'error')
    });
  }

  loadClubs() {
    this.clubsLoading = true;
    this.http.get<any[]>(`/api/clubs/user/${this.studentId}`).subscribe({
      next: memberships => {
        this.myApprovedClubIds = memberships.filter(m => m.status === 'APPROVED').map(m => m.clubId);
        this.myPendingClubIds = memberships.filter(m => m.status === 'PENDING').map(m => m.clubId);
      },
      error: () => {}
    });
    this.http.get<BrowseClub[]>(`/api/clubs/institution/${this.institutionId}`).subscribe({
      next: c => { this.allClubs = c; this.clubsLoading = false; },
      error: () => this.clubsLoading = false
    });
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
    this.leadershipClubId = clubId; this.leadershipClubName = clubName; this.leadershipExperience = ''; this.showLeadershipModal = true;
  }

  submitLeadership() {
    if (!this.leadershipExperience.trim()) { this.showMessage('Please describe your experience', 'error'); return; }
    this.leadershipLoading = true;
    this.http.post('/api/leadership-applications', { clubId: this.leadershipClubId, userId: this.studentId, experience: this.leadershipExperience }).subscribe({
      next: () => { this.showMessage('Application submitted!', 'success'); if (this.leadershipClubId) this.myLeadershipClubIds.push(this.leadershipClubId); this.showLeadershipModal = false; this.leadershipLoading = false; },
      error: () => { this.showMessage('Failed to apply', 'error'); this.leadershipLoading = false; }
    });
  }

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
      next: l => { this.globalLeaderboard = l; this.globalLbLoading = false; },
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

  loadProfile() {
    if (!this.studentId) return;
    this.profileLoading = true;
    this.http.get<UserProfile>(`/api/students/${this.studentId}/profile`).subscribe({
      next: p => { this.profile = p; this.profileLoading = false; },
      error: () => this.profileLoading = false
    });
    if (this.leaderboard.length === 0) this.loadLeaderboard();
  }

  get myRankInInstitution(): number {
    const idx = this.leaderboard.findIndex(u => u.userId === this.studentId);
    return idx >= 0 ? idx + 1 : 0;
  }

  get profileRank(): number | string {
    const idx = this.leaderboard.findIndex(u => u.userId === this.studentId);
    return idx >= 0 ? idx + 1 : (this.profile?.rank || '–');
  }

  toggleNotifications() {
    this.showNotifDropdown = !this.showNotifDropdown;
    if (this.showNotifDropdown) this.buildNotifications();
  }

  buildNotifications() {
    this.notifications = [];
    const reqs = this.joinRequests.length;
    if (reqs > 0) this.notifications.push({ text: `${reqs} pending join request${reqs > 1 ? 's' : ''} for your club`, type: 'warn', link: 'requests' });
    const pending = this.myPendingClubIds.length;
    if (pending > 0) this.notifications.push({ text: `${pending} of your club join request${pending > 1 ? 's' : ''} awaiting approval`, type: 'info', link: 'clubs' });
    if (this.notifications.length === 0) this.notifications.push({ text: 'No new notifications', type: 'success' });
  }

  get totalNotifCount(): number {
    return this.joinRequests.length + this.myPendingClubIds.length;
  }

  showMessage(msg: string, type: string) { this.message = msg; this.messageType = type; setTimeout(() => this.message = '', 3500); }
  getRankLabel(i: number) { return i===0?'1st':i===1?'2nd':i===2?'3rd':`#${i+1}`; }
  getCapacityPct(r: number, t: number) { return t ? Math.min(100, Math.round((r/t)*100)) : 0; }
  logout() { this.authService.logout(); this.router.navigate(['/login']); }
}
