import { RecordId } from './record-id.model';

export type UserRole = 'ADMIN' | 'EMPLOYEE' | 'STUDENT';

export interface User {
  id: RecordId;
  name: string;
  email: string;
  password: string; // Demo only: real systems must never return/store plaintext passwords.
  role: UserRole;
  profileId?: RecordId;
  course?: string;
  designation?: string;
}

export type SessionUser = Omit<User, 'password'>;
