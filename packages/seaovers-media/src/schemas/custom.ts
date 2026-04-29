import { z } from "zod";
import { baseMediaSchema } from "./media";

export const customSchema = baseMediaSchema.extend({
  type: z.string().min(1).max(100),
  data: z.record(z.unknown()).default({}),
});

export type CustomTypeData = z.infer<typeof customSchema> & { id: string };

export const createCustomSchema = customSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type CreateCustom = z.infer<typeof createCustomSchema>;

export const updateCustomSchema = createCustomSchema.partial();

export type UpdateCustom = z.infer<typeof updateCustomSchema>;
