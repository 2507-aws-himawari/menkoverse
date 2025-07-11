import type { cardSchema } from "@/lib/schema/card";
import * as z from "zod/v4";

export type Card = z.infer<typeof cardSchema>;
