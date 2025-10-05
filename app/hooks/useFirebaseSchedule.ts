import { useState, useEffect } from 'react';
import { ScheduleEntry } from '../types';
import { loadScheduleEntries, saveScheduleEntries, updateSingleEntry } from '@/lib/firebaseService';

export function useFirebaseSchedule() {
  const [scheduleEntries, setScheduleEntries] = useState<ScheduleEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

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
      // Optimistic update
      const optimisticEntries = scheduleEntries.map(e =>
        e.id === entryId ? { ...e, completed: !e.completed } : e
      );
      setScheduleEntries(optimisticEntries);

      // Save only affected season
      const updatedEntries = await updateSingleEntry(entryId, !entry.completed, scheduleEntries);
      setScheduleEntries(updatedEntries);
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
