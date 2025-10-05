import { db } from './firebase';
import {
  collection,
  doc,
  getDoc,
  setDoc,
  getDocs,
  writeBatch,
  serverTimestamp,
  onSnapshot
} from 'firebase/firestore';
import { ScheduleEntry, TOTAL_SEASONS } from '@/app/types';

const COLLECTION_NAME = 'schedules';

/**
 * Get season number from entry ID (format: C123-day456)
 * Channel C1-C84 = Season 1
 * Channel C85-C168 = Season 2
 * etc.
 */
function getSeasonFromEntryId(entryId: string): number {
  const match = entryId.match(/^C(\d+)-/);
  if (!match) return 1;

  const channelNumber = parseInt(match[1]);
  const channelIndex = channelNumber - 1; // C1 = index 0
  const season = Math.floor(channelIndex / 84) + 1; // 84 channels per season

  return season;
}

/**
 * Group entries by season
 */
function groupEntriesBySeason(entries: ScheduleEntry[]): Map<number, ScheduleEntry[]> {
  const seasonMap = new Map<number, ScheduleEntry[]>();

  for (const entry of entries) {
    const season = getSeasonFromEntryId(entry.id);
    if (!seasonMap.has(season)) {
      seasonMap.set(season, []);
    }
    seasonMap.get(season)!.push(entry);
  }

  return seasonMap;
}

/**
 * Load schedule entries from Firebase (from all season documents)
 */
export async function loadScheduleEntries(): Promise<ScheduleEntry[]> {
  try {
    const allEntries: ScheduleEntry[] = [];

    // Load all 12 seasons in parallel
    const loadPromises = Array.from({ length: TOTAL_SEASONS }, (_, i) => {
      const seasonNum = i + 1;
      const docRef = doc(db, COLLECTION_NAME, `season-${seasonNum}`);
      return getDoc(docRef);
    });

    const docSnaps = await Promise.all(loadPromises);

    for (const docSnap of docSnaps) {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.entries && Array.isArray(data.entries)) {
          allEntries.push(...data.entries);
        }
      }
    }

    return allEntries;
  } catch (error) {
    console.error('Error loading schedule from Firebase:', error);
    return [];
  }
}

/**
 * Save schedule entries to Firebase (split by season)
 */
export async function saveScheduleEntries(entries: ScheduleEntry[]): Promise<void> {
  try {
    const seasonMap = groupEntriesBySeason(entries);

    // Save each season as a separate document in parallel
    const savePromises = Array.from(seasonMap.entries()).map(([seasonNum, seasonEntries]) => {
      const docRef = doc(db, COLLECTION_NAME, `season-${seasonNum}`);
      return setDoc(docRef, {
        seasonNumber: seasonNum,
        entries: seasonEntries,
        updatedAt: serverTimestamp(),
      });
    });

    await Promise.all(savePromises);
  } catch (error) {
    console.error('Error saving schedule to Firebase:', error);
    throw error;
  }
}

/**
 * Update a single entry's completion status
 */
export async function updateEntryCompletion(
  entryId: string,
  completed: boolean,
  allEntries: ScheduleEntry[]
): Promise<void> {
  try {
    const updatedEntries = allEntries.map(e =>
      e.id === entryId ? { ...e, completed } : e
    );
    await saveScheduleEntries(updatedEntries);
  } catch (error) {
    console.error('Error updating entry:', error);
    throw error;
  }
}

/**
 * Save only one season (optimized for single entry updates)
 */
export async function saveSingleSeason(seasonNum: number, entries: ScheduleEntry[]): Promise<void> {
  try {
    const docRef = doc(db, COLLECTION_NAME, `season-${seasonNum}`);
    await setDoc(docRef, {
      seasonNumber: seasonNum,
      entries,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error(`Error saving season-${seasonNum}:`, error);
    throw error;
  }
}

/**
 * Update a single entry quickly (saves only affected season)
 */
export async function updateSingleEntry(
  entryId: string,
  completed: boolean,
  allEntries: ScheduleEntry[]
): Promise<ScheduleEntry[]> {
  // Get season from entry ID
  const season = getSeasonFromEntryId(entryId);

  // Update entry in memory
  const updatedEntries = allEntries.map(e =>
    e.id === entryId ? { ...e, completed } : e
  );

  // Get only entries for this season
  const seasonEntries = updatedEntries.filter(e =>
    getSeasonFromEntryId(e.id) === season
  );

  // Save only this season
  await saveSingleSeason(season, seasonEntries);

  return updatedEntries;
}
