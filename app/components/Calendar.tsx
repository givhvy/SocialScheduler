'use client';

import { ScheduleEntry, getSeason, getChannelName, TOTAL_SEASONS, DAYS_PER_SEASON, CHANNELS_PER_SEASON } from '../types';
import { useState } from 'react';

interface CalendarProps {
  scheduleEntries: ScheduleEntry[];
  onToggleComplete: (entryId: string) => void;
}

export default function Calendar({
  scheduleEntries,
  onToggleComplete,
}: CalendarProps) {
  const [currentDay, setCurrentDay] = useState(1); // 1-480

  const season = getSeason(currentDay);
  const channelIndexes = Array.from(
    { length: CHANNELS_PER_SEASON },
    (_, i) => season.startChannelIndex + i
  );

  const previousDay = () => {
    if (currentDay > 1) setCurrentDay(currentDay - 1);
  };

  const nextDay = () => {
    if (currentDay < TOTAL_SEASONS * DAYS_PER_SEASON) setCurrentDay(currentDay + 1);
  };

  const goToDay = (day: number) => {
    setCurrentDay(day);
  };

  const getEntryForChannel = (channelIndex: number): ScheduleEntry | undefined => {
    const channelName = getChannelName(channelIndex);
    return scheduleEntries.find(
      e => e.channelId === channelName && parseInt(e.date) === currentDay
    );
  };

  return (
    <div className="w-full">
      {/* Header with navigation */}
      <div className="glass-container p-6 mb-4 sticky top-0 z-10">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold text-white mb-1">
              Day {currentDay} / {TOTAL_SEASONS * DAYS_PER_SEASON}
            </h2>
            <p className="text-base text-gray-200">
              <span className="font-bold text-blue-300">Season {season.seasonNumber}</span> (Days {season.startDay}-{season.endDay}) •
              Channels <span className="font-bold text-green-300">{getChannelName(season.startChannelIndex)}</span>-<span className="font-bold text-green-300">{getChannelName(season.endChannelIndex)}</span>
            </p>
          </div>
          <div className="glass-bar flex gap-2 px-2">
            <button
              onClick={previousDay}
              disabled={currentDay === 1}
              className="glass-btn !p-2 aspect-square disabled:opacity-30"
              aria-label="Previous day"
            >
              ←
            </button>
            <input
              type="number"
              min="1"
              max={TOTAL_SEASONS * DAYS_PER_SEASON}
              value={currentDay}
              onChange={(e) => {
                const val = parseInt(e.target.value);
                if (val >= 1 && val <= TOTAL_SEASONS * DAYS_PER_SEASON) {
                  goToDay(val);
                }
              }}
              className="glass-btn !w-20 text-center"
            />
            <button
              onClick={nextDay}
              disabled={currentDay === TOTAL_SEASONS * DAYS_PER_SEASON}
              className="glass-btn !p-2 aspect-square disabled:opacity-30"
              aria-label="Next day"
            >
              →
            </button>
          </div>
        </div>
      </div>

      {/* Scrollable channel grid */}
      <div className="glass-container p-4 overflow-x-auto">
        <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(84, minmax(140px, 1fr))' }}>
          {channelIndexes.map((channelIndex) => {
            const entry = getEntryForChannel(channelIndex);
            const channelName = getChannelName(channelIndex);

            return (
              <div
                key={channelIndex}
                onClick={() => entry && onToggleComplete(entry.id)}
                className={`glass-card p-4 cursor-pointer transition-all ${
                  entry?.completed
                    ? 'bg-green-500/20 border-green-400 ring-2 ring-green-400'
                    : 'hover:border-blue-400 hover:shadow-lg'
                }`}
              >
                <div className="text-lg font-bold text-blue-300 mb-2">
                  {channelName}
                </div>
                <div className={`text-sm font-semibold ${
                  entry?.completed ? 'text-green-300' : 'text-gray-400'
                }`}>
                  {entry?.completed ? '✓ Completed' : '○ Pending'}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Season navigation */}
      <div className="glass-container p-6 mt-4">
        <div className="text-lg font-bold text-white mb-3">Quick jump to season:</div>
        <div className="flex flex-wrap gap-3">
          {Array.from({ length: TOTAL_SEASONS }, (_, i) => {
            const seasonNum = i + 1;
            const seasonStartDay = i * DAYS_PER_SEASON + 1;
            return (
              <button
                key={seasonNum}
                onClick={() => goToDay(seasonStartDay)}
                className={`glass-btn px-6 py-3 text-base font-bold ${
                  season.seasonNumber === seasonNum
                    ? 'bg-blue-600 ring-2 ring-blue-400 shadow-lg shadow-blue-500/50'
                    : ''
                }`}
              >
                Season {seasonNum}
              </button>
            );
          })}
        </div>
      </div>

      <div className="glass-bar py-4 text-center mt-4">
        <p className="text-base text-gray-200 font-semibold">💡 Click on any channel card to mark it as completed/pending</p>
      </div>
    </div>
  );
}
