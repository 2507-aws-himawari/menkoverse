'use client';
import { SignOut } from "@/app/components/signOut";
import { useRouter } from 'next/navigation';
import { Footer } from "@/app/components/footer";

export default function HomePage() {
    return (
        <div>
            <div>
                <h1>メンコバース</h1>
                <SignOut />
            </div>
            < Footer />
        </div>
    );
}
