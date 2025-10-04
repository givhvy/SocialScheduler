import { useState, useEffect, useRef } from 'react';
import { ScheduleEntry } from '../types';
import { loadScheduleEntries, saveScheduleEntries } from '@/lib/firebaseService';

export function useFirebaseSchedule() {
  const [scheduleEntries, setScheduleEntries] = useState<ScheduleEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingEntriesRef = useRef<ScheduleEntry[] | null>(null);

  // Load entries from Firebase on mount
  useEffect(() => {
    async function loadEntries() {
      try {
        console.log('🔄 Loading schedule from Firebase...');
        setIsLoading(true);
        const startTime = Date.now();
        const entries = await loadScheduleEntries();
        const loadTime = Date.now() - startTime;
        console.log(`✅ Loaded ${entries.length} entries in ${loadTime}ms`);
        setScheduleEntries(entries);
      } catch (err) {
        setError(err as Error);
        console.error('❌ Failed to load schedule:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadEntries();
  }, []);

  // Save entries to Firebase with debouncing
  const updateScheduleEntries = (newEntries: ScheduleEntry[]) => {
    // Immediate UI update (optimistic)
    setScheduleEntries(newEntries);
    pendingEntriesRef.current = newEntries;

    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Debounce save to Firebase (wait 500ms after last change)
    saveTimeoutRef.current = setTimeout(async () => {
      const entriesToSave = pendingEntriesRef.current;
      if (!entriesToSave) return;

      try {
        console.log('💾 Saving schedule to Firebase...');
        const startTime = Date.now();
        await saveScheduleEntries(entriesToSave);
        const saveTime = Date.now() - startTime;
        console.log(`✅ Saved ${entriesToSave.length} entries in ${saveTime}ms`);
        pendingEntriesRef.current = null;
      } catch (err) {
        setError(err as Error);
        console.error('❌ Failed to save schedule:', err);
      }
    }, 500);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  return {
    scheduleEntries,
    setScheduleEntries: updateScheduleEntries,
    isLoading,
    error,
  };
}
