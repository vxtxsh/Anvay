import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-register-pending',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './register-pending.component.html',
  styleUrls: ['./register-pending.component.css']
})
export class RegisterPendingComponent {
  constructor(private router: Router) {}
  goLogin() { this.router.navigate(['/login']); }
}
