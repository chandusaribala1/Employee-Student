import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Student } from '../../models/student.model';
import { Employee } from '../../models/employee.model';
import { RecordId } from '../../models/record-id.model';
import { map, switchMap } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class StudentService {
  private readonly http = inject(HttpClient);
  private readonly url = 'http://localhost:3000/students';
  getStudents(): Observable<Student[]> { return this.http.get<Student[]>(this.url); }
  getStudentsForEmployee(employee: Employee): Observable<Student[]> {
    return this.getStudents().pipe(map(students => students.filter(student =>
      String(student.employeeId) === String(employee.id)
      && courseMatchesDesignation(student.course, employee.designation)
    )));
  }
  getStudent(id: RecordId): Observable<Student> { return this.http.get<Student>(`${this.url}/${encodeURIComponent(String(id))}`); }
  addStudent(student: Omit<Student, 'id'>): Observable<Student> {
    return this.getStudents().pipe(switchMap(students => {
      const numericIds = students.map(item => Number(item.id)).filter(Number.isSafeInteger);
      const id = Math.max(300, ...numericIds) + 1;
      return this.http.post<Student>(this.url, { ...student, id });
    }));
  }
  updateStudent(id: RecordId, student: Omit<Student, 'id'>): Observable<Student> { return this.http.put<Student>(`${this.url}/${encodeURIComponent(String(id))}`, { ...student, id }); }
  deleteStudent(id: RecordId): Observable<void> { return this.http.delete<void>(`${this.url}/${encodeURIComponent(String(id))}`); }
}

export function courseMatchesDesignation(course: string, designation: string | undefined): boolean {
  const courseName = course.toLowerCase();
  const jobTitle = (designation ?? '').toLowerCase();

  if (/developer|development|software|programmer|web/.test(jobTitle)) {
    return /computer|software|development|programming|data science|information technology|web/.test(courseName);
  }
  if (/account|finance/.test(jobTitle)) {
    return /business|finance|account|commerce/.test(courseName);
  }
  if (/human resources|\bhr\b/.test(jobTitle)) {
    return /business|management|psychology|human resources/.test(courseName);
  }
  return true;
}
