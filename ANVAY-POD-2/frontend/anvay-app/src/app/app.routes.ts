import { Routes } from '@angular/router';
import { authGuard, noAuthGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./home/home.component').then(m => m.HomeComponent)
  },
  {
    path: 'login',
    loadComponent: () => import('./auth/login/login.component').then(m => m.LoginComponent),
    canActivate: [noAuthGuard]
  },
  {
    path: 'signup',
    loadComponent: () => import('./auth/signup/signup.component').then(m => m.SignupComponent),
    canActivate: [noAuthGuard]
  },
  {
    path: 'register',
    loadComponent: () => import('./auth/register/register.component').then(m => m.RegisterComponent),
    canActivate: [noAuthGuard]
  },
  {
    path: 'register/institution',
    loadComponent: () => import('./auth/register-institution/register-institution.component').then(m => m.RegisterInstitutionComponent),
    canActivate: [noAuthGuard]
  },
  {
    path: 'register/student',
    loadComponent: () => import('./auth/register-student/register-student.component').then(m => m.RegisterStudentComponent),
    canActivate: [noAuthGuard]
  },
  {
    path: 'register/pending',
    loadComponent: () => import('./auth/register-pending/register-pending.component').then(m => m.RegisterPendingComponent)
  },
  {
    path: 'dashboard/super-admin',
    loadComponent: () => import('./dashboard/super-admin/super-admin.component').then(m => m.SuperAdminComponent),
    canActivate: [authGuard],
    data: { role: 'super_admin' }
  },
  {
    path: 'dashboard/institution',
    loadComponent: () => import('./dashboard/institution/institution.component').then(m => m.InstitutionComponent),
    canActivate: [authGuard],
    data: { role: 'institution' }
  },
  {
    path: 'dashboard/student',
    loadComponent: () => import('./dashboard/student/student.component').then(m => m.StudentComponent),
    canActivate: [authGuard],
    data: { role: 'student' }
  },
  {
    path: 'dashboard/leader',
    loadComponent: () => import('./dashboard/club-leader/club-leader.component').then(m => m.ClubLeaderComponent),
    canActivate: [authGuard],
    data: { role: 'club_leader' }
  },
  { path: '**', redirectTo: '/' }
];
