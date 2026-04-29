import { z } from "zod";
import { baseMediaSchema } from "./media";

export const videoSchema = baseMediaSchema.extend({
  videoUrl: z.string().url(),
  thumbnailUrl: z.string().url(),
  duration: z.number().optional(),
  resolution: z.string().optional(),
  format: z.string().optional(),
});

export type VideoMetadata = z.infer<typeof videoSchema> & { id: string };

export const createVideoSchema = videoSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type CreateVideo = z.infer<typeof createVideoSchema>;

export const updateVideoSchema = createVideoSchema.partial();

export type UpdateVideo = z.infer<typeof updateVideoSchema>;
