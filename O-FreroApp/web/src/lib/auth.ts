import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { resetPasswordEmail, verificationEmail } from "@/emails/templates";
import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { env } from "@/lib/env";
import { onEmailVerified, onSessionCreated } from "@/server/accounts";
import { resolveReferrer } from "@/server/referrals";

export const auth = betterAuth({
  baseURL: env.BETTER_AUTH_URL,
  secret: env.BETTER_AUTH_SECRET,
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    revokeSessionsOnPasswordReset: true,
    sendResetPassword: async ({ user, url }) => {
      await sendEmail({ to: user.email, ...resetPasswordEmail(url) });
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    // Off: the person clicking the link is not necessarily the one who signed up.
    autoSignInAfterVerification: false,
    sendVerificationEmail: async ({ user, url }) => {
      await sendEmail({ to: user.email, ...verificationEmail(url) });
    },
    afterEmailVerification: async (user, request) => {
      await onEmailVerified(user, request);
    },
  },
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          const code = typeof user.referralCodeUsed === "string" ? user.referralCodeUsed : null;
          return { data: { ...user, referralCodeUsed: code?.trim().toUpperCase() || null, referredById: await resolveReferrer(code) } };
        },
      },
    },
    session: {
      create: {
        after: async (session) => {
          await onSessionCreated(session.userId);
        },
      },
    },
  },
  user: {
    additionalFields: {
      role: { type: "string", defaultValue: "USER", input: false },
      /** Code typed or prefilled at sign-up; resolved to referredById below. */
      referralCodeUsed: { type: "string", required: false, input: true },
      referredById: { type: "string", required: false, input: false },
    },
  },
  plugins: [nextCookies()],
});

export type AuthSession = typeof auth.$Infer.Session;
