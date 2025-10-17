'use client';

import { useEffect, useState } from 'react';
import Calendar from './components/Calendar';
import CountdownSection from './components/CountdownSection';
import Settings from './components/Settings';
import { TOTAL_SEASONS, DAYS_PER_SEASON, CHANNELS_PER_SEASON } from './types';
import { useFirebaseSchedule } from './hooks/useFirebaseSchedule';
import { useFirebaseSettings } from './hooks/useFirebaseSettings';
import { generateSeasonSchedule } from './utils/schedule';

export default function Home() {
  const { scheduleEntries, setScheduleEntries, toggleEntry, isLoading, error } = useFirebaseSchedule();
  const { settings } = useFirebaseSettings();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Initialize schedule on first load
  useEffect(() => {
    if (!isLoading && scheduleEntries.length === 0) {
      const newSchedule = generateSeasonSchedule();
      setScheduleEntries(newSchedule);
    }
  }, [isLoading, scheduleEntries.length, setScheduleEntries]);

  const handleToggleComplete = (entryId: string) => {
    toggleEntry(entryId);
  };


  // Calculate stats
  const totalDays = TOTAL_SEASONS * DAYS_PER_SEASON;
  const totalChannels = TOTAL_SEASONS * CHANNELS_PER_SEASON;
  const completedEntries = scheduleEntries.filter(e => e.completed).length;
  const totalEntries = scheduleEntries.length;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg text-black">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg text-red-600">Error loading schedule. Please check your Firebase configuration.</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 sm:p-8">
      <div className="w-full">
        <header className="glass-container mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-5xl font-semibold mb-3 text-black">Social Scheduler</h1>
              <p className="text-lg text-gray-700">
                Season-based scheduling system: <span className="text-black">{TOTAL_SEASONS} seasons</span> × <span className="text-black">{DAYS_PER_SEASON} days</span> × <span className="text-black">{CHANNELS_PER_SEASON} channels</span>
              </p>
            </div>
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="glass-btn p-3 hover:bg-black/10 transition-colors"
              aria-label="Cài đặt"
              title="Cài đặt"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </button>
          </div>
        </header>

        {/* Stats Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="glass-card">
            <div className="text-base text-gray-600 mb-2">Total Days</div>
            <div className="text-5xl text-black mb-1">{totalDays}</div>
            <div className="text-sm text-gray-500">{TOTAL_SEASONS} seasons</div>
          </div>
          <div className="glass-card">
            <div className="text-base text-gray-600 mb-2">Total Channels</div>
            <div className="text-5xl text-black mb-1">{totalChannels}</div>
            <div className="text-sm text-gray-500">{CHANNELS_PER_SEASON} per season</div>
          </div>
          <div className="glass-card">
            <div className="text-base text-gray-600 mb-2">Completed</div>
            <div className="text-5xl text-black mb-1">{completedEntries}</div>
            <div className="text-sm text-gray-500">of {totalEntries.toLocaleString()} total</div>
          </div>
          <div className="glass-card">
            <div className="text-base text-gray-600 mb-2">Progress</div>
            <div className="text-5xl text-black mb-1">
              {totalEntries > 0 ? Math.round((completedEntries / totalEntries) * 100) : 0}%
            </div>
            <div className="text-sm text-gray-500">overall completion</div>
          </div>
        </div>

        <Calendar
          scheduleEntries={scheduleEntries}
          onToggleComplete={handleToggleComplete}
          channelSuffixes={settings.channelSuffixes}
        />

        <CountdownSection />

        <Settings
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
        />
      </div>
    </div>
  );
}
