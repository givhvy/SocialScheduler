import { useState, useEffect, useRef } from 'react';
import { ScheduleEntry } from '../types';
import { loadScheduleEntries, saveScheduleEntries, updateSingleEntry, subscribeToAllSeasons } from '@/lib/firebaseService';

export function useFirebaseSchedule() {
  const [scheduleEntries, setScheduleEntries] = useState<ScheduleEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const isFirstLoadRef = useRef(true);

  // Load entries from Firebase and subscribe to real-time updates
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
        setIsLoading(false);
        isFirstLoadRef.current = false;
      } catch (err) {
        setError(err as Error);
        console.error('❌ Failed to load schedule:', err);
        setIsLoading(false);
      }
    }

    loadEntries();

    // Subscribe to real-time updates after initial load
    const unsubscribe = subscribeToAllSeasons((entries) => {
      // Only update if this is not the first load (to avoid double-rendering)
      if (!isFirstLoadRef.current) {
        console.log('🔄 Real-time update received:', entries.length, 'entries');
        setScheduleEntries(entries);
      }
    });

    // Cleanup subscription on unmount
    return () => {
      console.log('🛑 Unsubscribing from real-time updates');
      unsubscribe();
    };
  }, []);

  // Save all entries (used for bulk operations)
  const updateScheduleEntries = async (newEntries: ScheduleEntry[]) => {
    try {
      console.log('💾 Saving schedule to Firebase...');
      const startTime = Date.now();
      setScheduleEntries(newEntries);
      await saveScheduleEntries(newEntries);
      const saveTime = Date.now() - startTime;
      console.log(`✅ Saved ${newEntries.length} entries in ${saveTime}ms`);
    } catch (err) {
      setError(err as Error);
      console.error('❌ Failed to save schedule:', err);
      throw err;
    }
  };

  // Toggle single entry (optimized - saves only 1 season)
  const toggleEntry = async (entryId: string) => {
    const entry = scheduleEntries.find(e => e.id === entryId);
    if (!entry) return;

    try {
      // Optimistic update (for immediate UI feedback)
      const optimisticEntries = scheduleEntries.map(e =>
        e.id === entryId ? { ...e, completed: !e.completed } : e
      );
      setScheduleEntries(optimisticEntries);

      // Save only affected season (real-time listener will update all clients)
      await updateSingleEntry(entryId, !entry.completed, scheduleEntries);
      // Note: We don't manually update state here because the real-time listener will do it
    } catch (err) {
      // Rollback on error
      setScheduleEntries(scheduleEntries);
      setError(err as Error);
      console.error('❌ Failed to update entry:', err);
    }
  };

  return {
    scheduleEntries,
    setScheduleEntries: updateScheduleEntries,
    toggleEntry,
    isLoading,
    error,
  };
}
