
import { IsEmail, IsString, MinLength, IsOptional, IsNotEmpty, IsNumber } from 'class-validator';
 export class CreateUserDto {
 
  @IsNumber()
  dni: number;

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
