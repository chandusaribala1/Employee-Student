import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree, convertToParamMap, provideRouter } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { EmployeeService } from '../services/employee.service';
import { StudentService } from '../services/student.service';
import { SessionUser, UserRole } from '../../models/user.model';
import { Student } from '../../models/student.model';
import { Observable } from 'rxjs';
import { authGuard } from './auth.guard';
import { studentResolver } from '../resolvers/student.resolver';
import { roleGuard } from './role.guard';

describe('role based access', () => {
  let user: SessionUser | null = null;
  const authStub = {
    currentUser: () => user,
    hasRole: (roles: UserRole[]) => !!user && roles.includes(user.role)
  };

  beforeEach(() => {
    user = null;
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authStub },
        { provide: EmployeeService, useValue: { getEmployee: vi.fn(), getEmployees: vi.fn() } },
        { provide: StudentService, useValue: { getStudent: vi.fn() } }
      ]
    });
  });

  function setUser(role: UserRole): void {
    user = { id: 1, name: 'Test User', email: 'test@example.com', role, profileId: 301 };
  }

  function authorize(role: UserRole, allowedRoles: UserRole[]): boolean | UrlTree {
    setUser(role);
    const route = { data: { roles: allowedRoles } } as unknown as ActivatedRouteSnapshot;
    return TestBed.runInInjectionContext(() => roleGuard(route, {} as RouterStateSnapshot)) as boolean | UrlTree;
  }

  it('allows admins into admin routes and sends them back to their dashboard from other roles’ routes', () => {
    expect(authorize('ADMIN', ['ADMIN'])).toBe(true);
    const denied = authorize('ADMIN', ['EMPLOYEE']);
    expect(TestBed.inject(Router).serializeUrl(denied as UrlTree)).toBe('/admin/dashboard');
  });

  it('allows employees into employee and student management but denies admin routes', () => {
    expect(authorize('EMPLOYEE', ['EMPLOYEE'])).toBe(true);
    expect(authorize('EMPLOYEE', ['ADMIN', 'EMPLOYEE'])).toBe(true);
    const denied = authorize('EMPLOYEE', ['ADMIN']);
    expect(TestBed.inject(Router).serializeUrl(denied as UrlTree)).toBe('/employee/dashboard');
  });

  it('allows students into student routes and denies admin routes', () => {
    expect(authorize('STUDENT', ['STUDENT'])).toBe(true);
    const router = TestBed.inject(Router);
    const deniedAdmin = authorize('STUDENT', ['ADMIN']);
    const deniedEmployeeManagement = authorize('STUDENT', ['ADMIN', 'EMPLOYEE']);
    expect(router.serializeUrl(deniedAdmin as UrlTree)).toBe('/student/dashboard');
    expect(router.serializeUrl(deniedEmployeeManagement as UrlTree)).toBe('/student/dashboard');
  });

  it('redirects unauthenticated users to login with a return URL', () => {
    const router = TestBed.inject(Router);
    const route = { data: { roles: ['ADMIN'] } } as unknown as ActivatedRouteSnapshot;
    const result = TestBed.runInInjectionContext(() =>
      authGuard(route, { url: '/admin/dashboard' } as RouterStateSnapshot)
    );
    expect(router.serializeUrl(result as UrlTree)).toContain('/login?returnUrl=');
  });

  it('does not request another student’s profile when a student changes the profile ID in the URL', () => {
    setUser('STUDENT');
    const router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const studentService = TestBed.inject(StudentService);
    const route = { paramMap: convertToParamMap({ id: '302' }) } as unknown as ActivatedRouteSnapshot;

    const result = TestBed.runInInjectionContext(() =>
      studentResolver(route, {} as RouterStateSnapshot)
    );

    expect(studentService.getStudent).not.toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/student/dashboard']);
    const emitted: (Student | null)[] = [];
    (result as Observable<Student | null>).subscribe(value => emitted.push(value));
    expect(emitted).toEqual([null]);
  });
});
