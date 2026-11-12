import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, switchMap } from 'rxjs';
import { SessionUser, User, UserRole } from '../../models/user.model';

const API = 'http://localhost:3000';
const SESSION_KEY = 'management-demo-session';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private session: SessionUser | null = this.readSession();

  login(name: string, password: string, role: UserRole): Observable<SessionUser> {
    return this.http.get<User[]>(`${API}/users`).pipe(
      map(users => {
        const match = users.find(user => user.name.toLowerCase() === name.trim().toLowerCase()
          && user.password === password && user.role === role);
        if (!match) throw new Error('Name, password or selected role is incorrect.');
        const { password: _password, ...safeUser } = match;
        this.setSession(safeUser);
        return safeUser;
      })
    );
  }

  emailExists(email: string): Observable<boolean> {
    return this.http.get<User[]>(`${API}/users`).pipe(
      map(users => users.some(user => user.email.toLowerCase() === email.trim().toLowerCase()))
    );
  }

  register(user: Omit<User, 'id'>): Observable<User> {
    return this.http.get<User[]>(`${API}/users`).pipe(
      map(users => {
        if (users.some(existing => existing.email.toLowerCase() === user.email.toLowerCase())) {
          throw new Error('An account with this email already exists.');
        }
        return user;
      }),
      switchMap(validUser => this.http.post<User>(`${API}/users`, validUser))
    );
  }

  currentUser(): SessionUser | null { return this.session; }
  hasRole(roles: UserRole[]): boolean { return !!this.session && roles.includes(this.session.role); }
  logout(): void { this.session = null; localStorage.removeItem(SESSION_KEY); }

  private setSession(user: SessionUser): void {
    this.session = user;
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
  }

  private readSession(): SessionUser | null {
    try {
      const value = localStorage.getItem(SESSION_KEY);
      return value ? JSON.parse(value) as SessionUser : null;
    } catch { return null; }
  }
}
