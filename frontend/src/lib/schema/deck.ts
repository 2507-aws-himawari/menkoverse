import * as z from "zod/v4";

// デッキ作成用のスキーマ
export const createDeckSchema = z.object({
  name: z
    .string()
    .min(1, "デッキ名は必須です")
    .max(50, "デッキ名は50文字以内で入力してください")
    .trim(),
});

// デッキ更新用のスキーマ
export const updateDeckSchema = z.object({
  name: z
    .string()
    .min(1, "デッキ名は必須です")
    .max(50, "デッキ名は50文字以内で入力してください")
    .trim()
    .optional(),
});

// カード追加用のスキーマ
export const addCardToDeckSchema = z.object({
  followerId: z
    .string()
    .min(1, "カードIDは必須です"),
});

// デッキID用のスキーマ
export const deckIdSchema = z.object({
  id: z
    .string()
    .min(1, "デッキIDは必須です"),
});

// 型定義をエクスポート
export type CreateDeckData = z.infer<typeof createDeckSchema>;
export type UpdateDeckData = z.infer<typeof updateDeckSchema>;
export type AddCardToDeckData = z.infer<typeof addCardToDeckSchema>;
export type DeckIdData = z.infer<typeof deckIdSchema>;
