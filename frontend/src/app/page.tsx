import Link from "next/link";

import { auth } from "@/server/auth";
import { HydrateClient } from "@/trpc/server";

export default async function Home() {
	const session = await auth();

	return (
		<HydrateClient>
			<div>
				<h1>
					Welcome to Menkoverse
				</h1>
				<Link
					href={session ? "/api/auth/signout" : "/api/auth/signin"}
				>
					{session ? "Sign out" : "Sign in"}
				</Link>
			</div>
		</HydrateClient>
	);
}