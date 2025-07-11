'use client';
import { SignOut } from "@/app/components/signOut";
import { useRouter } from 'next/navigation';

export default function HomePage() {
    const router = useRouter();

    const handleJoinGame = () => {
        router.push('/room/join');
    };

    return (
        <div>
            <div>
                <h1>メンコバース</h1>
                <p>メンコで遊ぼう！</p>

                <div>
                    <button onClick={handleJoinGame}>
                        ゲーム参加
                    </button>
<SignOut />
                </div>
            </div>
        </div>
    );
}