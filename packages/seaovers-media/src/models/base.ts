export interface MediaDoc {
  title: string;
  description?: string;
  tags: string[];
  status: "draft" | "published" | "archived";
  createdAt: string;
  updatedAt: string;
}

export interface VideoDoc extends MediaDoc {
  videoUrl: string;
  thumbnailUrl: string;
  duration?: number;
  resolution?: string;
  format?: string;
}

export interface ImageDoc extends MediaDoc {
  imageUrl: string;
  width: number;
  height: number;
  format?: string;
  fileSize?: number;
}

export interface CustomDoc extends MediaDoc {
  type: string;
  data: Record<string, unknown>;
}
