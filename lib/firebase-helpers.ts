import { db } from "@/lib/firebase";
import { ref, get, set, push, remove, update } from "firebase/database";

export async function getAll(path: string) {
  const snapshot = await get(ref(db, path));
  if (!snapshot.exists()) return [] as Record<string, unknown>[];
  const data = snapshot.val();
  // Convert object to array and ensure each item has $id
  return Object.entries(data).map(([key, value]) => {
    const valObj = value as Record<string, unknown>;
    const id = typeof valObj.$id === "string" ? (valObj.$id as string) : key;
    return { ...valObj, $id: id };
  });
}

export async function getById(path: string, id: string) {
  const snapshot = await get(ref(db, `${path}/${id}`));
  if (!snapshot.exists()) return null;
  const data = snapshot.val() as Record<string, unknown>;
  // Ensure $id is set
  const resolvedId = typeof data.$id === "string" ? (data.$id as string) : id;
  return { ...data, $id: resolvedId };
}

export async function createWithAutoId(path: string, data: Record<string, unknown>) {
  const newRef = push(ref(db, path));
  // Remove $id from payload before saving
  const { $id, ...dataWithoutId } = data;
  const payload = { ...dataWithoutId, createdAt: Date.now() } as Record<string, unknown>;
  await set(newRef, payload);
  console.log($id);
  
  // Return with $id for frontend use
  return { ...payload, $id: newRef.key };
}

export async function updateById(path: string, id: string, data: Record<string, unknown>) {
  await update(ref(db, `${path}/${id}`), data);
}

export async function deleteById(path: string, id: string) {
  await remove(ref(db, `${path}/${id}`));
}
