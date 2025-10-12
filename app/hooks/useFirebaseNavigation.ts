import { useState, useEffect, useCallback, useRef } from 'react';
import { loadNavigationPrefs, saveNavigationPrefs, subscribeToNavigationPrefs } from '@/lib/firebaseService';

interface UseFirebaseNavigationReturn {
  currentDay: number;
  currentPage: number;
  setCurrentDay: (day: number) => void;
  setCurrentPage: (page: number) => void;
  isLoaded: boolean;
}

/**
 * Custom hook to manage navigation state with Firebase sync
 * This allows navigation state to persist across devices
 */
export function useFirebaseNavigation(): UseFirebaseNavigationReturn {
  const [currentDay, setCurrentDayState] = useState(1);
  const [currentPage, setCurrentPageState] = useState(1);
  const [isLoaded, setIsLoaded] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load initial preferences from Firebase
  useEffect(() => {
    async function loadPrefs() {
      try {
        const prefs = await loadNavigationPrefs();
        setCurrentDayState(prefs.currentDay);
        setCurrentPageState(prefs.currentPage);
      } catch (error) {
        console.error('Failed to load navigation preferences:', error);
      } finally {
        setIsLoaded(true);
      }
    }

    loadPrefs();
  }, []);

  // Subscribe to real-time updates from other devices
  useEffect(() => {
    if (!isLoaded) return;

    const unsubscribe = subscribeToNavigationPrefs((prefs) => {
      setCurrentDayState(prefs.currentDay);
      setCurrentPageState(prefs.currentPage);
    });

    return () => unsubscribe();
  }, [isLoaded]);

  // Debounced save to Firebase (save after 500ms of inactivity)
  const debouncedSave = useCallback((day: number, page: number) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      try {
        await saveNavigationPrefs({ currentDay: day, currentPage: page });
      } catch (error) {
        console.error('Failed to save navigation preferences:', error);
      }
    }, 500);
  }, []);

  // Set current day with Firebase sync
  const setCurrentDay = useCallback((day: number) => {
    setCurrentDayState(day);
    debouncedSave(day, currentPage);
  }, [currentPage, debouncedSave]);

  // Set current page with Firebase sync
  const setCurrentPage = useCallback((page: number) => {
    setCurrentPageState(page);
    debouncedSave(currentDay, page);
  }, [currentDay, debouncedSave]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  return {
    currentDay,
    currentPage,
    setCurrentDay,
    setCurrentPage,
    isLoaded,
  };
}
