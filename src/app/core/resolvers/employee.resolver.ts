import { inject } from '@angular/core';
import { ResolveFn, Router } from '@angular/router';
import { catchError, of } from 'rxjs';
import { Employee } from '../../models/employee.model';
import { EmployeeService } from '../services/employee.service';

export const employeeResolver: ResolveFn<Employee | null> = route => {
  const id = route.paramMap.get('id');
  const router = inject(Router);

  if (!id) {
    void router.navigate(['/not-found']);
    return of(null);
  }

  return inject(EmployeeService).getEmployee(id).pipe(catchError(() => {
    void router.navigate(['/not-found']);
    return of(null);
  }));
};
