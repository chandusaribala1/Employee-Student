import { inject } from '@angular/core';
import { ResolveFn, Router } from '@angular/router';
import { catchError, map, of, switchMap } from 'rxjs';
import { Student } from '../../models/student.model';
import { AuthService } from '../services/auth.service';
import { EmployeeService } from '../services/employee.service';
import { StudentService, courseMatchesDesignation } from '../services/student.service';

export const studentResolver: ResolveFn<Student | null> = route => {
  const id = route.paramMap.get('id');
  const user = inject(AuthService).currentUser();
  const router = inject(Router);
  const employeeService = inject(EmployeeService);
  const studentService = inject(StudentService);

  if (!id) {
    void router.navigate(['/not-found']);
    return of(null);
  }

  if (user?.role === 'STUDENT' && String(user.profileId) !== id) {
    void router.navigate(['/student/dashboard']);
    return of(null);
  }

  return studentService.getStudent(id).pipe(
    switchMap(student => {
      if (user?.role !== 'EMPLOYEE') return of(student);

      const employee$ = user.profileId
        ? employeeService.getEmployee(user.profileId).pipe(
            catchError(() => employeeService.getEmployees().pipe(
              map(employees => employees.find(employee => employee.email.toLowerCase() === user.email.toLowerCase()) ?? null)
            ))
          )
        : employeeService.getEmployees().pipe(
            map(employees => employees.find(employee => employee.email.toLowerCase() === user.email.toLowerCase()) ?? null)
          );

      return employee$.pipe(map(employee => {
        const canViewStudent = employee
          && String(student.employeeId) === String(employee.id)
          && courseMatchesDesignation(student.course, employee.designation);
        if (!canViewStudent) void router.navigate(['/employee/dashboard']);
        return canViewStudent ? student : null;
      }));
    }),
    catchError(() => {
      void router.navigate(['/not-found']);
      return of(null);
    })
  );
};
