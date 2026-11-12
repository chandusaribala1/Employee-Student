import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Employee } from '../../models/employee.model';
import { RecordId } from '../../models/record-id.model';
import { map, switchMap } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class EmployeeService {
  private readonly http = inject(HttpClient);
  private readonly url = 'http://localhost:3000/employees';
  getEmployees(): Observable<Employee[]> { return this.http.get<Employee[]>(this.url); }
  getEmployee(id: RecordId): Observable<Employee> { return this.http.get<Employee>(`${this.url}/${encodeURIComponent(String(id))}`); }
  addEmployee(employee: Omit<Employee, 'id'>): Observable<Employee> {
    return this.getEmployees().pipe(switchMap(employees => {
      const numericIds = employees.map(item => Number(item.id)).filter(Number.isSafeInteger);
      const id = Math.max(100, ...numericIds) + 1;
      return this.http.post<Employee>(this.url, { ...employee, id });
    }));
  }
  updateEmployee(id: RecordId, employee: Omit<Employee, 'id'>): Observable<Employee> { return this.http.put<Employee>(`${this.url}/${encodeURIComponent(String(id))}`, { ...employee, id }); }
  deleteEmployee(id: RecordId): Observable<void> { return this.http.delete<void>(`${this.url}/${encodeURIComponent(String(id))}`); }
}
