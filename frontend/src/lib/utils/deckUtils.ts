/**
 * デッキ関連のユーティリティ関数
 */

// レンタルデッキIDのプレフィックス
export const RENTAL_DECK_PREFIX = 'R-';

/**
 * デッキIDからレンタルデッキかどうかを判定する
 * @param deckId - デッキID
 * @returns レンタルデッキの場合true、そうでなければfalse
 */
export function isRentalDeck(deckId: string): boolean {
  return deckId.startsWith(RENTAL_DECK_PREFIX);
}

/**
 * レンタルデッキのラベルを取得する
 * @returns レンタルデッキのラベル文字列
 */
export function getRentalDeckLabel(): string {
  return 'レンタル';
}

/**
 * レンタルデッキの説明文を取得する
 * @returns レンタルデッキの説明文
 */
export function getRentalDeckDescription(): string {
  return 'このデッキはレンタルデッキです。カードの追加・削除や名前の変更はできません。';
}
