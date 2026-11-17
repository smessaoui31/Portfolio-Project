import { z } from "zod";

const optional = z.preprocess(
  (value) => (value === "" ? undefined : value),
  z.string().min(1).optional(),
);

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  BETTER_AUTH_SECRET: z.string().min(32),
  BETTER_AUTH_URL: z.url(),
  STRIPE_SECRET_KEY: optional,
  STRIPE_WEBHOOK_SECRET: optional,
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: optional,
  RESEND_API_KEY: optional,
  EMAIL_FROM: z.string().min(1).default("O'Frero <commandes@ofrero.fr>"),
  ADMIN_EMAIL: z.email(),
  ADMIN_PASSWORD: z.string().min(8),
  ADMIN_NAME: z.string().min(1).default("Admin O'Frero"),
});

export type Env = z.infer<typeof envSchema>;

export function parseEnv(source: Record<string, string | undefined>): Env {
  const result = envSchema.safeParse(source);
  if (!result.success) {
    const keys = [...new Set(result.error.issues.map((issue) => issue.path.join(".")))];
    throw new Error(`Invalid environment variables: ${keys.join(", ")}`);
  }
  return result.data;
}

let cached: Env | undefined;

/** Server-only environment, validated on first access. */
export const env: Env = new Proxy({} as Env, {
  get(_target, key: string) {
    cached ??= parseEnv(process.env);
    return cached[key as keyof Env];
  },
});
