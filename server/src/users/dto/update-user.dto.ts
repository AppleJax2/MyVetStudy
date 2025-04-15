import { IsEmail, IsString, IsEnum, IsOptional, IsBoolean } from 'class-validator';
import { UserRole } from '@prisma/client';

export class UpdateUserDto {
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsOptional()
  email?: string;

  @IsString({ message: 'First name must be a string' })
  @IsOptional()
  firstName?: string;

  @IsString({ message: 'Last name must be a string' })
  @IsOptional()
  lastName?: string;

  @IsEnum(UserRole, { message: 'Role must be a valid user role' })
  @IsOptional()
  role?: UserRole;

  @IsBoolean({ message: 'isActive must be a boolean' })
  @IsOptional()
  isActive?: boolean;
} 