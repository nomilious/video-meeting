import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

export interface AuthTokenResponse {
  gvtToken: string;
}

@Injectable()
export class AuthTokenService {
  constructor(private readonly jwtService: JwtService) {}

  create(userId: string, email: string): AuthTokenResponse {
    return { gvtToken: this.jwtService.sign({ sub: userId, email }) };
  }
}
