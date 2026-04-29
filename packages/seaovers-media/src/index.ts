export {
  mediaStatus,
  baseMediaSchema,
} from "./schemas/media";
export type { MediaStatus, BaseMedia } from "./schemas/media";

export {
  videoSchema,
  createVideoSchema,
  updateVideoSchema,
} from "./schemas/video";
export type { VideoMetadata, CreateVideo, UpdateVideo } from "./schemas/video";

export {
  imageSchema,
  createImageSchema,
  updateImageSchema,
} from "./schemas/image";
export type { ImageMetadata, CreateImage, UpdateImage } from "./schemas/image";

export {
  customSchema,
  createCustomSchema,
  updateCustomSchema,
} from "./schemas/custom";
export type { CustomTypeData, CreateCustom, UpdateCustom } from "./schemas/custom";

export * from "./models/base";
export * from "./firestore";
