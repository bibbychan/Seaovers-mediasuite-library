import type { Firestore } from "firebase/firestore";
import type { ImageMetadata } from "../schemas/image";
import type { ListOptions } from "./index";
import { createMedia, listMedia, getMediaById, updateMedia, deleteMedia, countMedia } from "./index";

const COLLECTION = "images";

export function createImage(db: Firestore, data: Omit<ImageMetadata, "id" | "createdAt" | "updatedAt">) {
  return createMedia<ImageMetadata>(db, COLLECTION, data);
}

export function listImages(db: Firestore, options?: ListOptions) {
  return listMedia<ImageMetadata>(db, COLLECTION, options);
}

export function getImageById(db: Firestore, id: string) {
  return getMediaById<ImageMetadata>(db, COLLECTION, id);
}

export function updateImage(db: Firestore, id: string, data: Partial<Omit<ImageMetadata, "id" | "createdAt" | "updatedAt">>) {
  return updateMedia<ImageMetadata>(db, COLLECTION, id, data);
}

export function deleteImage(db: Firestore, id: string) {
  return deleteMedia(db, COLLECTION, id);
}

export function countImages(db: Firestore) {
  return countMedia(db, COLLECTION);
}
