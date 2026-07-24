import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { TokenValidator, JwtPayload } from '../token-validator';

@Injectable()
export class RemoteAuthValidator extends TokenValidator {
  private readonly url: string;
  private readonly timeoutMs: number;

  constructor(config: ConfigService) {
    super();
    this.url = config.get<string>('AUTH_SERVICE_URL', 'http://localhost:4000');
    this.timeoutMs = 2000;
  }

  async validate(token: string): Promise<JwtPayload> {
    const query = `
      mutation ValidateToken($token: String!) {
        validateToken(token: $token) {
          sub
          email
          roles
        }
      }
    `;

    const { data } = await axios.post<{
      data?: { validateToken: JwtPayload };
      errors?: Array<{ message: string }>;
    }>(
      `${this.url}/graphql`,
      { query, variables: { token } },
      { timeout: this.timeoutMs },
    );

    if (data.errors?.length) {
      throw new Error(data.errors[0].message);
    }

    return data.data!.validateToken;
  }
}
