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
        try {
            setLoading(true);
            setError(null);
            const errorMessage = await gameActions.handleSummonFollower(currentUser, handCardId);

            if (errorMessage) {
                // エラーメッセージがある場合はエラーとして設定
                setError(errorMessage);
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : '召喚に失敗しました';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleAttackWithFollower = async (
        attackerBoardCardId: string,
        targetType: 'follower' | 'player',
        targetId: string
    ) => {
        try {
            setLoading(true);
            setError(null);
            const errorMessage = await gameActions.handleAttackWithFollower(
                currentUser,
                attackerBoardCardId,
                targetType,
                targetId
            );

            if (errorMessage) {
                setError(errorMessage);
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : '攻撃に失敗しました';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleSummonFollowerToOpponent = async (targetUserId: string, followerId: string) => {
        try {
            setLoading(true);
            setError(null);
            const errorMessage = await gameActions.handleSummonFollowerToOpponent(
                currentUser,
                targetUserId,
                followerId
            );

            if (errorMessage) {
                setError(errorMessage);
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : '相手フィールドへの召喚に失敗しました';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
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
        handleAttackWithFollower,
        handleSummonFollowerToOpponent,
    };
}
