import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StudentService } from '../services/student.service';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './topbar.component.html',
  styleUrls: ['./topbar.component.css']
})
export class TopbarComponent implements OnInit {
  // Store the student name here
  studentName: string = 'LOADING...'; 
  private studentService = inject(StudentService);

  ngOnInit(): void {
    // Using ID 101 as per your SQL update for Swastika
    this.studentService.getDashboard(101).subscribe({
      next: (data) => {
        // Map the first_name from your DB to the component variable
        this.studentName = data.firstName.toUpperCase();
      },
      error: (err) => {
        console.error('Error fetching user for topbar', err);
        this.studentName = 'GUEST';
      }
    });
  }
}