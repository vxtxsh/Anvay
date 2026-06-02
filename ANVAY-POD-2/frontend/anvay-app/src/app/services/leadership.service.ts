import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { LeadershipApplication } from '../models/club.model';

@Injectable({ providedIn: 'root' })
export class LeadershipService {
  // Matching your 9092 port for Anvay Backend
  private baseUrl = 'http://localhost:9092/api/applications'; 

  constructor(private http: HttpClient) {}

  /**
   * Fetches pending apps for the institution.
   * Ensure your Controller has @GetMapping("/institution/{id}")
   */
  getPendingByInstitution(institutionId: number): Observable<LeadershipApplication[]> {
    return this.http.get<LeadershipApplication[]>(`${this.baseUrl}/institution/${institutionId}`);
  }

  /**
   * Updates the status to APPROVED or REJECTED
   */
  updateStatus(appId: number, status: string): Observable<any> {
    // Matches your ApplicationServiceImpl.updateApplication logic
    return this.http.put(`${this.baseUrl}/${appId}`, { status });
  }
}