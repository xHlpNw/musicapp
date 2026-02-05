import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, tap } from 'rxjs';
import { RegisterRequest, LoginRequest, LoginResponse, UpdateProfileRequest, UpdatePasswordRequest } from '../models/auth.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly API_URL = '/api/auth';
  private readonly TOKEN_KEY = 'access_token';
  private readonly USER_KEY = 'current_user';

  private currentUserSubject = new BehaviorSubject<LoginResponse | null>(this.getUserFromStorage());
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {}

  register(request: RegisterRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.API_URL}/register`, request).pipe(
      tap(response => this.handleAuthResponse(response))
    );
  }

  login(request: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.API_URL}/login`, request).pipe(
      tap(response => this.handleAuthResponse(response))
    );
  }

  updateProfile(request: UpdateProfileRequest): Observable<LoginResponse> {
    return this.http.patch<LoginResponse>(`${this.API_URL}/me`, request).pipe(
      tap(response => this.handleAuthResponse(response))
    );
  }

  updatePassword(request: UpdatePasswordRequest): Observable<LoginResponse> {
    return this.http.patch<LoginResponse>(`${this.API_URL}/me/password`, request).pipe(
      tap(response => this.handleAuthResponse(response))
    );
  }

  updateAvatar(imageData: string): Observable<LoginResponse> {
    return this.http.patch<LoginResponse>(`${this.API_URL}/me/avatar`, { imageData }).pipe(
      tap(response => this.handleAuthResponse(response))
    );
  }

  clearAvatar(): Observable<LoginResponse> {
    return this.http.delete<LoginResponse>(`${this.API_URL}/me/avatar`).pipe(
      tap(response => this.handleAuthResponse(response))
    );
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.currentUserSubject.next(null);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  private handleAuthResponse(response: LoginResponse): void {
    const userWithVersion = { ...response, avatarVersion: Date.now() };
    localStorage.setItem(this.TOKEN_KEY, response.accessToken);
    localStorage.setItem(this.USER_KEY, JSON.stringify(userWithVersion));
    this.currentUserSubject.next(userWithVersion);
  }

  private getUserFromStorage(): LoginResponse | null {
    const userJson = localStorage.getItem(this.USER_KEY);
    return userJson ? JSON.parse(userJson) : null;
  }
}
