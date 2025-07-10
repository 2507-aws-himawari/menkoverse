import { signIn } from "@/server/auth";
import { HydrateClient } from "@/trpc/server";

export default async function Home() {
	return (
		<HydrateClient>
			<div>
				<h1>Welcome to Menkoverse</h1>
				<button
					type="button"
					onClick={async () => {
						"use server";
						await signIn(undefined, { redirectTo: "/home" });
					}}
				>
					ログイン
				</button>
			</div>
		</HydrateClient>
	);
}
