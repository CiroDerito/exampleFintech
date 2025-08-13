import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';

describe('AuthService', () => {
  let service: AuthService;
  let usersService: Partial<UsersService>;
  let jwtService: Partial<JwtService>;

  beforeEach(async () => {
    usersService = {
      findByEmail: jest.fn().mockResolvedValue({ id: '1', email: 'test@mail.com', password: '$2b$10$hash', isActive: true }),
    };
    jwtService = {
      sign: jest.fn().mockReturnValue('jwt-token'),
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
        { provide: JwtService, useValue: jwtService },
      ],
    }).compile();
    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('login returns access_token and user', async () => {
    const user = { id: '1', email: 'test@mail.com', password: 'hash', isActive: true };
    const result = await service.login(user);
    expect(result).toHaveProperty('access_token');
    expect(result).toHaveProperty('refresh_token');
    expect(result).toHaveProperty('user');
  });
});
