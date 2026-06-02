import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.css']
})
export class SignupComponent implements OnInit {
  signupType: 'student' | 'institution' = 'student';
  studentForm!: FormGroup;
  institutionForm!: FormGroup;
  errorMessage = '';
  loading = false;
  institutions: {institutionId: number; institutionName: string}[] = [];

  constructor(private fb: FormBuilder, private authService: AuthService, private router: Router, private http: HttpClient) {}

  ngOnInit() {
    this.studentForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      institutionId: [null, Validators.required]
    });
    this.institutionForm = this.fb.group({
      institutionName: ['', Validators.required],
      adminName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      address: ['']
    });
    this.http.get<any[]>('/api/institutions/active').subscribe({
      next: ins => this.institutions = ins.map(i => ({ institutionId: i.institutionId, institutionName: i.name })),
      error: () => {}
    });
  }

  onSubmit() {
    this.loading = true; this.errorMessage = '';
    if (this.signupType === 'student') {
      this.authService.registerStudent(this.studentForm.value).subscribe({
        next: () => { this.loading = false; this.router.navigate(['/dashboard/student']); },
        error: (e) => { this.loading = false; this.errorMessage = e.error?.message || 'Registration failed'; }
      });
    } else {
      this.authService.registerInstitution(this.institutionForm.value).subscribe({
        next: () => { this.loading = false; this.router.navigate(['/dashboard/institution']); },
        error: (e) => { this.loading = false; this.errorMessage = e.error?.message || 'Registration failed'; }
      });
    }
  }
}
