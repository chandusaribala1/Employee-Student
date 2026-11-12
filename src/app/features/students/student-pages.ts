import { Component, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActionButtonsComponent } from '../../shared/components/action-buttons/action-buttons';
import { AuthService } from '../../core/services/auth.service';
import { EmployeeService } from '../../core/services/employee.service';
import { StudentService, courseMatchesDesignation } from '../../core/services/student.service';
import { Employee } from '../../models/employee.model';
import { RecordId } from '../../models/record-id.model';
import { Student } from '../../models/student.model';
import { FilterByPipe } from '../../shared/pipes/filter-by.pipe';

@Component({
  selector: 'app-student-list',
  standalone: true,
  imports: [RouterLink, ActionButtonsComponent, FilterByPipe],
  templateUrl: './student-list.html',
  styleUrl: './student-list.css'
})
export class StudentListComponent {
  private readonly service = inject(StudentService);
  private readonly employeesService = inject(EmployeeService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  rows: Student[] = [];
  employeeNames: Record<string, string> = {};
  loading = true;
  error = '';
  success = '';
  search = '';
  course = '';

  constructor() {
    this.route.queryParamMap.subscribe(params => this.course = params.get('course') ?? '');
    const user = this.auth.currentUser();

    if (user?.role === 'EMPLOYEE') {
      this.employeesService.getEmployees().subscribe({
        next: employees => {
          this.indexEmployees(employees);
          const employee = user.profileId
            ? employees.find(item => String(item.id) === String(user.profileId))
            : employees.find(item => item.email.toLowerCase() === user.email.toLowerCase());
          if (!employee) {
            this.error = 'Your employee profile is not linked to this account.';
            this.loading = false;
            return;
          }
          this.service.getStudentsForEmployee(employee).subscribe({
            next: students => { this.rows = students; this.loading = false; },
            error: () => { this.error = 'Could not load your assigned students. Check JSON Server.'; this.loading = false; }
          });
        },
        error: () => { this.error = 'Could not load your employee profile. Check JSON Server.'; this.loading = false; }
      });
    } else {
      this.employeesService.getEmployees().subscribe({
        next: employees => this.indexEmployees(employees),
        error: () => undefined
      });
      this.service.getStudents().subscribe({
        next: students => { this.rows = students; this.loading = false; },
        error: () => { this.error = 'Could not load students. Check JSON Server at localhost:3000.'; this.loading = false; }
      });
    }
  }

  get courses(): string[] { return [...new Set(this.rows.map(student => student.course))].sort(); }
  private indexEmployees(employees: Employee[]): void {
    this.employeeNames = Object.fromEntries(employees.map(employee => [String(employee.id), employee.name]));
  }
  assignedEmployeeName(student: Student): string {
    return student.employeeId === undefined ? 'Not assigned' : this.employeeNames[String(student.employeeId)] ?? 'Not assigned';
  }
  setCourse(value: string): void {
    this.course = value;
    this.router.navigate([], { relativeTo: this.route, queryParams: { course: value || null }, queryParamsHandling: 'merge' });
  }

  view(id: RecordId): void { this.router.navigate(['../view', id], { relativeTo: this.route }); }
  edit(id: RecordId): void { this.router.navigate(['../edit', id], { relativeTo: this.route }); }

  remove(id: RecordId): void {
    if (!confirm('Delete this student? This cannot be undone.')) return;
    this.service.deleteStudent(id).subscribe({
      next: () => {
        this.rows = this.rows.filter(student => String(student.id) !== String(id));
        this.success = 'Student deleted.';
      },
      error: () => this.error = 'Delete failed. Please try again.'
    });
  }
}

@Component({
  selector: 'app-student-profile',
  standalone: true,
  imports: [RouterLink, ReactiveFormsModule],
  templateUrl: './student-profile.html',
  styleUrl: './student-profile.css'
})
export class StudentProfileComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly employeeService = inject(EmployeeService);
  private readonly studentService = inject(StudentService);
  private readonly auth = inject(AuthService);
  private readonly fb = inject(FormBuilder);
  student = this.route.snapshot.data['student'] as Student | null;
  readonly own = this.route.snapshot.data['own'] === true;
  readonly backLink = this.own
    ? '/student/dashboard'
    : this.auth.currentUser()?.role === 'EMPLOYEE' ? '/employee/students/list' : '/admin/students/list';
  assignedEmployeeName = '';
  editingPersonal = false;
  profileSaved = false;
  savingProfile = false;
  profileError = '';
  readonly personalForm = this.fb.nonNullable.group({
    phone: ['', [Validators.pattern(/^\d{0,15}$/)]],
    address: [''],
    skills: ['']
  });

  constructor() {
    this.patchPersonalForm();
    if (this.student?.employeeId) {
      this.employeeService.getEmployee(this.student.employeeId).subscribe({
        next: employee => this.assignedEmployeeName = employee.name,
        error: () => this.assignedEmployeeName = ''
      });
    }
  }

  private patchPersonalForm(): void {
    if (!this.student) return;
    this.personalForm.patchValue({
      phone: this.student.phone ?? '',
      address: this.student.address ?? '',
      skills: this.student.skills?.join(', ') ?? ''
    });
  }

  keepPhoneDigits(event: Event): void {
    const input = event.target as HTMLInputElement;
    const digits = input.value.replace(/\D/g, '').slice(0, 15);
    input.value = digits;
    this.personalForm.controls.phone.setValue(digits);
  }

  cancelPersonalEdit(): void {
    this.patchPersonalForm();
    this.profileError = '';
    this.editingPersonal = false;
  }

  editPersonalInfo(): void {
    this.profileError = '';
    this.profileSaved = false;
    this.editingPersonal = true;
  }

  savePersonalInfo(): void {
    if (!this.student) return;
    if (this.personalForm.invalid) {
      this.personalForm.markAllAsTouched();
      return;
    }
    const value = this.personalForm.getRawValue();
    const updated: Omit<Student, 'id'> = {
      name: this.student.name,
      email: this.student.email,
      course: this.student.course,
      year: this.student.year,
      phone: value.phone.replace(/\D/g, ''),
      address: value.address.trim(),
      skills: value.skills.split(',').map(skill => skill.trim()).filter(Boolean),
      employeeId: this.student.employeeId
    };
    this.savingProfile = true;
    this.profileError = '';
    this.studentService.updateStudent(this.student.id, updated).subscribe({
      next: student => {
        this.student = student;
        this.patchPersonalForm();
        this.editingPersonal = false;
        this.profileSaved = true;
        this.savingProfile = false;
      },
      error: () => {
        this.profileError = 'Could not save your profile. Please try again.';
        this.savingProfile = false;
      }
    });
  }
}

@Component({
  selector: 'app-student-form',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './student-form.html',
  styleUrl: './student-form.css'
})
export class StudentFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(StudentService);
  private readonly employeeService = inject(EmployeeService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);

  readonly user = this.auth.currentUser();
  readonly role = this.user?.role;
  readonly id = this.route.snapshot.paramMap.get('id') ?? '';
  readonly editing = this.route.snapshot.routeConfig?.path?.startsWith('edit') ?? false;
  readonly listLink = this.role === 'EMPLOYEE' ? '/employee/students/list' : '/admin/students/list';
  readonly availableCourses = ['Computer Science', 'Software Development', 'Data Science', 'Business Administration', 'Finance'];
  employees: Employee[] = [];
  currentEmployee: Employee | null = null;
  currentStudent: Student | null = null;
  employeeLoading = false;
  employeeError = '';
  saving = false;
  error = '';

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    course: ['', Validators.required],
    year: [1, [Validators.required, Validators.min(1), Validators.max(8)]],
    employeeId: ['', this.role === 'ADMIN' ? Validators.required : []]
  });

  constructor() {
    if (this.role === 'ADMIN') this.loadEmployees();
    if (this.role === 'EMPLOYEE') {
      this.form.controls.employeeId.disable();
      this.loadCurrentEmployee();
    }

    if (this.editing) {
      const student = this.route.snapshot.data['student'] as Student | null;
      if (student) this.patchForm(student);
      else this.loadStudent();
    }
  }

  private loadEmployees(): void {
    this.employeeLoading = true;
    this.employeeService.getEmployees().subscribe({
      next: employees => { this.employees = employees; this.employeeLoading = false; },
      error: () => { this.employeeError = 'Could not load employee assignments.'; this.employeeLoading = false; }
    });
  }

  private loadCurrentEmployee(): void {
    this.employeeLoading = true;
    this.employeeService.getEmployees().subscribe({
      next: employees => {
        this.currentEmployee = this.user?.profileId
          ? employees.find(employee => String(employee.id) === String(this.user?.profileId)) ?? null
          : employees.find(employee => employee.email.toLowerCase() === this.user?.email.toLowerCase()) ?? null;
        this.employeeLoading = false;
        if (this.currentEmployee) this.form.controls.employeeId.setValue(String(this.currentEmployee.id));
        else this.employeeError = 'Your employee profile is not linked to this account.';
      },
      error: () => { this.employeeError = 'Could not load your employee profile.'; this.employeeLoading = false; }
    });
  }

  private loadStudent(): void {
    this.service.getStudent(this.id).subscribe({
      next: student => this.patchForm(student),
      error: () => this.error = 'Student could not be loaded.'
    });
  }

  private patchForm(student: Student): void {
    this.currentStudent = student;
    this.form.patchValue({
      name: student.name,
      course: student.course,
      year: student.year,
      employeeId: student.employeeId === undefined ? '' : String(student.employeeId)
    });
  }

  get courseOptions(): string[] {
    return this.role === 'EMPLOYEE' && this.currentEmployee
      ? this.availableCourses.filter(course => courseMatchesDesignation(course, this.currentEmployee?.designation))
      : this.availableCourses;
  }

  get eligibleEmployees(): Employee[] {
    const course = this.form.controls.course.value;
    return course
      ? this.employees.filter(employee => courseMatchesDesignation(course, employee.designation))
      : this.employees;
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    if (this.role === 'EMPLOYEE' && !this.currentEmployee) {
      this.error = this.employeeError || 'Your employee profile is not available.';
      return;
    }

    const value = this.form.getRawValue();
    if (this.role === 'EMPLOYEE' && !courseMatchesDesignation(value.course, this.currentEmployee?.designation)) {
      this.error = `Choose a course that matches your ${this.currentEmployee?.designation ?? 'employee'} designation.`;
      return;
    }
    if (this.role === 'ADMIN' && value.employeeId) {
      const selectedEmployee = this.employees.find(employee => String(employee.id) === String(value.employeeId));
      if (!selectedEmployee || !courseMatchesDesignation(value.course, selectedEmployee.designation)) {
        this.error = 'Choose an employee whose designation matches the student course.';
        return;
      }
    }

    const student: Omit<Student, 'id'> = {
      name: value.name.trim(),
      email: this.currentStudent?.email ?? '',
      course: value.course,
      year: Number(value.year),
      phone: this.currentStudent?.phone ?? '',
      address: this.currentStudent?.address ?? '',
      skills: this.currentStudent?.skills ?? [],
      employeeId: this.role === 'EMPLOYEE' ? this.currentEmployee?.id : value.employeeId || undefined
    };

    this.saving = true;
    this.error = '';
    const request = this.editing ? this.service.updateStudent(this.id, student) : this.service.addStudent(student);
    request.subscribe({
      next: () => this.router.navigateByUrl(this.listLink),
      error: () => {
        this.saving = false;
        this.error = 'Save failed. Check that JSON Server is running at localhost:3000, then try again.';
      }
    });
  }
}
