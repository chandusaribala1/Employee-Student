import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
@Component({ selector: 'app-student-dashboard', standalone: true, imports: [RouterLink], templateUrl: './student-dashboard.html', styleUrl: './student-dashboard.css' })
export class StudentDashboardComponent { readonly auth = inject(AuthService); }
