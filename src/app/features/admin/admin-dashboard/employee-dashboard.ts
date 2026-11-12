import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { EmployeeService } from '../../../core/services/employee.service';
import { StudentService } from '../../../core/services/student.service';
import { Employee } from '../../../models/employee.model';
import { Student } from '../../../models/student.model';
import { FilterByPipe } from '../../../shared/pipes/filter-by.pipe';

@Component({
  selector: 'app-employee-dashboard',
  standalone: true,
  imports: [RouterLink, FilterByPipe],
  templateUrl: './employee-dashboard.html',
  styleUrl: './employee-dashboard.css'
})
export class EmployeeDashboardComponent {
  readonly auth = inject(AuthService);
  private readonly employeeService = inject(EmployeeService);
  private readonly studentService = inject(StudentService);

  employee: Employee | null = null;
  students: Student[] = [];
  loading = true;
  error = '';
  search = '';
  courseFilter = '';

  constructor() {
    const user = this.auth.currentUser();
    if (!user) {
      this.error = 'Please sign in again.';
      this.loading = false;
      return;
    }

    this.employeeService.getEmployees().subscribe({
      next: employees => {
        this.employee = user.profileId
          ? employees.find(item => String(item.id) === String(user.profileId)) ?? null
          : employees.find(item => item.email.toLowerCase() === user.email.toLowerCase()) ?? null;
        if (!this.employee) {
          this.error = 'Your employee profile is not linked to this account.';
          this.loading = false;
          return;
        }
        this.studentService.getStudentsForEmployee(this.employee).subscribe({
          next: students => { this.students = students; this.loading = false; },
          error: () => { this.error = 'Could not load your assigned students. Check JSON Server.'; this.loading = false; }
        });
      },
      error: () => { this.error = 'Could not load your employee profile. Check JSON Server.'; this.loading = false; }
    });
  }

  get courses(): string[] { return [...new Set(this.students.map(student => student.course))].sort(); }
}
