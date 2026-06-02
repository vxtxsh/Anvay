import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { StudentDashboardData } from '../models/student-dashboard.model'; 

@Injectable({ providedIn: 'root' })
export class StudentService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8081/api/students';

  getDashboard(id: number): Observable<StudentDashboardData> {
    return this.http.get<StudentDashboardData>(`${this.apiUrl}/${id}/dashboard`);
  }
}