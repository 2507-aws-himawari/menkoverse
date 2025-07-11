import { useAtom } from 'jotai';
import { useParams } from 'next/navigation';
import { useGameActionsSWR } from './useGameActionsSWR';
import {
    currentUserAtom,
    loadingAtom,
    errorAtom,
} from '@/lib/atoms';

export function useGameActions() {
    const params = useParams();
    const rawRoomId = params?.roomId as string;
    const roomId = rawRoomId ? decodeURIComponent(rawRoomId) : null;

    const [currentUser] = useAtom(currentUserAtom);
    const [loading, setLoading] = useAtom(loadingAtom);
    const [, setError] = useAtom(errorAtom);

    const gameActions = useGameActionsSWR(roomId);

    const handleWithLoading = async (action: () => Promise<void>) => {
        try {
            setLoading(true);
            setError(null);
            await action();
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : '操作に失敗しました';
            setError(errorMessage);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const handleStartTurn = async () => {
        await handleWithLoading(async () => {
            await gameActions.handleStartTurn(currentUser);
        });
    };

    const handleEndTurn = async () => {
        await handleWithLoading(async () => {
            await gameActions.handleEndTurn(currentUser);
        });
    };

    const handleForceEndOpponentTurn = async () => {
        await handleWithLoading(async () => {
            await gameActions.handleForceEndOpponentTurn(currentUser);
        });
    };

    const handleConsumePP = async (ppCost: number) => {
        await handleWithLoading(async () => {
            await gameActions.handleConsumePP(currentUser, ppCost);
        });
    };

    return {
        handleStartTurn,
        handleEndTurn,
        handleForceEndOpponentTurn,
        handleConsumePP
    };
}
