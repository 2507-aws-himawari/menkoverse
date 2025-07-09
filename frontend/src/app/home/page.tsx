import { signOut } from "@/server/auth";

export default function Home() {
	return (
    <div>
      <button>
        ゲームに参加する
      </button>
      <button onClick={async () => {
        "use server"
        await signOut({ redirectTo: "/" })
      }}>
        ログアウト
      </button>
    </div>
	);
}