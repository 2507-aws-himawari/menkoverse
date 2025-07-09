import { auth, signIn } from "@/server/auth";
import { HydrateClient } from "@/trpc/server";

export default async function Home() {
	const session = await auth();

	return (
		<HydrateClient>
			<div>
				<h1>
					Welcome to Menkoverse
				</h1>
				<button onClick={async () => {
					"use server";
					await signIn(undefined, { redirectTo: "/home" });
				}}>
					ログイン
				</button>
			</div>
		</HydrateClient>
	);
}