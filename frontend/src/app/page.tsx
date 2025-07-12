import { SignIn } from "@/app/components/signIn";

export default async function Home() {
	return (
		<div
			className="min-h-screen bg-cover bg-center bg-no-repeat"
			style={{ backgroundImage: 'url(/bg/root.png)' }}
		>
			<SignIn />
		</div>
	);
}
