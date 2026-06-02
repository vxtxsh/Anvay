import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  loginForm: FormGroup;
  errorMessage = '';
  loading = false;

  // Forgot password modal state
  showForgotModal = false;
  forgotStep: 'form' | 'success' = 'form';
  forgotEmail = '';
  forgotOldPassword = '';
  forgotNewPassword = '';
  forgotConfirmPassword = '';
  forgotError = '';
  forgotLoading = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private http: HttpClient
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
  }

  openForgotPassword() {
    this.showForgotModal = true;
    this.forgotStep = 'form';
    this.forgotEmail = '';
    this.forgotOldPassword = '';
    this.forgotNewPassword = '';
    this.forgotConfirmPassword = '';
    this.forgotError = '';
  }

  closeForgotModal() {
    this.showForgotModal = false;
    this.forgotError = '';
  }

  submitForgotPassword() {
    this.forgotError = '';
    if (!this.forgotEmail) { this.forgotError = 'Email is required'; return; }
    if (!this.forgotOldPassword) { this.forgotError = 'Old password or master key is required'; return; }
    if (!this.forgotNewPassword || this.forgotNewPassword.length < 6) {
      this.forgotError = 'New password must be at least 6 characters'; return;
    }
    if (this.forgotNewPassword !== this.forgotConfirmPassword) {
      this.forgotError = 'New passwords do not match'; return;
    }
    this.forgotLoading = true;
    this.http.post('/api/auth/reset-password', {
      email: this.forgotEmail,
      oldPassword: this.forgotOldPassword,
      newPassword: this.forgotNewPassword
    }).subscribe({
      next: () => { this.forgotStep = 'success'; this.forgotLoading = false; },
      error: (e) => { this.forgotError = e.error?.message || 'Reset failed. Check your credentials.'; this.forgotLoading = false; }
    });
  }

  onSubmit(): void {
    if (this.loginForm.invalid) return;
    this.loading = true;
    this.errorMessage = '';

    this.authService.login(this.loginForm.value).subscribe({
      next: (response) => {
        this.loading = false;
        switch (response.role) {
          case 'super_admin':
            this.router.navigate(['/dashboard/super-admin']);
            break;
          case 'institution':
            this.router.navigate(['/dashboard/institution']);
            break;
          case 'student':
            this.router.navigate(['/dashboard/student']);
            break;
          case 'club_leader':
            this.router.navigate(['/dashboard/leader']);
            break;
          default:
            this.router.navigate(['/login']);
        }
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err.error?.message || 'Login failed. Please try again.';
      }
    });
  }
}
