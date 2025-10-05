'use client';

import { useEffect } from 'react';
import Calendar from './components/Calendar';
import CountdownSection from './components/CountdownSection';
import { TOTAL_SEASONS, DAYS_PER_SEASON, CHANNELS_PER_SEASON } from './types';
import { useFirebaseSchedule } from './hooks/useFirebaseSchedule';
import { generateSeasonSchedule } from './utils/schedule';

export default function Home() {
  const { scheduleEntries, setScheduleEntries, toggleEntry, isLoading, error } = useFirebaseSchedule();

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
        <div className="text-lg text-white">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg text-red-400">Error loading schedule. Please check your Firebase configuration.</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 sm:p-8">
      <div className="w-full">
        <header className="glass-container mb-8">
          <h1 className="text-5xl font-bold mb-3 text-white">Social Scheduler</h1>
          <p className="text-lg text-gray-200">
            Season-based scheduling system: <span className="font-bold text-blue-300">{TOTAL_SEASONS} seasons</span> × <span className="font-bold text-green-300">{DAYS_PER_SEASON} days</span> × <span className="font-bold text-purple-300">{CHANNELS_PER_SEASON} channels</span>
          </p>
        </header>

        {/* Stats Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="glass-card">
            <div className="text-base font-semibold text-gray-200 mb-2">Total Days</div>
            <div className="text-5xl font-bold text-white mb-1">{totalDays}</div>
            <div className="text-sm text-gray-300 font-medium">{TOTAL_SEASONS} seasons</div>
          </div>
          <div className="glass-card">
            <div className="text-base font-semibold text-gray-200 mb-2">Total Channels</div>
            <div className="text-5xl font-bold text-blue-400 mb-1">{totalChannels}</div>
            <div className="text-sm text-gray-300 font-medium">{CHANNELS_PER_SEASON} per season</div>
          </div>
          <div className="glass-card">
            <div className="text-base font-semibold text-gray-200 mb-2">Completed</div>
            <div className="text-5xl font-bold text-green-400 mb-1">{completedEntries}</div>
            <div className="text-sm text-gray-300 font-medium">of {totalEntries.toLocaleString()} total</div>
          </div>
          <div className="glass-card">
            <div className="text-base font-semibold text-gray-200 mb-2">Progress</div>
            <div className="text-5xl font-bold text-purple-400 mb-1">
              {totalEntries > 0 ? Math.round((completedEntries / totalEntries) * 100) : 0}%
            </div>
            <div className="text-sm text-gray-300 font-medium">overall completion</div>
          </div>
        </div>

        <Calendar
          scheduleEntries={scheduleEntries}
          onToggleComplete={handleToggleComplete}
        />

        <CountdownSection />
      </div>
    </div>
  );
}
