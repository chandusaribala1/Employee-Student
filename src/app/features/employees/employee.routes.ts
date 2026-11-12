import { Routes } from '@angular/router';
import { EmployeeListComponent, EmployeeProfileComponent, EmployeeFormComponent } from './employee-pages';
import { employeeResolver } from '../../core/resolvers/employee.resolver';
export const employeeRoutes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'list' },
  { path: 'list', component: EmployeeListComponent, title: 'Employees' },
  { path: 'add', component: EmployeeFormComponent, title: 'Add employee' },
  { path: 'view/:id', component: EmployeeProfileComponent, resolve: { employee: employeeResolver }, title: 'Employee profile' },
  { path: 'edit/:id', component: EmployeeFormComponent, title: 'Edit employee' }
];
