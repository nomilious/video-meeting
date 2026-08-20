export class LoginUserQuery {
  constructor(
    readonly email: string,
    readonly password: string,
  ) {}
}
