import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { LoginRequest, LoginResponse, RegisterInstitutionRequest, RegisterStudentRequest } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly API_URL = '/api/auth';
  private readonly TOKEN_KEY = 'anvay_token';
  private readonly USER_KEY = 'anvay_user';

  constructor(private http: HttpClient) {}

  login(request: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.API_URL}/login`, request).pipe(
      tap(response => this.storeUser(response))
    );
  }

  registerInstitution(request: RegisterInstitutionRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.API_URL}/register/institution`, request).pipe(
      tap(response => this.storeUser(response))
    );
  }

  registerStudent(request: RegisterStudentRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.API_URL}/register/student`, request).pipe(
      tap(response => this.storeUser(response))
    );
  }

  private storeUser(response: LoginResponse): void {
    localStorage.setItem(this.TOKEN_KEY, response.token);
    localStorage.setItem(this.USER_KEY, JSON.stringify(response));
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  getCurrentUser(): LoginResponse | null {
    const data = localStorage.getItem(this.USER_KEY);
    return data ? JSON.parse(data) : null;
  }

  getRole(): string | null {
    return this.getCurrentUser()?.role ?? null;
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
  }
}
