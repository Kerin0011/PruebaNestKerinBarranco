import { z } from 'zod';

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),
  DB_HOST: z.string().default('localhost'),
  DB_PORT: z.coerce.number().default(5433),
  DB_USER: z.string().default('postgres'),
  DB_PASSWORD: z.string().default('postgres'),
  DB_NAME: z.string().default('prueba_db'),
  DB_SYNC: z.enum(['true', 'false']).default('true').transform((v) => v === 'true'),
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.coerce.number().default(3600),
  ADMIN_EMAIL: z.string().email(),
  ADMIN_PASSWORD: z.string().min(8),
  API_KEY: z.string().min(8).default('fleetcore-secret-api-key-2026'),
  GITHUB_CLIENT_ID: z.string().optional().default('demo-github-client-id'),
  GITHUB_CLIENT_SECRET: z.string().optional().default('demo-github-client-secret'),
  GOOGLE_CLIENT_ID: z.string().optional().default('demo-google-client-id'),
});

export type Env = z.infer<typeof envSchema>;
