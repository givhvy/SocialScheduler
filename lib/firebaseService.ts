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
import { ScheduleEntry, TOTAL_SEASONS, UserSettings } from '@/app/types';

const COLLECTION_NAME = 'schedules';
const USER_PREFS_COLLECTION = 'userPreferences';
const USER_SETTINGS_COLLECTION = 'userSettings';
const DEFAULT_USER_ID = 'default-user'; // For now, using single user. Can add auth later.

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
 * Subscribe to real-time updates for all seasons
 * This will trigger callback whenever any entry is updated
 */
export function subscribeToAllSeasons(
  callback: (entries: ScheduleEntry[]) => void
): () => void {
  const unsubscribers: Array<() => void> = [];
  const seasonEntries = new Map<number, ScheduleEntry[]>();

  // Subscribe to all 12 seasons
  for (let i = 1; i <= TOTAL_SEASONS; i++) {
    const seasonNum = i;
    const docRef = doc(db, COLLECTION_NAME, `season-${seasonNum}`);

    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.entries && Array.isArray(data.entries)) {
          seasonEntries.set(seasonNum, data.entries);

          // Merge all season entries and trigger callback
          const allEntries: ScheduleEntry[] = [];
          seasonEntries.forEach((entries) => {
            allEntries.push(...entries);
          });
          callback(allEntries);
        }
      }
    }, (error) => {
      console.error(`Error subscribing to season-${seasonNum}:`, error);
    });

    unsubscribers.push(unsubscribe);
  }

  // Return a function to unsubscribe from all seasons
  return () => {
    unsubscribers.forEach(unsub => unsub());
  };
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

/**
 * Update multiple entries efficiently (batched by season)
 * This is optimized for updating many entries at once
 */
export async function updateMultipleEntries(
  entriesToUpdate: ScheduleEntry[],
  allEntries: ScheduleEntry[]
): Promise<void> {
  // Create a map of entry IDs to update
  const updateMap = new Map(entriesToUpdate.map(e => [e.id, e]));

  // Update entries in memory
  const updatedEntries = allEntries.map(e =>
    updateMap.has(e.id) ? updateMap.get(e.id)! : e
  );

  // Group updated entries by season
  const affectedSeasons = new Set(
    entriesToUpdate.map(e => getSeasonFromEntryId(e.id))
  );

  // Save each affected season
  const savePromises = Array.from(affectedSeasons).map(seasonNum => {
    const seasonEntries = updatedEntries.filter(e =>
      getSeasonFromEntryId(e.id) === seasonNum
    );
    return saveSingleSeason(seasonNum, seasonEntries);
  });

  await Promise.all(savePromises);
}

/**
 * User navigation preferences interface
 */
export interface UserNavigationPrefs {
  currentDay: number;
  currentPage: number;
  updatedAt?: object;
}

/**
 * Load user navigation preferences from Firebase
 */
export async function loadNavigationPrefs(): Promise<UserNavigationPrefs> {
  try {
    const docRef = doc(db, USER_PREFS_COLLECTION, DEFAULT_USER_ID);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        currentDay: data.currentDay || 1,
        currentPage: data.currentPage || 1,
      };
    }

    // Return defaults if no prefs exist
    return { currentDay: 1, currentPage: 1 };
  } catch (error) {
    console.error('Error loading navigation preferences:', error);
    return { currentDay: 1, currentPage: 1 };
  }
}

/**
 * Save user navigation preferences to Firebase
 */
export async function saveNavigationPrefs(prefs: UserNavigationPrefs): Promise<void> {
  try {
    const docRef = doc(db, USER_PREFS_COLLECTION, DEFAULT_USER_ID);
    await setDoc(docRef, {
      ...prefs,
      updatedAt: serverTimestamp(),
    }, { merge: true }); // Use merge to only update changed fields
  } catch (error) {
    console.error('Error saving navigation preferences:', error);
    throw error;
  }
}

/**
 * Reset navigation to day 1, season 1
 */
export async function resetNavigationToStart(): Promise<void> {
  try {
    await saveNavigationPrefs({ currentDay: 1, currentPage: 1 });
  } catch (error) {
    console.error('Error resetting navigation:', error);
    throw error;
  }
}

/**
 * Subscribe to navigation preferences changes (for real-time sync)
 */
export function subscribeToNavigationPrefs(
  callback: (prefs: UserNavigationPrefs) => void
): () => void {
  const docRef = doc(db, USER_PREFS_COLLECTION, DEFAULT_USER_ID);

  const unsubscribe = onSnapshot(docRef, (docSnap) => {
    if (docSnap.exists()) {
      const data = docSnap.data();
      callback({
        currentDay: data.currentDay || 1,
        currentPage: data.currentPage || 1,
      });
    }
  }, (error) => {
    console.error('Error subscribing to navigation preferences:', error);
  });

  return unsubscribe;
}

/**
 * Load user settings from Firebase
 */
export async function loadUserSettings(): Promise<UserSettings> {
  try {
    const docRef = doc(db, USER_SETTINGS_COLLECTION, DEFAULT_USER_ID);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        channelSuffixes: data.channelSuffixes || {},
      };
    }

    // Return defaults if no settings exist
    return { channelSuffixes: {} };
  } catch (error) {
    console.error('Error loading user settings:', error);
    return { channelSuffixes: {} };
  }
}

/**
 * Save user settings to Firebase
 */
export async function saveUserSettings(settings: UserSettings): Promise<void> {
  try {
    const docRef = doc(db, USER_SETTINGS_COLLECTION, DEFAULT_USER_ID);
    await setDoc(docRef, {
      ...settings,
      updatedAt: serverTimestamp(),
    }, { merge: true });
  } catch (error) {
    console.error('Error saving user settings:', error);
    throw error;
  }
}

/**
 * Subscribe to user settings changes (for real-time sync)
 */
export function subscribeToUserSettings(
  callback: (settings: UserSettings) => void
): () => void {
  const docRef = doc(db, USER_SETTINGS_COLLECTION, DEFAULT_USER_ID);

  const unsubscribe = onSnapshot(docRef, (docSnap) => {
    if (docSnap.exists()) {
      const data = docSnap.data();
      callback({
        channelSuffixes: data.channelSuffixes || {},
      });
    } else {
      // If document doesn't exist, return default settings
      callback({ channelSuffixes: {} });
    }
  }, (error) => {
    console.error('Error subscribing to user settings:', error);
  });

  return unsubscribe;
}
