import { z } from 'zod';

export const envVarsSchema = z.object({
  // App
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  PORT: z.coerce.number().int().positive().max(65535).default(3000),
  SERVICE_NAME: z.string().default('unknown'),

  // Database
  DB_HOST: z.string().default('localhost'),

  // Database URL (constructed at runtime by compose, but can also be set directly)
  DATABASE_URL: z.string(),
  DB_PORT: z.coerce.number().int().positive().max(65535).default(5432),
  DB_USER: z.string().default('postgres'),
  DB_PASSWORD: z.string().default('postgres'),
  DB_NAME: z.string().default('auth_service'),

  // Auth
  INTERNAL_JWT_SECRET: z.string().min(8),
  AUTH_SERVICE_URL: z.string().url(),

  // Redis
  REDIS_HOST: z.string(),
  REDIS_PORT: z.coerce.number().int().positive().max(65535).default(6379),
  REDIS_PASSWORD: z.string().default(''),
  REDIS_DB: z.coerce.number().int().min(0).default(0),

  // Cache
  CACHE_TTL: z.coerce.number().int().positive().default(300),

  // Mail
  MAIL_HOST: z.string(),
  MAIL_PORT: z.coerce.number().int().positive().max(65535).default(587),
  MAIL_USER: z.string().optional(),
  MAIL_PASSWORD: z.string().optional(),
  MAIL_FROM: z.string().optional(),
});

export type Env = z.infer<typeof envVarsSchema>;
