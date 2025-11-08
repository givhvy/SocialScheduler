'use client';

import { ScheduleEntry, getSeason, getChannelName, formatDayDate, TOTAL_SEASONS, DAYS_PER_SEASON, CHANNELS_PER_SEASON } from '../types';
import { useFirebaseNavigation } from '../hooks/useFirebaseNavigation';

interface CalendarProps {
  scheduleEntries: ScheduleEntry[];
  onToggleComplete: (entryId: string) => void;
  channelSuffixes?: Record<number, string>;
}

export default function Calendar({
  scheduleEntries,
  onToggleComplete,
  channelSuffixes = {},
}: CalendarProps) {
  const { currentDay, setCurrentDay, isLoaded } = useFirebaseNavigation();

  const season = getSeason(currentDay);
  const channelIndexes = Array.from(
    { length: CHANNELS_PER_SEASON },
    (_, i) => season.startChannelIndex + i
  );

  const previousDay = () => {
    if (currentDay > 1) {
      setCurrentDay(currentDay - 1);
    }
  };

  const nextDay = () => {
    if (currentDay < TOTAL_SEASONS * DAYS_PER_SEASON) {
      setCurrentDay(currentDay + 1);
    }
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

  // Show loading state while loading from Firebase to prevent flash of default values
  if (!isLoaded) {
    return (
      <div className="w-full">
        <div className="glass-container p-6 mb-4 text-center text-gray-500">
          Loading calendar...
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Header with navigation */}
      <div className="glass-container p-6 mb-4 sticky top-0 z-10">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl text-black mb-1">
              {formatDayDate(currentDay)}
            </h2>
            <p className="text-base text-gray-700">
              Season {season.seasonNumber} ({formatDayDate(season.startDay)} - {formatDayDate(season.endDay)}) •
              Channels {getChannelName(season.startChannelIndex, channelSuffixes)}-{getChannelName(season.endChannelIndex, channelSuffixes)}
            </p>
          </div>
          <div className="glass-bar flex gap-2 px-2">
            <button
              onClick={previousDay}
              disabled={currentDay === 1}
              className="glass-btn !p-2 aspect-square disabled:opacity-30"
              aria-label="Ngày trước"
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
              aria-label="Ngày tiếp theo"
            >
              →
            </button>
          </div>
        </div>
      </div>

      {/* Channel grid */}
      <div className="glass-container p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
          {channelIndexes.map((channelIndex) => {
            const entry = getEntryForChannel(channelIndex);
            const channelName = getChannelName(channelIndex, channelSuffixes);

            return (
              <div
                key={channelIndex}
                onClick={() => entry && onToggleComplete(entry.id)}
                className={`glass-card p-4 cursor-pointer transition-all ${
                  entry?.completed
                    ? 'completed-card'
                    : 'hover:border-gray-400 hover:shadow-lg'
                }`}
              >
                <div className="text-lg text-black mb-2">
                  {channelName}
                </div>
                <div className={`text-sm ${
                  entry?.completed ? 'text-green-700' : 'text-gray-500'
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
        <div className="text-lg text-black mb-3">Quick jump to season:</div>
        <div className="flex flex-wrap gap-3">
          {Array.from({ length: TOTAL_SEASONS }, (_, i) => {
            const seasonNum = i + 1;
            const seasonStartDay = i * DAYS_PER_SEASON + 1;
            return (
              <button
                key={seasonNum}
                onClick={() => goToDay(seasonStartDay)}
                className={`glass-btn px-6 py-3 text-base ${
                  season.seasonNumber === seasonNum
                    ? 'bg-black ring-2 ring-black'
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
        <p className="text-base text-gray-700">💡 Click on any channel card to mark it as completed/pending</p>
      </div>
    </div>
  );
}
