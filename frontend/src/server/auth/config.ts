import type { DefaultSession, NextAuthConfig } from "next-auth";
import Cognito from "next-auth/providers/cognito";
import { env } from "@/env";
import { CustomPrismaAdapter } from "./customAdapter";
import { db } from "@/server/db";
/**
 * Module augmentation for `next-auth` types. Allows us to add custom properties to the `session`
 * object and keep type safety.
 *
 * @see https://next-auth.js.org/getting-started/typescript#module-augmentation
 */
declare module "next-auth" {
	interface Session extends DefaultSession {
		user: {
			id: string;
			// ...other properties
			// role: UserRole;
		} & DefaultSession["user"];
	}

	// interface User {
	//   // ...other properties
	//   // role: UserRole;
	// }
}

/**
 * Options for NextAuth.js used to configure adapters, providers, callbacks, etc.
 *
 * @see https://next-auth.js.org/configuration/options
 */
export const authConfig = {
	providers: [
		Cognito({
			clientId: env.AUTH_COGNITO_CLIENT_ID,
			clientSecret: env.AUTH_COGNITO_CLIENT_SECRET,
			issuer: env.AUTH_COGNITO_ISSUER,
			allowDangerousEmailAccountLinking: true,
			profile(profile) {
				return {
					id: profile.sub,
					sub: profile.sub,
					email: profile.email,
					name: profile.name,
					preferred_username: profile.preferred_username,
					username: profile.username,
					emailVerified: profile.email_verified,
					image: profile.picture,
				};
			},
		}),
		/**
		 * ...add more providers here.
		 *
		 * Most other providers require a bit more work than the Discord provider. For example, the
		 * GitHub provider requires you to add the `refresh_token_expires_in` field to the Account
		 * model. Refer to the NextAuth.js docs for the provider you want to use. Example:
		 *
		 * @see https://next-auth.js.org/providers/github
		 */
	],
	adapter: CustomPrismaAdapter(db), // Use the custom adapter to handle Cognito's sub as user id
	secret: env.AUTH_SECRET,
	callbacks: {
		session: ({ session, user }) => ({
			...session,
			user: {
				...session.user,
				id: user.id,
			},
		}),
	},
} satisfies NextAuthConfig;
