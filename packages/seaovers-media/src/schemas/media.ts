import { z } from "zod";

export type MediaStatus = z.infer<typeof mediaStatus>;

export const mediaStatus = z.enum(["draft", "published", "archived"]);

export const baseMediaSchema = z.object({
  title: z.string().min(1).max(500),
  description: z.string().max(5000).optional(),
  tags: z.array(z.string()).default([]),
  status: mediaStatus.default("draft"),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type BaseMedia = z.infer<typeof baseMediaSchema> & { id: string };
