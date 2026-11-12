import { Routes } from '@angular/router';
import { StudentListComponent, StudentProfileComponent, StudentFormComponent } from './student-pages';
import { studentResolver } from '../../core/resolvers/student.resolver';
export const studentRoutes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'list' },
  { path: 'list', component: StudentListComponent, title: 'Students' },
  { path: 'add', component: StudentFormComponent, title: 'Add student' },
  { path: 'view/:id', component: StudentProfileComponent, resolve: { student: studentResolver }, title: 'Student profile' },
  { path: 'edit/:id', component: StudentFormComponent, resolve: { student: studentResolver }, title: 'Edit student' }
];
