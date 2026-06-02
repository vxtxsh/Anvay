import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register-student',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './register-student.component.html',
  styleUrls: ['./register-student.component.css']
})
export class RegisterStudentComponent implements OnInit {
  form!: FormGroup;
  institutions: { institutionId: number; institutionName: string }[] = [];
  errorMessage = '';
  loading = false;

  constructor(private fb: FormBuilder, private authService: AuthService, private router: Router, private http: HttpClient) {}

  ngOnInit() {
    this.form = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      institutionId: [null, Validators.required],
      studentIdNumber: ['', Validators.required]
    });
    this.http.get<any[]>('/api/institutions/active').subscribe({
      next: ins => this.institutions = ins.map(i => ({ institutionId: i.institutionId, institutionName: i.name })),
      error: () => {}
    });
  }

  onSubmit() {
    if (this.form.invalid) return;
    this.loading = true; this.errorMessage = '';
    this.authService.registerStudent(this.form.value).subscribe({
      next: () => { this.loading = false; this.router.navigate(['/dashboard/student']); },
      error: (e) => { this.loading = false; this.errorMessage = e.error?.message || 'Registration failed. Please try again.'; }
    });
  }

  back() { this.router.navigate(['/register']); }
}
