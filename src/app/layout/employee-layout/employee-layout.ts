import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from '../../shared/header/header';
import { SidebarComponent } from '../../shared/sidebar/sidebar';
@Component({
  selector: 'app-employee-layout',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent, SidebarComponent],
  templateUrl: './employee-layout.html',
  styleUrl: './employee-layout.css'
})
export class EmployeeLayoutComponent {}
