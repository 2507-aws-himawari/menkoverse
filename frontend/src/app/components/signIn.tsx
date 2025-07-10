import { signIn } from "@/server/auth";

export function SignIn() {
	return (
		<form
			action={async () => {
				"use server";
				await signIn(undefined, { redirectTo: "/home" });
			}}
		>
			<button type="submit">Sign in</button>
		</form>
	);
}
