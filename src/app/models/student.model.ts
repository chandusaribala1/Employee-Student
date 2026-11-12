import { RecordId } from './record-id.model';

export interface Student {
  id: RecordId;
  name: string;
  email: string;
  course: string;
  year: number;
  phone: string;
  address?: string;
  skills?: string[];
  employeeId?: RecordId;
}
