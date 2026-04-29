import type { Firestore } from "firebase/firestore";
import type { CustomTypeData } from "../schemas/custom";
import type { ListOptions } from "./index";
import { createMedia, listMedia, getMediaById, updateMedia, deleteMedia, countMedia } from "./index";

const COLLECTION = "custom_types";

export function createCustom(db: Firestore, data: Omit<CustomTypeData, "id" | "createdAt" | "updatedAt">) {
  return createMedia<CustomTypeData>(db, COLLECTION, data);
}

export function listCustoms(db: Firestore, options?: ListOptions) {
  return listMedia<CustomTypeData>(db, COLLECTION, options);
}

export function getCustomById(db: Firestore, id: string) {
  return getMediaById<CustomTypeData>(db, COLLECTION, id);
}

export function updateCustom(db: Firestore, id: string, data: Partial<Omit<CustomTypeData, "id" | "createdAt" | "updatedAt">>) {
  return updateMedia<CustomTypeData>(db, COLLECTION, id, data);
}

export function deleteCustom(db: Firestore, id: string) {
  return deleteMedia(db, COLLECTION, id);
}

export function countCustoms(db: Firestore) {
  return countMedia(db, COLLECTION);
}
