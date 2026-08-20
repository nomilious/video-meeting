import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { RegisterUserCommand } from './commands/register-user.command';
import { AuthCredentialsDto } from './dto/auth-credentials.dto';
import { LoginUserQuery } from './queries/login-user.query';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post('register')
  register(@Body() credentials: AuthCredentialsDto) {
    return this.commandBus.execute(
      new RegisterUserCommand(credentials.email, credentials.password),
    );
  }

  @HttpCode(200)
  @Post('login')
  login(@Body() credentials: AuthCredentialsDto) {
    return this.queryBus.execute(
      new LoginUserQuery(credentials.email, credentials.password),
    );
  }
}
