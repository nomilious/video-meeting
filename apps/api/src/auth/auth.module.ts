import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { RegisterUserHandler } from './commands/register-user.handler';
import { LoginUserHandler } from './queries/login-user.handler';
import { AuthTokenService } from './auth-token.service';

@Module({
  imports: [
    CqrsModule,
    JwtModule.registerAsync({
      useFactory: () => ({
        secret: getJwtSecret(),
        signOptions: { expiresIn: '1h' },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthTokenService, RegisterUserHandler, LoginUserHandler],
})
export class AuthModule {}

function getJwtSecret() {
  if (process.env.JWT_SECRET) {
    return process.env.JWT_SECRET;
  }

  if (process.env.NODE_ENV === 'test') {
    return 'e2e-test-secret';
  }

  throw new Error('JWT_SECRET must be set');
}
