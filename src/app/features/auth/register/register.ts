import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { EmployeeService } from '../../../core/services/employee.service';
import { StudentService } from '../../../core/services/student.service';
import { User, UserRole } from '../../../models/user.model';

interface RegistrationFormValue {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: UserRole;
  course: string;
  designation: string;
}

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrl: './register.css'
})
export class RegisterComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly employeeService = inject(EmployeeService);
  private readonly studentService = inject(StudentService);
  private readonly router = inject(Router);

  readonly courses = ['Computer Science', 'Software Development', 'Data Science', 'Business Administration', 'Finance'];
  readonly designations = ['Developer', 'Accountant', 'HR Executive', 'Project Manager'];
  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', Validators.required],
    role: ['STUDENT' as UserRole, Validators.required],
    course: [''],
    designation: ['']
  });

  error = '';
  success = '';
  loading = false;

  constructor() { this.setRole(this.form.controls.role.value); }

  setRole(role: UserRole): void {
    const course = this.form.controls.course;
    const designation = this.form.controls.designation;
    course.setValidators(role === 'STUDENT' ? Validators.required : null);
    designation.setValidators(role === 'EMPLOYEE' ? Validators.required : null);
    course.updateValueAndValidity();
    designation.updateValueAndValidity();
  }

  register(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    if (value.password !== value.confirmPassword) {
      this.error = 'Passwords do not match.';
      return;
    }

    this.loading = true;
    this.error = '';
    this.success = '';
    const email = value.email.trim();
    this.auth.emailExists(email).subscribe({
      next: exists => {
        if (exists) {
          this.fail('An account with this email already exists.');
          return;
        }
        this.createRoleAccount({
          name: value.name.trim(), email, password: value.password, role: value.role,
          course: value.role === 'STUDENT' ? value.course : undefined,
          designation: value.role === 'EMPLOYEE' ? value.designation : undefined
        }, value);
      },
      error: () => this.fail('Could not check this email. Check JSON Server at localhost:3000.')
    });
  }

  private createRoleAccount(account: Omit<User, 'id'>, value: RegistrationFormValue): void {
    if (account.role === 'STUDENT') {
      this.studentService.addStudent({
        name: account.name,
        email: account.email,
        course: value.course,
        year: 1,
        phone: '',
        address: '',
        skills: []
      }).subscribe({
        next: profile => this.saveAccount({ ...account, profileId: profile.id }, () => this.studentService.deleteStudent(profile.id)),
        error: () => this.fail('Could not create the student profile. Check JSON Server.')
      });
      return;
    }

    if (account.role === 'EMPLOYEE') {
      this.employeeService.addEmployee({
        name: account.name,
        email: account.email,
        department: 'General',
        designation: account.designation ?? 'Employee',
        salary: 0
      }).subscribe({
        next: profile => this.saveAccount({ ...account, profileId: profile.id }, () => this.employeeService.deleteEmployee(profile.id)),
        error: () => this.fail('Could not create the employee profile. Check JSON Server.')
      });
      return;
    }

    this.saveAccount(account);
  }

  private saveAccount(account: Omit<User, 'id'>, rollback?: () => import('rxjs').Observable<void>): void {
    this.auth.register(account).subscribe({
      next: () => this.complete(),
      error: error => {
        if (!rollback) {
          this.fail(this.errorMessage(error));
          return;
        }
        rollback().subscribe({ next: () => this.fail(this.errorMessage(error)), error: () => this.fail(this.errorMessage(error)) });
      }
    });
  }

  private complete(): void {
    this.loading = false;
    this.success = 'Account created. Redirecting to sign in…';
    setTimeout(() => this.router.navigate(['/login']), 700);
  }

  private fail(message: string): void { this.loading = false; this.error = message; }
  private errorMessage(error: unknown): string {
    return error && typeof error === 'object' && 'message' in error
      ? String(error.message)
      : 'Registration failed. Check JSON Server and try again.';
  }
}
