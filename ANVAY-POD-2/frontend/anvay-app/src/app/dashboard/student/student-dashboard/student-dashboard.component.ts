import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StudentService } from '../services/student.service';
import { StudentDashboardData } from '../models/student-dashboard.model';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-student-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './student-dashboard.component.html',
  styleUrls: ['./student-dashboard.component.css']
})
export class StudentDashboardComponent implements OnInit {
  dashboardData?: StudentDashboardData;
  private studentService = inject(StudentService);

  ngOnInit(): void {
    this.loadDashboard();
  }

 loadDashboard(): void {
  this.studentService.getDashboard(101).subscribe({
    next: (data) => {
      this.dashboardData = data;
    },
    error: (err) => console.error(err)
  });
}
}