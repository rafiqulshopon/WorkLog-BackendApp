import { IsEmail, IsNotEmpty, IsEnum } from 'class-validator';
import { UserRole } from '../user-role.enum';

export class InviteUserDto {
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsEnum(UserRole)
  role: UserRole;
}
