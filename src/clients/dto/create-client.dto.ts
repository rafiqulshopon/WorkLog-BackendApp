import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateClientDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  primaryContactName: string;

  @IsOptional()
  @IsEmail()
  primaryContactEmail: string;

  @IsOptional()
  @IsString()
  primaryContactPhone: string;

  @IsOptional()
  @IsEmail()
  companyEmail: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
