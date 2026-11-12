import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './header.html',
  styleUrl: './header.css'
})
export class HeaderComponent {
  readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  get homeLink(): string {
    const role = this.auth.currentUser()?.role;
    if (role === 'ADMIN') return '/admin/dashboard';
    if (role === 'EMPLOYEE') return '/employee/dashboard';
    if (role === 'STUDENT') return '/student/dashboard';
    return '/login';
  }

  logout(): void { this.auth.logout(); this.router.navigate(['/login']); }
}
