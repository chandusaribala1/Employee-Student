import { RecordId } from './record-id.model';

export interface Employee {
  id: RecordId;
  name: string;
  email: string;
  department: string;
  designation: string;
  salary: number;
}
