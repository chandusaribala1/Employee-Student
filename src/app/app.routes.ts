import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';
import { studentResolver } from './core/resolvers/student.resolver';

export const routes: Routes = [
  { path: 'login', loadComponent: () => import('./features/auth/login/login').then(m => m.LoginComponent), title: 'Sign in' },
  { path: 'register', loadComponent: () => import('./features/auth/register/register').then(m => m.RegisterComponent), title: 'Create account' },
  {
    path: 'admin', canActivate: [authGuard, roleGuard], data: { roles: ['ADMIN'] },
    loadComponent: () => import('./layout/admin-layout/admin-layout').then(m => m.AdminLayoutComponent),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      { path: 'dashboard', loadComponent: ()=> import('./features/admin/admin-dashboard/admin-dashboard').then(m => m.AdminDashboardComponent), title: 'Admin Dashboard' },
      { path: 'employees', loadChildren: () => import('./features/employees/employee.routes').then(m => m.employeeRoutes) },
      { path: 'students', loadChildren: () => import('./features/students/student.routes').then(m => m.studentRoutes) }
    ]
  },
  {
    path: 'employee', canActivate: [authGuard, roleGuard], data: { roles: ['EMPLOYEE'] },
    loadComponent: () => import('./layout/employee-layout/employee-layout').then(m => m.EmployeeLayoutComponent),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      { path: 'dashboard', loadComponent: () => import('./features/admin/admin-dashboard/employee-dashboard').then(m => m.EmployeeDashboardComponent), title: 'Employee Dashboard' },
      { path: 'students', loadChildren: () => import('./features/students/student.routes').then(m => m.studentRoutes) }
    ]
  },
  {
    path: 'student', canActivate: [authGuard, roleGuard], data: { roles: ['STUDENT'] },
    loadComponent: () => import('./layout/student-layout/student-layout').then(m => m.StudentLayoutComponent),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      { path: 'dashboard', loadComponent: () => import('./features/admin/admin-dashboard/student-dashboard').then(m => m.StudentDashboardComponent), title: 'Student Dashboard' },
      { path: 'profile/:id', loadComponent: () => import('./features/students/student-pages').then(m => m.StudentProfileComponent), canActivate: [authGuard, roleGuard], data: { roles: ['STUDENT'], own: true }, resolve: { student: studentResolver }, title: 'My profile' }
    ]
  },
  { path: 'not-found', loadComponent: () => import('./features/not-found/not-found').then(m => m.NotFoundComponent), title: 'Page not found' },
  { path: '', pathMatch: 'full', redirectTo: 'login' },
  { path: '**', loadComponent: () => import('./features/not-found/not-found').then(m => m.NotFoundComponent), title: 'Page not found' }
];
