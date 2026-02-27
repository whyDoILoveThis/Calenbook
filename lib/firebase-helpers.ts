import { db } from "@/lib/firebase";
import { ref, get, set, push, remove, update, query, orderByChild, equalTo } from "firebase/database";

export async function getAll(path: string) {
  const snapshot = await get(ref(db, path));
  if (!snapshot.exists()) return [];
  return Object.values(snapshot.val());
}

export async function getById(path: string, id: string) {
  const snapshot = await get(ref(db, `${path}/${id}`));
  return snapshot.exists() ? snapshot.val() : null;
}

export async function createWithAutoId(path: string, data: any) {
  const newRef = push(ref(db, path));
  await set(newRef, { ...data, $id: newRef.key, $createdAt: Date.now() });
  return { ...data, $id: newRef.key, $createdAt: Date.now() };
}

export async function updateById(path: string, id: string, data: any) {
  await update(ref(db, `${path}/${id}`), data);
}

export async function deleteById(path: string, id: string) {
  await remove(ref(db, `${path}/${id}`));
}
