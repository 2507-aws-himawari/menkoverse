import { useAtom } from 'jotai';
import { useParams } from 'next/navigation';
import { useGameActionsCore } from './useGameActionsCore';
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

    const gameActions = useGameActionsCore(roomId);

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

    const handleDamagePlayer = async (targetUserId: string, damage: number) => {
        await handleWithLoading(async () => {
            await gameActions.handleDamagePlayer(currentUser, targetUserId, damage);
        });
    };

    const handleDamageToSelf = async (damage: number) => {
        await handleWithLoading(async () => {
            await gameActions.handleDamageToSelf(currentUser, damage);
        });
    };

    const handleDamageToOpponent = async (opponentUserId: string, damage: number) => {
        await handleWithLoading(async () => {
            await gameActions.handleDamageToOpponent(currentUser, opponentUserId, damage);
        });
    };

    const handleSummonFollower = async (handCardId: string) => {
        await handleWithLoading(async () => {
            await gameActions.handleSummonFollower(currentUser, handCardId);
        });
    };

    return {
        handleStartTurn,
        handleEndTurn,
        handleForceEndOpponentTurn,
        handleConsumePP,
        handleDamagePlayer,
        handleDamageToSelf,
        handleDamageToOpponent,
        handleSummonFollower,
    };
}
