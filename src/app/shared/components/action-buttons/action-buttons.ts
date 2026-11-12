import { Component, EventEmitter, Input, Output } from '@angular/core';
import { RecordId } from '../../../models/record-id.model';
@Component({
  selector: 'app-action-buttons',
  standalone: true,
  templateUrl: './action-buttons.html',
  styleUrl: './action-buttons.css'
})
export class ActionButtonsComponent {
  @Input({ required: true }) itemId!: RecordId;
  @Output() view = new EventEmitter<RecordId>();
  @Output() edit = new EventEmitter<RecordId>();
  @Output('delete') remove = new EventEmitter<RecordId>();
}
