import { SignIn } from "@/app/components/signIn";

export default async function Home() {
	return (
		<div>
			<h1>Welcome to Menkoverse</h1>
			<SignIn />
		</div>
	);
}
