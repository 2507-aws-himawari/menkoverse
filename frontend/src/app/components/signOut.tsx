import { signOut } from "@/server/auth";

export function SignOut() {
	return (
		<form
			action={async () => {
				"use server";
				await signOut({ redirectTo: "/" });
			}}
		>
			<button type="submit">Sign Out</button>
		</form>
	);
}
