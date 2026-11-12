import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Employee } from '../../models/employee.model';
import { Student } from '../../models/student.model';
import { StudentService, courseMatchesDesignation } from './student.service';

describe('StudentService employee assignments', () => {
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('returns only students assigned to the employee and matched to their designation', () => {
    const employee: Employee = {
      id: '101', name: 'Chandana', email: 'chandana@example.com',
      department: 'IT', designation: 'Developer', salary: 30000
    };
    let visible: Student[] = [];

    TestBed.inject(StudentService).getStudentsForEmployee(employee).subscribe(students => visible = students);

    const request = http.expectOne('http://localhost:3000/students');
    expect(request.request.method).toBe('GET');
    request.flush([
      { id: '301', name: 'Priya', email: 'priya@example.com', course: 'Software Development', year: 1, phone: '', employeeId: 101 },
      { id: '302', name: 'Ravi', email: 'ravi@example.com', course: 'Business Administration', year: 2, phone: '', employeeId: '101' },
      { id: '303', name: 'Meera', email: 'meera@example.com', course: 'Computer Science', year: 3, phone: '', employeeId: '102' }
    ]);

    expect(visible.map(student => student.name)).toEqual(['Priya']);
  });

  it('matches courses to common employee designations', () => {
    expect(courseMatchesDesignation('Software Development', 'Developer')).toBe(true);
    expect(courseMatchesDesignation('Computer Science', 'Developer')).toBe(true);
    expect(courseMatchesDesignation('Business Administration', 'Developer')).toBe(false);
    expect(courseMatchesDesignation('Business Administration', 'Accountant')).toBe(true);
  });

  it('generates the next numeric student ID before posting a new profile', () => {
    let created: Student | undefined;
    const student = {
      name: 'Anaya', email: '', course: 'Computer Science', year: 1,
      phone: '', address: '', skills: [], employeeId: 101
    };

    TestBed.inject(StudentService).addStudent(student).subscribe(result => created = result);

    const currentRecords = http.expectOne('http://localhost:3000/students');
    expect(currentRecords.request.method).toBe('GET');
    currentRecords.flush([
      { id: 301, name: 'Priya', email: '', course: 'Computer Science', year: 1, phone: '' }
    ]);

    const createRequest = http.expectOne('http://localhost:3000/students');
    expect(createRequest.request.method).toBe('POST');
    expect(createRequest.request.body.id).toBe(302);
    createRequest.flush({ ...student, id: 302 });

    expect(created?.id).toBe(302);
  });
});
