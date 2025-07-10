import { signOut } from "@/server/auth";

export default function Home() {
	return (
		<div>
			<button type="button">ゲームに参加する</button>
			<button
				type="button"
				onClick={async () => {
					"use server";
					await signOut({ redirectTo: "/" });
				}}
			>
				ログアウト
			</button>
		</div>
	);
}
