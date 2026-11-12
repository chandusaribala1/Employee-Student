import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { UserRole } from '../../../models/user.model';
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder); private readonly auth = inject(AuthService); private readonly router = inject(Router); private readonly route = inject(ActivatedRoute);
  readonly form = this.fb.nonNullable.group({ name: ['', Validators.required], password: ['', Validators.required], role: ['ADMIN' as UserRole, Validators.required] });
  error = ''; loading = false;
  login(): void { if (this.form.invalid) return; this.loading = true; this.error = ''; const { name, password, role } = this.form.getRawValue(); this.auth.login(name, password, role).subscribe({ next: user => { this.loading = false; const fallback = user.role === 'ADMIN' ? '/admin/dashboard' : user.role === 'EMPLOYEE' ? '/employee/dashboard' : '/student/dashboard'; const destination = this.route.snapshot.queryParamMap.get('returnUrl'); this.router.navigateByUrl(destination?.startsWith('/') ? destination : fallback); }, error: err => { this.loading = false; this.error = err.message ?? 'Unable to sign in. Check that JSON Server is running.'; } }); }
}
