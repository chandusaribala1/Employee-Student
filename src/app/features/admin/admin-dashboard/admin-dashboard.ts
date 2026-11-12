import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { EmployeeService } from '../../../core/services/employee.service';
import { StudentService } from '../../../core/services/student.service';
import { Employee } from '../../../models/employee.model';
import { Student } from '../../../models/student.model';
import { FilterByPipe } from '../../../shared/pipes/filter-by.pipe';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [RouterLink, FilterByPipe],
  templateUrl: './admin-dashboard.html',
  styleUrl: './admin-dashboard.css'
})
export class AdminDashboardComponent {
  private readonly employeeService = inject(EmployeeService);
  private readonly studentService = inject(StudentService);

  employees: Employee[] = [];
  students: Student[] = [];
  employeeLoading = true;
  studentLoading = true;
  employeeError = '';
  studentError = '';
  employeeSearch = '';
  departmentFilter = '';
  studentSearch = '';
  courseFilter = '';

  constructor() {
    this.employeeService.getEmployees().subscribe({
      next: employees => {
        this.employees = employees;
        this.employeeLoading = false;
      },
      error: () => {
        this.employeeError = 'Could not load employees. Check that JSON Server is running.';
        this.employeeLoading = false;
      }
    });

    this.studentService.getStudents().subscribe({
      next: students => {
        this.students = students;
        this.studentLoading = false;
      },
      error: () => {
        this.studentError = 'Could not load students. Check that JSON Server is running.';
        this.studentLoading = false;
      }
    });
  }

  get departments(): string[] {
    return [...new Set(this.employees.map(employee => employee.department))].sort();
  }

  get courses(): string[] {
    return [...new Set(this.students.map(student => student.course))].sort();
  }

  studentsAssignedTo(employee: Employee): number {
    return this.students.filter(student => String(student.employeeId) === String(employee.id)).length;
  }

  assignedEmployeeName(student: Student): string {
    if (student.employeeId === undefined) return 'Not assigned';
    return this.employees.find(employee => String(employee.id) === String(student.employeeId))?.name ?? 'Not assigned';
  }
}
