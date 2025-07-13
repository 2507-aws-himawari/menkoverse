import * as z from "zod/v4";

export const cardSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "名前は必須です"),
  cost: z
    .number()
    .min(1, "コストは1以上でなければなりません")
    .max(10, "コストは10以下でなければなりません"),
  attack: z
    .number()
    .min(0, "攻撃力は0以上でなければなりません")
    .max(100, "攻撃力は100以下でなければなりません"),
  hp: z
    .number()
    .min(1, "HPは1以上でなければなりません")
    .max(100, "HPは100以下でなければなりません"),
});