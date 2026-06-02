import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ClubService } from '../../../services/club.service';
import { LeadershipService } from '../../../services/leadership.service'; 
import { ClubDashboardDTO, LeadershipApplication } from '../../../models/club.model';

@Component({
  selector: 'app-club-mgmt',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './club-mgmt.html',
  styleUrls: ['./club-mgmt.css']
})
export class ClubMgmtComponent implements OnInit {
  clubs: ClubDashboardDTO[] = [];
  pendingApps: any[] = []; 
  institutionId = 1; 

  constructor(
    private clubService: ClubService,
    private leadershipService: LeadershipService
  ) {}

  ngOnInit(): void {
    this.refreshDashboard();
  }

  refreshDashboard(): void {
    this.loadClubs();
    this.loadPendingApplications();
  }

  loadClubs(): void {
    this.clubService.getClubsByInstitution(this.institutionId).subscribe({
      next: (data) => this.clubs = data,
      error: (err) => console.error('Anvay Backend: Club fetch failed', err)
    });
  }

  loadPendingApplications(): void {
  this.leadershipService.getPendingByInstitution(this.institutionId).subscribe({
    next: (data: any[]) => {
      console.log('Raw Applications:', data); // Check F12 console for this!
      
      this.pendingApps = data.map(app => ({
        ...app,
        // Check if your Backend uses 'user' or 'student'
        userName: app.user ? `${app.user.firstName} ${app.user.lastName}` : 
                  app.student ? `${app.student.firstName} ${app.student.lastName}` : 'Unknown User',
        clubName: app.club ? app.club.clubName : 'Unknown Club'
      }));
    },
    error: (err) => console.error('Fetch failed', err)
  });
}

  // --- Header Actions ---

  /**
   * Fixes: Property 'onCreateClub' does not exist
   */
  onCreateClub(): void {
    console.log('Navigating to Create Club form...');
    // TODO: Add Router navigation here
  }

  // --- Table Actions ---

  /**
   * Fixes: Property 'onEdit' does not exist
   */
  onEdit(id: number): void {
    console.log('Editing club with ID:', id);
    // TODO: Add Router navigation here
  }

  onDelete(id: number): void {
    if (confirm('Are you sure you want to remove this club?')) {
      this.clubService.deleteClub(id).subscribe(() => this.loadClubs());
    }
  }

  onViewMembers(id: number): void {
    console.log('Navigating to members for club:', id);
  }

  // --- Leadership Application Actions ---

  onApprove(appId: number): void {
    this.leadershipService.updateStatus(appId, 'APPROVED').subscribe({
      next: () => {
        console.log('Application Approved');
        this.refreshDashboard(); 
      },
      error: (err) => alert('Could not approve application.')
    });
  }

  onReject(appId: number): void {
    if (confirm('Are you sure you want to reject this application?')) {
      this.leadershipService.updateStatus(appId, 'REJECTED').subscribe({
        next: () => this.refreshDashboard(),
        error: (err) => console.error(err)
      });
    }
  }
}