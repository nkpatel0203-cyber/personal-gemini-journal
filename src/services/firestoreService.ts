import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { JournalEntry } from '../types';
import { INITIAL_JOURNAL_ENTRIES } from '../data/initialEntries';

// Subscribe in real-time to user's journal entries
export function subscribeToUserEntries(
  userId: string,
  onUpdate: (entries: JournalEntry[]) => void,
  onError?: (error: Error) => void
) {
  const entriesCol = collection(db, 'users', userId, 'entries');
  const q = query(entriesCol, orderBy('date', 'desc'));

  return onSnapshot(
    q,
    async (snapshot) => {
      if (snapshot.empty) {
        // First-time user: seed initial sample reflections in Firestore
        try {
          const promises = INITIAL_JOURNAL_ENTRIES.map((entry) => {
            const entryDoc = doc(db, 'users', userId, 'entries', entry.id);
            return setDoc(entryDoc, {
              ...entry,
              userId,
              createdAt: serverTimestamp(),
              updatedAt: new Date().toISOString(),
            });
          });
          await Promise.all(promises);
          return;
        } catch (e) {
          console.error('Error seeding initial entries into Firestore:', e);
        }
      }

      const entries: JournalEntry[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        entries.push({
          id: docSnap.id,
          title: data.title || '',
          content: data.content || '',
          date: data.date || new Date().toISOString(),
          updatedAt: data.updatedAt || new Date().toISOString(),
          mood: data.mood || 'reflective',
          tags: Array.isArray(data.tags) ? data.tags : [],
          location: data.location || undefined,
          weather: data.weather || undefined,
          gratitudes: Array.isArray(data.gratitudes) ? data.gratitudes : undefined,
          dailyIntention: data.dailyIntention || undefined,
          isFavorite: Boolean(data.isFavorite),
          aiReflection: data.aiReflection || undefined,
          aiChatHistory: Array.isArray(data.aiChatHistory) ? data.aiChatHistory : undefined,
        });
      });

      onUpdate(entries);
    },
    (err) => {
      console.error('Firestore entries subscription error:', err);
      if (onError) onError(err);
    }
  );
}

// Upsert a single journal entry to Firestore
export async function saveEntryToFirestore(userId: string, entry: JournalEntry): Promise<void> {
  const entryId = entry.id || `entry_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const entryDocRef = doc(db, 'users', userId, 'entries', entryId);

  // Clean undefined values so Firestore doesn't reject them
  const payload: Record<string, any> = {
    id: entryId,
    userId,
    title: entry.title || 'Untitled Reflection',
    content: entry.content || '',
    date: entry.date || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    mood: entry.mood || 'reflective',
    tags: entry.tags || [],
    isFavorite: Boolean(entry.isFavorite),
  };

  if (entry.location) payload.location = entry.location;
  if (entry.weather) payload.weather = entry.weather;
  if (entry.gratitudes) payload.gratitudes = entry.gratitudes;
  if (entry.dailyIntention) payload.dailyIntention = entry.dailyIntention;
  if (entry.aiReflection) payload.aiReflection = entry.aiReflection;
  if (entry.aiChatHistory) payload.aiChatHistory = entry.aiChatHistory;

  await setDoc(entryDocRef, payload, { merge: true });
}

// Delete an entry from Firestore
export async function deleteEntryFromFirestore(userId: string, entryId: string): Promise<void> {
  const entryDocRef = doc(db, 'users', userId, 'entries', entryId);
  await deleteDoc(entryDocRef);
}

// Toggle favorite in Firestore
export async function toggleFavoriteInFirestore(
  userId: string,
  entryId: string,
  currentFavorite: boolean
): Promise<void> {
  const entryDocRef = doc(db, 'users', userId, 'entries', entryId);
  await setDoc(
    entryDocRef,
    {
      isFavorite: !currentFavorite,
      updatedAt: new Date().toISOString(),
    },
    { merge: true }
  );
}

// Batch import multiple entries into Firestore
export async function batchImportEntriesToFirestore(
  userId: string,
  entries: JournalEntry[]
): Promise<void> {
  const promises = entries.map((entry) => saveEntryToFirestore(userId, entry));
  await Promise.all(promises);
}
