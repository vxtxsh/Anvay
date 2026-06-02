import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-student-profile',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './student-profile.component.html',
  styleUrls: ['./student-profile.component.css']
})
export class StudentProfileComponent {
  userName = 'Mathi';
  userEmail = 'mathi@mkce.edu';
  college = 'M Kumarasamy College of Engineering';
  points = 1250;
  clubsCount = 2;
  eventsCount = 2;
}