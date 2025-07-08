import { PrismaAdapter } from "@auth/prisma-adapter";
import type { Adapter, AdapterUser } from "next-auth/adapters";

export function CustomPrismaAdapter(prisma: any): Adapter {
  const base = PrismaAdapter(prisma);
  return {
    ...base,
    async createUser(user: AdapterUser & { sub?: string }): Promise<AdapterUser> {
      const createdUser = await prisma.user.create({
        data: {
          id: user.sub,
          name: null,
          email: user.email,
          emailVerified: user.emailVerified,
          image: user.image,
          isAdmin: null,
        },
      });
      return createdUser;
    },
  };
}
