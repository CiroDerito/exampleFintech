
import { IsEmail, IsString, MinLength, IsOptional, IsNotEmpty, IsNumber } from 'class-validator';
 export class CreateUserDto {
 
  @IsOptional()
  dni?: number; // dni es opcional, sin validaciones obligatorias

  @IsEmail()
  email: string;

  @IsString()
  name: string;


  @IsString()
  @MinLength(8)
  password: string;

  @IsOptional()
  @IsString()
  phone?: string;
}
