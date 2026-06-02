import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register-institution',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './register-institution.component.html',
  styleUrls: ['./register-institution.component.css']
})
export class RegisterInstitutionComponent implements OnInit {
  readonly superAdminEmail = 'admin@anvay.com';
  form!: FormGroup;
  loading = false;
  errorMessage = '';

  constructor(private router: Router, private fb: FormBuilder, private authService: AuthService) {}

  ngOnInit() {
    this.form = this.fb.group({
      institutionName: ['', Validators.required],
      adminName:       ['', Validators.required],
      email:           ['', [Validators.required, Validators.email]],
      password:        ['', [Validators.required, Validators.minLength(6)]],
      contactNumber:   ['', [Validators.required, Validators.pattern('^[6-9][0-9]{9}$')]],
      address:         ['', Validators.required],
      description:     ['']
    });
  }

  onSubmit() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading = true; this.errorMessage = '';
    const f = this.form.value;

    this.authService.registerInstitution(f).subscribe({
      next: () => {
        this.loading = false;
        // Notify super admin via email
        const subject = encodeURIComponent('Institution Registration Request – ANVAY');
        const body = encodeURIComponent(
`Dear Super Admin,

A new institution has registered on ANVAY and is awaiting your approval.

Institution Name : ${f.institutionName}
Admin Name       : ${f.adminName}
Email            : ${f.email}
Contact          : ${f.contactNumber}
Address          : ${f.address}
${f.description ? 'Description      : ' + f.description : ''}

Please log in to the Super Admin dashboard to review and approve this request.

– ANVAY System`
        );
        window.open(`mailto:${this.superAdminEmail}?subject=${subject}&body=${body}`, '_blank');
        this.router.navigate(['/register/pending']);
      },
      error: (e) => { this.loading = false; this.errorMessage = e.error?.message || 'Registration failed. Please try again.'; }
    });
  }

  back() { this.router.navigate(['/register']); }
}
