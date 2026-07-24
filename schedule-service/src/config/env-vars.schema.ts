import * as Joi from 'joi';

export const envVarsSchema = Joi.object({
  // App
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  PORT: Joi.number().integer().positive().max(65535).default(3000),
  SERVICE_NAME: Joi.string().default('unknown'),

  // Database
  DB_HOST: Joi.string().default('localhost'),
  DB_PORT: Joi.number().integer().positive().max(65535).default(5432),
  DB_USER: Joi.string().default('postgres'),
  DB_PASSWORD: Joi.string().default('postgres'),
  DB_NAME: Joi.string().default('auth_service'),

  // Auth
  INTERNAL_JWT_SECRET: Joi.string().min(8).required(),
  AUTH_SERVICE_URL: Joi.string().uri().required(),

  // Redis
  REDIS_HOST: Joi.string().required(),
  REDIS_PORT: Joi.number().integer().positive().max(65535).default(6379),
  REDIS_PASSWORD: Joi.string().allow('').optional(),
  REDIS_DB: Joi.number().integer().min(0).default(0),

  // Mail
  MAIL_HOST: Joi.string().required(),
  MAIL_PORT: Joi.number().integer().positive().max(65535).default(587),
  MAIL_USER: Joi.string().allow('').optional(),
  MAIL_PASSWORD: Joi.string().allow('').optional(),
  MAIL_FROM: Joi.string().default('noreply@example.com'),
});
