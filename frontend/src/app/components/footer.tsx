import Link from 'next/link'
import { GiCrossedSwords, GiCardRandom, GiFloatingCrystal } from 'react-icons/gi'
import { PiCompassRoseThin } from "react-icons/pi";

export const Footer = () => (
    <footer className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg">
        <div className="flex justify-around items-center py-2 px-4 max-w-md mx-auto">
            <Link href="/room/join" className="flex flex-col items-center p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <GiCrossedSwords size={24} className="text-gray-600" />
            </Link>
            <Link href="/home" className="flex flex-col items-center p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <PiCompassRoseThin size={24} className="text-gray-600" />
            </Link>
            <Link href="/decks" className="flex flex-col items-center p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <GiCardRandom size={24} className="text-gray-600" />
            </Link>
            <Link href="/gacha" className="flex flex-col items-center p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <GiFloatingCrystal size={24} className="text-gray-600" />
            </Link>
        </div>
    </footer>
)
