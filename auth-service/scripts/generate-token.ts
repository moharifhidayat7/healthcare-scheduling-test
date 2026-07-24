import { JwtService } from '@nestjs/jwt';

const jwtService = new JwtService({
  secret: process.env.INTERNAL_JWT_SECRET ?? 'dev-secret-change-in-production',
});

const token = jwtService.sign({
  sub: 'user-1',
  email: 'dev@test.com',
  roles: ['user'],
});

console.log(token);
