import { UserRole } from '../user-role.enum';

export class InviteUserDto {
  email: string;
  role: UserRole;
}
