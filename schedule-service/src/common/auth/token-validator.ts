export interface JwtPayload {
  sub: string;
  email: string;
  roles: string[];
  [key: string]: unknown;
}

export abstract class TokenValidator {
  abstract validate(token: string): Promise<JwtPayload>;
}
