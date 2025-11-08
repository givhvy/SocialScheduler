import { useState, useEffect, useRef } from 'react';
import { ScheduleEntry } from '../types';
import { loadScheduleEntries, saveScheduleEntries, updateSingleEntry, updateMultipleEntries, subscribeToAllSeasons } from '@/lib/firebaseService';

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

  // Toggle single entry (optimized - saves only affected seasons)
  const toggleEntry = async (entryId: string) => {
    const entry = scheduleEntries.find(e => e.id === entryId);
    if (!entry) return;

    const newCompletedStatus = !entry.completed;
    const currentDay = parseInt(entry.date);

    try {
      // Collect entries that will be updated
      const entriesToUpdate: ScheduleEntry[] = [];

      // Always update the clicked entry
      entriesToUpdate.push({ ...entry, completed: newCompletedStatus });

      // If marking as completed, also mark all previous days of the same channel as completed
      if (newCompletedStatus) {
        const channelId = entry.channelId;
        scheduleEntries.forEach(e => {
          const entryDay = parseInt(e.date);
          // Mark as completed if it's the same channel, on a previous day, and not already completed
          if (e.channelId === channelId && entryDay < currentDay && !e.completed) {
            entriesToUpdate.push({ ...e, completed: true });
          }
        });
      }

      // Optimistic update (for immediate UI feedback)
      const updateMap = new Map(entriesToUpdate.map(e => [e.id, e]));
      const optimisticEntries = scheduleEntries.map(e =>
        updateMap.has(e.id) ? updateMap.get(e.id)! : e
      );
      setScheduleEntries(optimisticEntries);

      // Save only affected entries to Firebase (batched by season)
      await updateMultipleEntries(entriesToUpdate, scheduleEntries);
      console.log(`✅ Updated ${entriesToUpdate.length} entries`);
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
