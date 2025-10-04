import { useState, useEffect } from 'react';
import { ScheduleEntry } from '../types';
import { loadScheduleEntries, saveScheduleEntries } from '@/lib/firebaseService';

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

  // Save entries to Firebase whenever they change
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

  return {
    scheduleEntries,
    setScheduleEntries: updateScheduleEntries,
    isLoading,
    error,
  };
}
