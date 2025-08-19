import { IsEmail, IsString } from 'class-validator';
// DTO para el login. Recibe las credenciales del usuario.
export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  password: string;
}
