import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth.service';

interface Event {
  eventId: number; eventName: string; description: string; category: string;
  location: string; startDate: string; endDate: string; registrationDeadline: string;
  maxParticipants: number; registrationFee: number; status: string; eventRules: string;
  participantType: string; clubId: number; hasWinners?: boolean;
  winnersStatus?: string; winner1UserId?: number; winner2UserId?: number; winner3UserId?: number;
  imageData?: string; contactNumber?: string;
}
interface Club { clubId: number; clubName: string; category: string; membersCount: number; joinRequestsCount: number; leadershipAppsCount: number; createdDate: string; }
interface ClubMember { id: number; userId: number; clubId: number; status: string; user?: {firstName: string; lastName: string; email: string; role?: string; leadingClubId?: number}; }
interface LeadershipApp { applicationId: number; userId: number; clubId: number; experience: string; status: string; appliedAt: string; user?: {firstName: string; lastName: string; email: string}; }
interface EventParticipant { id: number; userId: number; eventId: number; status: string; points_earned?: number; user?: {firstName: string; lastName: string; email: string}; }
interface Student { userId: number; firstName: string; lastName: string; email: string; totalPoints: number; registeredEventsCount: number; joinedClubsCount: number; role?: string; achievements?: Achievement[]; }
interface Achievement { title: string; description: string; badgeType: string; }
interface InstitutionRank { institutionId: number; institutionName: string; totalPoints: number; studentCount: number; eventCount: number; }

@Component({
  selector: 'app-institution',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './institution.component.html',
  styleUrls: ['./institution.component.css']
})
export class InstitutionComponent implements OnInit {
  activeView: 'dashboard' | 'events' | 'clubs' | 'students' = 'dashboard';
  sidebarOpen = true;
  adminName = '';
  institutionName = '';
  institutionId: number = 0;
  isPending = false;
  institutionStatus = '';

  // Dashboard
  dashStats = { totalEvents: 0, totalClubs: 0, totalStudents: 0, totalPoints: 0 };

  // Events
  events: Event[] = [];
  eventsLoading = false;
  eventsSearch = '';
  eventsFilterCategory = '';
  eventsFilterDateFrom = '';
  eventsFilterDateTo = '';
  showEventModal = false;
  editingEvent: Event | null = null;
  selectedEvent: Event | null = null;
  selectedEventParticipants: EventParticipant[] = [];
  selectedEventParticipantsLoading = false;
  eventForm!: FormGroup;
  categories = ['Technical', 'Cultural', 'Sports', 'Academic', 'Workshop', 'Seminar', 'Hackathon', 'Other'];

  // Event image upload
  eventImageData = '';
  eventImagePreview = '';

  // Participants slider
  participantsSlider = 100;

  // Inline form errors
  contactNumberError = '';
  endDateError = '';
  deadlineError = '';

  // Clubs
  clubs: Club[] = [];
  clubsLoading = false;
  showClubModal = false;
  editingClub: Club | null = null;
  clubForm!: FormGroup;
  clubCategories = ['Computer', 'Robotics', 'Entrepreneurship', 'Cultural', 'Sports', 'Science', 'Arts', 'Other'];
  selectedClub: Club | null = null;
  clubMembers: ClubMember[] = [];
  clubLeadershipApps: LeadershipApp[] = [];
  clubDetailTab: 'members' | 'requests' | 'leadership' = 'members';

  // Students
  students: Student[] = [];
  studentsLoading = false;

  collegeLb: InstitutionRank[] = [];
  collegeLbLoading = false;

  message = ''; messageType = '';
  isSaving = false;

  // Notifications
  showNotifDropdown = false;
  notifications: {text: string; type: 'info'|'warn'|'success'; link?: string}[] = [];

  // Profile dropdown
  showProfileMenu = false;

  // Winners modal
  winnersModal = false;
  winnersEventId: number | null = null;
  winnersEventName = '';
  eventParticipants: EventParticipant[] = [];
  winner1: number | null = null;
  winner2: number | null = null;
  winner3: number | null = null;
  winnersLoading = false;

  approveModal = false;
  approveVerified = false;
  pendingClubId: number | null = null;
  pendingMemberId: number | null = null;

  constructor(private http: HttpClient, private authService: AuthService, private router: Router, private route: ActivatedRoute, private fb: FormBuilder) {}

  ngOnInit() {
    const user = this.authService.getCurrentUser();
    this.adminName = user?.name ?? 'Admin';
    this.institutionId = user?.institutionId ?? 0;
    this.initForms();
    this.route.queryParams.subscribe(params => {
      const v = params['view'] as 'dashboard'|'events'|'clubs'|'students';
      if (v && v !== this.activeView) this.applyView(v);
    });
    if (this.institutionId) {
      this.http.get<any>(`/api/institutions/${this.institutionId}`).subscribe({
        next: inst => {
          this.institutionName = inst.name ?? '';
          this.institutionStatus = inst.status ?? '';
          this.isPending = inst.status !== 'active';
          if (!this.isPending) this.loadDashboardStats();
        },
        error: () => { this.loadDashboardStats(); }
      });
    }
  }

  initForms() {
    this.eventForm = this.fb.group({
      eventName: ['', [Validators.required, Validators.pattern('^(?=.*[a-zA-Z]).+$')]],
      description: [''],
      category: ['', Validators.required],
      contactNumber: ['', [Validators.required, Validators.pattern('^[6-9][0-9]{9}$')]],
      location: ['', [Validators.required, Validators.pattern('^$|^(?=.*[a-zA-Z]).+$')]],
      startDate: ['', Validators.required],
      endDate: [''],
      registrationDeadline: [''],
      maxParticipants: [100, [Validators.required, Validators.min(1)]],
      registrationFee: [0, [Validators.min(0)]],
      eventRules: [''],
      participantType: ['all'],
      status: ['active'],
      hasWinners: [false],
      clubId: [null, Validators.required]
    });
    this.clubForm = this.fb.group({
      clubName: ['', [Validators.required, Validators.pattern('^(?=.*[a-zA-Z]).+$')]],
      category: ['', Validators.required]
    });
  }

  setView(v: 'dashboard'|'events'|'clubs'|'students') {
    this.router.navigate([], { queryParams: { view: v }, replaceUrl: false });
  }

  private applyView(v: 'dashboard'|'events'|'clubs'|'students') {
    this.activeView = v;
    this.message = ''; this.selectedClub = null; this.selectedEvent = null;
    if (v === 'dashboard') this.loadDashboardStats();
    if (v === 'events') { this.loadClubs(); this.loadEvents(); }
    if (v === 'clubs') this.loadClubs();
    if (v === 'students') this.loadStudents();
  }

  loadDashboardStats() {
    if (!this.institutionId) return;
    this.http.get<Event[]>(`/api/events/institution/${this.institutionId}`).subscribe({ next: d => this.dashStats.totalEvents = d.length, error: () => {} });
    this.http.get<Club[]>(`/api/clubs/institution/${this.institutionId}`).subscribe({ next: d => this.dashStats.totalClubs = d.length, error: () => {} });
    this.http.get<Student[]>(`/api/students/institution/${this.institutionId}/leaderboard`).subscribe({ next: d => { this.dashStats.totalStudents = d.length; this.dashStats.totalPoints = d.reduce((s, st) => s + (st.totalPoints||0), 0); }, error: () => {} });
    this.loadCollegeLeaderboard();
  }

  loadCollegeLeaderboard() {
    this.collegeLbLoading = true;
    this.http.get<InstitutionRank[]>('/api/institutions/leaderboard').subscribe({
      next: d => {
        this.collegeLb = d;
        this.collegeLbLoading = false;
        const mine = d.find(i => i.institutionId === this.institutionId);
        if (mine) this.dashStats.totalPoints = mine.totalPoints;
      },
      error: () => { this.collegeLbLoading = false; }
    });
  }

  // EVENTS
  loadEvents() {
    this.eventsLoading = true;
    this.http.get<Event[]>(`/api/events/institution/${this.institutionId}`).subscribe({
      next: e => { this.events = e; this.eventsLoading = false; },
      error: () => { this.eventsLoading = false; }
    });
  }

  openCreateEvent() {
    this.editingEvent = null;
    const defaultClubId = this.clubs[0]?.clubId ?? null;
    this.eventForm.reset({ maxParticipants: 100, registrationFee: 0, participantType: 'all', status: 'active', hasWinners: false, clubId: defaultClubId });
    this.eventImageData = '';
    this.eventImagePreview = '';
    this.participantsSlider = 100;
    this.contactNumberError = '';
    this.endDateError = '';
    this.deadlineError = '';
    this.showEventModal = true;
  }

  openEditEvent(ev: Event) {
    this.editingEvent = ev;
    this.eventForm.patchValue({
      ...ev,
      startDate: ev.startDate?.substring(0, 16),
      endDate: ev.endDate?.substring(0, 16),
      registrationDeadline: ev.registrationDeadline?.substring(0, 16),
      contactNumber: ev.contactNumber ?? ''
    });
    this.eventImageData = ev.imageData ?? '';
    this.eventImagePreview = ev.imageData ?? '';
    this.participantsSlider = ev.maxParticipants ?? 100;
    this.contactNumberError = '';
    this.endDateError = '';
    this.deadlineError = '';
    this.showEventModal = true;
  }

  onEventImageSelected(event: any) {
    const file: File = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e: any) => {
      this.eventImageData = e.target.result;
      this.eventImagePreview = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  onSliderChange(val: number) {
    this.participantsSlider = val;
    this.eventForm.patchValue({ maxParticipants: val });
  }

  private toIsoSeconds(val: string | null | undefined): string | null {
    if (!val) return null;
    // datetime-local gives "yyyy-MM-ddTHH:mm" — append ":00" if seconds are missing
    return val.length === 16 ? val + ':00' : val;
  }

  saveEvent() {
    // Clear all inline errors first
    this.contactNumberError = '';
    this.endDateError = '';
    this.deadlineError = '';

    this.eventForm.markAllAsTouched();
    if (this.eventForm.invalid) return;

    const v = this.eventForm.value;
    const data = {
      ...v,
      startDate: this.toIsoSeconds(v.startDate),
      endDate: this.toIsoSeconds(v.endDate),
      registrationDeadline: this.toIsoSeconds(v.registrationDeadline),
      maxParticipants: +v.maxParticipants,
      imageData: this.eventImageData,
      contactNumber: v.contactNumber
    };

    // Validate end date is after start date
    if (data.endDate && data.startDate && new Date(data.endDate) < new Date(data.startDate)) {
      this.endDateError = 'End date must be after start date';
      return;
    }

    // Validate registration deadline is before start date
    if (data.registrationDeadline && data.startDate && new Date(data.registrationDeadline) > new Date(data.startDate)) {
      this.deadlineError = 'Deadline must be before the event start date';
      return;
    }

    // Validate registration deadline is not in the past
    if (data.registrationDeadline && new Date(data.registrationDeadline) < new Date()) {
      this.deadlineError = 'Registration deadline has already passed';
      return;
    }

    this.isSaving = true;
    if (this.editingEvent) {
      this.http.put(`/api/events/${this.editingEvent.eventId}`, data).subscribe({
        next: () => { this.isSaving = false; this.showMessage('Event updated!', 'success'); this.showEventModal = false; this.loadEvents(); },
        error: () => { this.isSaving = false; this.showMessage('Failed to update event', 'error'); }
      });
    } else {
      this.http.post('/api/events', data).subscribe({
        next: () => { this.isSaving = false; this.showMessage('Event created!', 'success'); this.showEventModal = false; this.loadEvents(); },
        error: () => { this.isSaving = false; this.showMessage('Failed to create event', 'error'); }
      });
    }
  }

  endEvent(id: number) {
    if (!confirm('Mark this event as ended? This action cannot be undone.')) return;
    this.http.put(`/api/events/${id}/end`, {}).subscribe({
      next: () => { this.showMessage('Event marked as ended', 'success'); this.loadEvents(); },
      error: () => this.showMessage('Failed to end event', 'error')
    });
  }

  deleteEvent(id: number) {
    if (!confirm('Delete this event?')) return;
    this.http.delete(`/api/events/${id}`).subscribe({ next: () => { this.showMessage('Event deleted', 'success'); this.loadEvents(); }, error: () => this.showMessage('Failed to delete','error') });
  }

  // CLUBS
  loadClubs() {
    this.clubsLoading = true;
    this.http.get<Club[]>(`/api/clubs/institution/${this.institutionId}`).subscribe({
      next: c => { this.clubs = c; this.clubsLoading = false; },
      error: () => this.clubsLoading = false
    });
  }

  deleteClub(id: number) {
    if (!confirm('Delete this club? All member data will be removed.')) return;
    this.http.delete(`/api/clubs/${id}`).subscribe({
      next: () => { this.showMessage('Club deleted', 'success'); this.loadClubs(); },
      error: () => this.showMessage('Failed to delete club', 'error')
    });
  }

  removeStudent(id: number) {
    if (!confirm('Remove this student from your institution?')) return;
    this.http.delete(`/api/students/${id}`).subscribe({
      next: () => { this.showMessage('Student removed', 'success'); this.loadStudents(); },
      error: () => this.showMessage('Failed to remove student', 'error')
    });
  }

  openCreateClub() { this.editingClub = null; this.clubForm.reset(); this.showClubModal = true; }
  openEditClub(c: Club) { this.editingClub = c; this.clubForm.patchValue({ clubName: c.clubName, category: (c as any).type || c.category }); this.showClubModal = true; }

  saveClub() {
    this.clubForm.markAllAsTouched();
    if (this.clubForm.invalid) return;
    const d = { ...this.clubForm.value, institutionId: this.institutionId };
    if (this.editingClub) {
      this.http.put(`/api/clubs/${this.editingClub.clubId}`, d).subscribe({
        next: () => { this.showMessage('Club updated!','success'); this.showClubModal=false; this.loadClubs(); },
        error: () => this.showMessage('Failed','error')
      });
    } else {
      this.http.post('/api/clubs', d).subscribe({
        next: () => { this.showMessage('Club created!','success'); this.showClubModal=false; this.loadClubs(); },
        error: () => this.showMessage('Failed','error')
      });
    }
  }

  removeClubLeader(clubId: number, userId: number) {
    if (!confirm('Remove this member as club leader? They will be reverted to a regular member.')) return;
    this.http.delete(`/api/clubs/${clubId}/leader/${userId}`).subscribe({
      next: () => { this.showMessage('Club leader removed', 'success'); this.loadClubMembers(clubId); },
      error: () => this.showMessage('Failed to remove club leader', 'error')
    });
  }

  viewClubDetail(c: Club) {
    this.selectedClub = c;
    this.clubDetailTab = 'members';
    this.loadClubMembers(c.clubId);
    this.loadLeadershipApps(c.clubId);
  }

  loadClubMembers(clubId: number) {
    this.http.get<ClubMember[]>(`/api/clubs/${clubId}/members`).subscribe({ next: m => this.clubMembers = m, error: () => {} });
  }

  loadJoinRequests(clubId: number) {
    this.http.get<ClubMember[]>(`/api/clubs/${clubId}/join-requests`).subscribe({ next: m => this.clubMembers = m, error: () => {} });
  }

  loadLeadershipApps(clubId: number) {
    this.http.get<LeadershipApp[]>(`/api/leadership-applications/club/${clubId}/pending`).subscribe({ next: a => this.clubLeadershipApps = a, error: () => {} });
  }

  switchClubTab(tab: 'members'|'requests'|'leadership') {
    this.clubDetailTab = tab;
    if (tab === 'members') this.loadClubMembers(this.selectedClub!.clubId);
    if (tab === 'requests') this.loadJoinRequests(this.selectedClub!.clubId);
    if (tab === 'leadership') this.loadLeadershipApps(this.selectedClub!.clubId);
  }

  openApproveModal(clubId: number, memberId: number) {
    this.pendingClubId = clubId;
    this.pendingMemberId = memberId;
    this.approveVerified = false;
    this.approveModal = true;
  }

  confirmApprove() {
    if (!this.approveVerified || !this.pendingClubId || !this.pendingMemberId) return;
    this.http.put(`/api/clubs/${this.pendingClubId}/join-requests/${this.pendingMemberId}/approve`, {}).subscribe({
      next: () => { this.showMessage('Approved!','success'); this.loadJoinRequests(this.pendingClubId!); this.loadClubs(); this.approveModal = false; },
      error: () => { this.showMessage('Failed','error'); this.approveModal = false; }
    });
  }

  approveJoinRequest(clubId: number, memberId: number) { this.openApproveModal(clubId, memberId); }

  rejectJoinRequest(clubId: number, memberId: number) {
    this.http.put(`/api/clubs/${clubId}/join-requests/${memberId}/reject`, {}).subscribe({
      next: () => { this.showMessage('Rejected','success'); this.loadJoinRequests(clubId); this.loadClubs(); },
      error: () => this.showMessage('Failed','error')
    });
  }

  approveLeadership(appId: number) {
    this.http.put(`/api/leadership-applications/${appId}/approve`, {}).subscribe({
      next: () => { this.showMessage('Leadership application approved!','success'); this.loadLeadershipApps(this.selectedClub!.clubId); },
      error: () => this.showMessage('Failed','error')
    });
  }

  rejectLeadership(appId: number) {
    this.http.put(`/api/leadership-applications/${appId}/reject`, {}).subscribe({
      next: () => { this.showMessage('Application rejected','success'); this.loadLeadershipApps(this.selectedClub!.clubId); },
      error: () => this.showMessage('Failed','error')
    });
  }

  // STUDENTS
  loadStudents() {
    this.studentsLoading = true;
    this.http.get<Student[]>(`/api/students/institution/${this.institutionId}/leaderboard`).subscribe({
      next: s => { this.students = s.sort((a,b) => (b.totalPoints||0)-(a.totalPoints||0)); this.studentsLoading = false; },
      error: () => this.studentsLoading = false
    });
  }

  viewEventParticipants(ev: Event) {
    this.selectedEvent = ev;
    this.selectedEventParticipants = [];
    this.selectedEventParticipantsLoading = true;
    this.http.get<EventParticipant[]>(`/api/events/${ev.eventId}/participants`).subscribe({
      next: p => { this.selectedEventParticipants = p; this.selectedEventParticipantsLoading = false; },
      error: () => { this.selectedEventParticipantsLoading = false; }
    });
  }

  openWinnersModal(ev: Event) {
    if (ev.winnersStatus) return; // frozen once submitted
    this.winnersEventId = ev.eventId;
    this.winnersEventName = ev.eventName;
    this.winner1 = null; this.winner2 = null; this.winner3 = null;
    this.eventParticipants = [];
    this.winnersModal = true;
    this.winnersLoading = true;
    this.http.get<EventParticipant[]>(`/api/events/${ev.eventId}/participants`).subscribe({
      next: p => { this.eventParticipants = p; this.winnersLoading = false; },
      error: () => { this.winnersLoading = false; }
    });
  }

  submitWinners() {
    if (!this.winner1 && !this.winner2 && !this.winner3) { this.showMessage('Please select at least one rank winner', 'error'); return; }
    this.http.post(`/api/events/${this.winnersEventId}/award-winners`, {
      firstUserId: this.winner1,
      secondUserId: this.winner2 || null,
      thirdUserId: this.winner3 || null
    }).subscribe({
      next: () => { this.showMessage('Winners submitted! Awaiting super admin approval.', 'success'); this.winnersModal = false; this.loadEvents(); },
      error: () => this.showMessage('Failed to submit winners', 'error')
    });
  }

  // ── Event section getters ──────────────────────────────
  get availableEventCategories(): string[] {
    const cats = this.events.map(e => e.category).filter(Boolean);
    return [...new Set(cats)];
  }

  get filteredEventsInst(): Event[] {
    const q = this.eventsSearch.toLowerCase();
    return this.events.filter(e => {
      const matchQ = !q || e.eventName?.toLowerCase().includes(q) || e.category?.toLowerCase().includes(q) || e.location?.toLowerCase().includes(q);
      const matchCat = !this.eventsFilterCategory || e.category === this.eventsFilterCategory;
      const matchFrom = !this.eventsFilterDateFrom || (e.startDate && new Date(e.startDate) >= new Date(this.eventsFilterDateFrom));
      const matchTo = !this.eventsFilterDateTo || (e.startDate && new Date(e.startDate) <= new Date(this.eventsFilterDateTo + 'T23:59:59'));
      return matchQ && matchCat && matchFrom && matchTo;
    });
  }

  clearEventFilters() {
    this.eventsSearch = '';
    this.eventsFilterCategory = '';
    this.eventsFilterDateFrom = '';
    this.eventsFilterDateTo = '';
  }

  get upcomingEventsInst() {
    const now = new Date();
    return this.filteredEventsInst.filter(e => e.startDate && new Date(e.startDate) > now && e.status !== 'ended');
  }

  get currentEventsInst() {
    const now = new Date();
    return this.filteredEventsInst.filter(e => {
      const start = e.startDate ? new Date(e.startDate) : null;
      const end   = e.endDate   ? new Date(e.endDate)   : null;
      if (!start) return false;
      return start <= now && (!end || end >= now) && e.status !== 'ended';
    });
  }

  get pastEventsInst() {
    const now = new Date();
    return this.filteredEventsInst.filter(e => e.status === 'ended' || (e.endDate && new Date(e.endDate) < now));
  }

  toggleNotifications() {
    this.showNotifDropdown = !this.showNotifDropdown;
    if (this.showNotifDropdown) this.buildNotifications();
  }

  buildNotifications() {
    this.notifications = [];
    const totalJoinReqs = this.clubs.reduce((s, c) => s + (c.joinRequestsCount || 0), 0);
    const totalLeadApps = this.clubs.reduce((s, c) => s + (c.leadershipAppsCount || 0), 0);
    if (totalJoinReqs > 0) this.notifications.push({ text: `${totalJoinReqs} pending club join request${totalJoinReqs > 1 ? 's' : ''}`, type: 'warn', link: '?view=clubs' });
    if (totalLeadApps > 0) this.notifications.push({ text: `${totalLeadApps} pending leadership application${totalLeadApps > 1 ? 's' : ''}`, type: 'info', link: '?view=clubs' });
    const pendingWinners = this.events.filter(e => e.winnersStatus === 'pending').length;
    if (pendingWinners > 0) this.notifications.push({ text: `${pendingWinners} event winner submission${pendingWinners > 1 ? 's' : ''} awaiting super admin approval`, type: 'info' });
    if (this.notifications.length === 0) this.notifications.push({ text: 'No new notifications', type: 'success' });
  }

  navigateFromNotif(link?: string) {
    if (link) {
      this.router.navigate(['/dashboard/institution'], { queryParams: { view: link.replace('?view=', '') } });
      this.showNotifDropdown = false;
    }
  }

  toggleProfileMenu() {
    this.showProfileMenu = !this.showProfileMenu;
  }

  get totalNotifCount(): number {
    const totalJoinReqs = this.clubs.reduce((s, c) => s + (c.joinRequestsCount || 0), 0);
    const totalLeadApps = this.clubs.reduce((s, c) => s + (c.leadershipAppsCount || 0), 0);
    return totalJoinReqs + totalLeadApps;
  }

  showMessage(msg: string, type: string) { this.message = msg; this.messageType = type; setTimeout(() => this.message = '', 3000); }
  getRankLabel(i: number) { return i===0?'1st':i===1?'2nd':i===2?'3rd':`#${i+1}`; }
  logout() { this.authService.logout(); this.router.navigate(['/login']); }
}
