class Profile {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  address?: string;
  role: string;
  companyId: number;
}

export class UserProfileDto {
  message: string;
  data: Profile;
}
