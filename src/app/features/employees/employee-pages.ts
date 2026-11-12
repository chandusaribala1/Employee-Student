import { Component, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { EmployeeService } from '../../core/services/employee.service';
import { StudentService } from '../../core/services/student.service';
import { Employee } from '../../models/employee.model';
import { Student } from '../../models/student.model';
import { RecordId } from '../../models/record-id.model';
import { ActionButtonsComponent } from '../../shared/components/action-buttons/action-buttons';
import { FilterByPipe } from '../../shared/pipes/filter-by.pipe';

@Component({ selector: 'app-employee-list', standalone: true, imports: [RouterLink, ActionButtonsComponent, FilterByPipe], templateUrl: './employee-list.html', styleUrl: './employee-list.css' })
export class EmployeeListComponent {
  private readonly service=inject(EmployeeService); private readonly studentService=inject(StudentService); private readonly router=inject(Router); private readonly route=inject(ActivatedRoute);
  rows:Employee[]=[]; students:Student[]=[]; loading=true; error=''; search=''; department='';
  constructor(){ this.route.queryParamMap.subscribe(params=>this.department=params.get('department')??''); this.service.getEmployees().subscribe({next:rows=>{this.rows=rows;this.loading=false;},error:()=>{this.loading=false;this.error='Could not load employees. Check JSON Server at localhost:3000.';}}); this.studentService.getStudents().subscribe({next:rows=>this.students=rows,error:()=>this.error='Could not load student assignments.'}); }
  get departments():string[]{return [...new Set(this.rows.map(x=>x.department))].sort();}
  studentsAssignedTo(employee:Employee):number{return this.students.filter(student=>String(student.employeeId)===String(employee.id)).length;}
  setDepartment(value:string):void{this.department=value;this.router.navigate([], {relativeTo:this.route,queryParams:{department:value||null},queryParamsHandling:'merge'});}
  view(id:RecordId):void{this.router.navigate(['../view',id],{relativeTo:this.route});} edit(id:RecordId):void{this.router.navigate(['../edit',id],{relativeTo:this.route});}
  remove(id:RecordId):void{if(!confirm('Delete this employee? This cannot be undone.'))return;this.service.deleteEmployee(id).subscribe({next:()=>{this.rows=this.rows.filter(x=>String(x.id)!==String(id));},error:()=>this.error='Delete failed. Please try again.'});}
}

@Component({ selector:'app-employee-profile',standalone:true,imports:[RouterLink],templateUrl: './employee-profile.html',styleUrl: './employee-profile.css' })
export class EmployeeProfileComponent {
  readonly employee = inject(ActivatedRoute).snapshot.data['employee'] as Employee | null;
  readonly backLink = '/admin/employees/list';
}

@Component({selector:'app-employee-form',standalone:true,imports:[ReactiveFormsModule,RouterLink],templateUrl: './employee-form.html',styleUrl: './employee-form.css'})
export class EmployeeFormComponent {
  private readonly fb=inject(FormBuilder);private readonly service=inject(EmployeeService);private readonly route=inject(ActivatedRoute);private readonly router=inject(Router);
  readonly id=this.route.snapshot.paramMap.get('id')??'';readonly editing=this.route.snapshot.routeConfig?.path?.startsWith('edit')??false;saving=false;error='';
  readonly form=this.fb.nonNullable.group({name:['',[Validators.required,Validators.minLength(2)]],email:['',[Validators.required,Validators.email]],department:['',Validators.required],designation:['',Validators.required],salary:[0,[Validators.required,Validators.min(0)]]});
  constructor(){if(this.editing)this.service.getEmployee(this.id).subscribe({next:p=>this.form.patchValue(p),error:()=>this.error='Employee could not be loaded.'});}
  save():void{if(this.form.invalid){this.form.markAllAsTouched();return;}this.saving=true;this.error='';const value=this.form.getRawValue();const request=this.editing?this.service.updateEmployee(this.id,value):this.service.addEmployee(value);request.subscribe({next:()=>this.router.navigateByUrl('/admin/employees/list'),error:()=>{this.saving=false;this.error='Save failed. Check that JSON Server is running at localhost:3000, then try again.';}});}
}

