import type { Firestore } from "firebase/firestore";
import type { VideoMetadata } from "../schemas/video";
import type { ListOptions } from "./index";
import { createMedia, listMedia, getMediaById, updateMedia, deleteMedia, countMedia } from "./index";

const COLLECTION = "videos";

export function createVideo(db: Firestore, data: Omit<VideoMetadata, "id" | "createdAt" | "updatedAt">) {
  return createMedia<VideoMetadata>(db, COLLECTION, data);
}

export function listVideos(db: Firestore, options?: ListOptions) {
  return listMedia<VideoMetadata>(db, COLLECTION, options);
}

export function getVideoById(db: Firestore, id: string) {
  return getMediaById<VideoMetadata>(db, COLLECTION, id);
}

export function updateVideo(db: Firestore, id: string, data: Partial<Omit<VideoMetadata, "id" | "createdAt" | "updatedAt">>) {
  return updateMedia<VideoMetadata>(db, COLLECTION, id, data);
}

export function deleteVideo(db: Firestore, id: string) {
  return deleteMedia(db, COLLECTION, id);
}

export function countVideos(db: Firestore) {
  return countMedia(db, COLLECTION);
}
