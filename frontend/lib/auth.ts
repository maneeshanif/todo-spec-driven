import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { bearer, jwt } from "better-auth/plugins";
import { Pool } from "pg";

// Token expiration constants
const SEVEN_DAYS_IN_SECONDS = 60 * 60 * 24 * 7; // 7 days
const ONE_DAY_IN_SECONDS = 60 * 60 * 24; // 1 day

export const auth = betterAuth({
  database: new Pool({
    connectionString: process.env.DATABASE_URL!,
  }),
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
    github: {
      clientId: process.env.GITHUB_CLIENT_ID as string,
      clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
    },
  },
  session: {
    expiresIn: SEVEN_DAYS_IN_SECONDS, // Session lasts 7 days
    updateAge: ONE_DAY_IN_SECONDS, // Refresh session expiration every 1 day
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // Cache for 5 minutes
    },
  },
  plugins: [
    bearer(), // Bearer token support
    jwt({
      jwt: {
        expirationTime: "7d", // JWT tokens last 7 days
      },
    }),
    nextCookies(), // Must be last plugin in array
  ],
  secret: process.env.BETTER_AUTH_SECRET!,
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
  trustedOrigins: ["http://localhost:3000"],
});

export type Session = typeof auth.$Infer.Session;
