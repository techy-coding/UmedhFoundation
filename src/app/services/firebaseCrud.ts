import { onValue, push, ref, remove, set } from 'firebase/database';
import { database } from '../lib/firebase';

export function subscribeToCollection<T extends { id: string }>(
  path: string,
  callback: (items: T[]) => void,
  fallbackItems: T[],
  sortItems?: (items: T[]) => T[],
  onError?: (error: Error) => void
) {
  if (!database) {
    callback(fallbackItems);
    return () => undefined;
  }

  return onValue(
    ref(database, path),
    (snapshot) => {
      const value = snapshot.val();

      if (!value) {
        callback([]);
        return;
      }

      const items = Object.entries(value).map(([id, item]) => ({
        id,
        ...(item as Omit<T, 'id'>),
      }));

      callback(sortItems ? sortItems(items) : items);
    },
    (error) => onError?.(error)
  );
}

export async function createRecord<T>(path: string, data: T) {
  if (!database) {
    throw new Error('Firebase is not configured yet.');
  }

  const collectionRef = ref(database, path);
  const recordRef = push(collectionRef);

  await set(recordRef, data);
}

export async function updateRecord<T>(path: string, id: string, data: T) {
  if (!database) {
    throw new Error('Firebase is not configured yet.');
  }

  const recordRef = ref(database, `${path}/${id}`);
  await set(recordRef, data);
  console.log(`Firebase update: ${path}/${id}`, data);
}

export async function deleteRecord(path: string, id: string) {
  if (!database) {
    throw new Error('Firebase is not configured yet.');
  }

  await remove(ref(database, `${path}/${id}`));
}
