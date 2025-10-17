"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { UserSettings } from '@/app/types';
import {
  loadUserSettings,
  saveUserSettings,
  subscribeToUserSettings
} from '@/lib/firebaseService';

export function useFirebaseSettings() {
  const [settings, setSettings] = useState<UserSettings>({ channelSuffixes: {} });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Debounce timer for saving
  const saveTimerRef = useRef<NodeJS.Timeout | undefined>(undefined);

  // Track if we're currently syncing from Firebase to avoid loops
  const isSyncingRef = useRef<boolean>(false);

  // Load initial settings
  useEffect(() => {
    const initSettings = async () => {
      try {
        setIsLoading(true);
        const loadedSettings = await loadUserSettings();
        isSyncingRef.current = true;
        setSettings(loadedSettings);
        isSyncingRef.current = false;
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load settings');
        console.error('Error loading settings:', err);
      } finally {
        setIsLoading(false);
      }
    };

    initSettings();
  }, []);

  // Subscribe to real-time updates
  useEffect(() => {
    const unsubscribe = subscribeToUserSettings((updatedSettings) => {
      // Only update if we're not currently saving (to avoid sync conflicts)
      if (!isSyncingRef.current) {
        isSyncingRef.current = true;
        setSettings(updatedSettings);
        isSyncingRef.current = false;
      }
    });

    return unsubscribe;
  }, []);

  // Save settings with debounce
  const updateSettings = useCallback((newSettings: Partial<UserSettings>) => {
    // Update local state immediately for instant UI feedback
    setSettings(prev => ({ ...prev, ...newSettings }));

    // Clear existing timer
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }

    // Debounce save to Firebase (500ms)
    saveTimerRef.current = setTimeout(async () => {
      try {
        isSyncingRef.current = true;
        await saveUserSettings({ ...settings, ...newSettings });
        isSyncingRef.current = false;
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to save settings');
        console.error('Error saving settings:', err);
        isSyncingRef.current = false;
      }
    }, 500);
  }, [settings]);

  // Update specific channel suffix
  const updateChannelSuffix = useCallback((channelIndex: number, suffix: string) => {
    const newSuffixes = { ...settings.channelSuffixes };
    if (suffix === "") {
      delete newSuffixes[channelIndex];
    } else {
      newSuffixes[channelIndex] = suffix;
    }
    updateSettings({ channelSuffixes: newSuffixes });
  }, [settings.channelSuffixes, updateSettings]);

  // Bulk update channel suffixes
  const bulkUpdateChannelSuffixes = useCallback((suffixes: Record<number, string>) => {
    updateSettings({ channelSuffixes: suffixes });
  }, [updateSettings]);

  return {
    settings,
    isLoading,
    error,
    updateChannelSuffix,
    bulkUpdateChannelSuffixes,
    updateSettings
  };
}
