import { z } from "zod";
import { baseMediaSchema } from "./media";

export const imageSchema = baseMediaSchema.extend({
  imageUrl: z.string().url(),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  format: z.string().optional(),
  fileSize: z.number().optional(),
});

export type ImageMetadata = z.infer<typeof imageSchema> & { id: string };

export const createImageSchema = imageSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type CreateImage = z.infer<typeof createImageSchema>;

export const updateImageSchema = createImageSchema.partial();

export type UpdateImage = z.infer<typeof updateImageSchema>;
