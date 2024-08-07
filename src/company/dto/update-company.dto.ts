import {
  IsString,
  IsOptional,
  IsUrl,
  IsEmail,
  IsInt,
  IsDate,
  IsBoolean,
} from 'class-validator';

export class UpdateCompanyDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsUrl()
  website?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsString()
  logo?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsDate()
  foundedAt?: Date;

  @IsOptional()
  @IsString()
  industry?: string;

  @IsOptional()
  @IsInt()
  size?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
