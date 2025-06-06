import { IsEmail, IsNotEmpty, IsString, MinLength, IsOptional, IsUUID } from 'class-validator';

export class RegisterDto {
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  @IsString({ message: 'Password must be a string' })
  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(8, { message: 'Password should be at least 8 characters long' })
  password: string;

  @IsString({ message: 'First name must be a string' })
  @IsNotEmpty({ message: 'First name is required' })
  firstName: string;

  @IsString({ message: 'Last name must be a string' })
  @IsNotEmpty({ message: 'Last name is required' })
  lastName: string;

  @IsUUID('4', { message: 'Practice ID must be a valid UUID' })
  @IsNotEmpty({ message: 'Practice ID is required' })
  practiceId: string;

  @IsString({ message: 'Role must be a string' })
  @IsOptional()
  role?: string;
} 