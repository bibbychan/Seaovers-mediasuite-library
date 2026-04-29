import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  limit,
  startAfter,
  type QueryConstraint,
  type Firestore,
  Timestamp,
} from "firebase/firestore";
import type { MediaDoc } from "../models/base";

export interface ListOptions {
  orderByField?: string;
  limitCount?: number;
  lastDoc?: unknown;
}

export async function createMedia<T extends MediaDoc>(
  db: Firestore,
  collectionName: string,
  data: Omit<T, "id" | "createdAt" | "updatedAt">
): Promise<T> {
  const now = Timestamp.now();
  const docRef = await addDoc(collection(db, collectionName), {
    ...data,
    createdAt: now,
    updatedAt: now,
  });

  return {
    id: docRef.id,
    ...data,
    createdAt: now.toDate().toISOString(),
    updatedAt: now.toDate().toISOString(),
  } as T;
}

export async function listMedia<T extends MediaDoc>(
  db: Firestore,
  collectionName: string,
  options: ListOptions = {}
): Promise<T[]> {
  const { orderByField = "createdAt", limitCount = 50 } = options;

  const constraints: QueryConstraint[] = [
    orderBy(orderByField, "desc"),
    limit(limitCount),
  ];

  const q = query(collection(db, collectionName), ...constraints);
  const snapshot = await getDocs(q);

  return snapshot.docs.map((docSnap) => {
    const data = docSnap.data();
    return {
      id: docSnap.id,
      ...data,
      createdAt: data.createdAt?.toDate?.().toISOString() ?? new Date().toISOString(),
      updatedAt: data.updatedAt?.toDate?.().toISOString() ?? new Date().toISOString(),
    } as T;
  });
}

export async function getMediaById<T extends MediaDoc>(
  db: Firestore,
  collectionName: string,
  id: string
): Promise<T | null> {
  const docRef = doc(db, collectionName, id);
  const snapshot = await getDoc(docRef);

  if (!snapshot.exists()) {
    return null;
  }

  const data = snapshot.data();
  return {
    id: snapshot.id,
    ...data,
    createdAt: data.createdAt?.toDate?.().toISOString() ?? new Date().toISOString(),
    updatedAt: data.updatedAt?.toDate?.().toISOString() ?? new Date().toISOString(),
  } as T;
}

export async function updateMedia<T extends MediaDoc>(
  db: Firestore,
  collectionName: string,
  id: string,
  data: Partial<Omit<T, "id" | "createdAt" | "updatedAt">>
): Promise<void> {
  const docRef = doc(db, collectionName, id);
  await updateDoc(docRef, {
    ...data,
    updatedAt: Timestamp.now(),
  });
}

export async function deleteMedia(
  db: Firestore,
  collectionName: string,
  id: string
): Promise<void> {
  const docRef = doc(db, collectionName, id);
  await deleteDoc(docRef);
}

export async function countMedia(
  db: Firestore,
  collectionName: string
): Promise<number> {
  const q = query(collection(db, collectionName));
  const snapshot = await getDocs(q);
  return snapshot.size;
}
