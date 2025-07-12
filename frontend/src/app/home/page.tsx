'use client';
import { SignOut } from "@/app/components/signOut";
import { useRouter } from 'next/navigation';
import { Footer } from "@/app/components/footer";

export default function HomePage() {
    const router = useRouter();

    const handleDeckManagement = () => {
        router.push('/decks');
    };

    const handleJoinGame = () => {
        router.push('/room/join');
    };

    return (
        <div>
            <div>
                <h1>メンコバース</h1>
                <div>
                    <button onClick={handleJoinGame}>
                        ゲーム参加
                    </button>
                    <button onClick={handleDeckManagement}>
                        デッキ管理
                    </button>
                    <SignOut />
                </div>
            </div>
            < Footer />
        </div>
    );
}
