'use client';

import { ScheduleEntry, getSeason, getChannelName, TOTAL_SEASONS, DAYS_PER_SEASON, CHANNELS_PER_SEASON } from '../types';
import { useFirebaseNavigation } from '../hooks/useFirebaseNavigation';

interface CalendarProps {
  scheduleEntries: ScheduleEntry[];
  onToggleComplete: (entryId: string) => void;
}

export default function Calendar({
  scheduleEntries,
  onToggleComplete,
}: CalendarProps) {
  const { currentDay, currentPage, setCurrentDay, setCurrentPage, isLoaded } = useFirebaseNavigation();
  const channelsPerPage = 12; // Display 12 channels per page

  const season = getSeason(currentDay);
  const allChannelIndexes = Array.from(
    { length: CHANNELS_PER_SEASON },
    (_, i) => season.startChannelIndex + i
  );

  // Calculate pagination
  const totalPages = Math.ceil(allChannelIndexes.length / channelsPerPage);
  const startIndex = (currentPage - 1) * channelsPerPage;
  const endIndex = startIndex + channelsPerPage;
  const channelIndexes = allChannelIndexes.slice(startIndex, endIndex);

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
    setCurrentPage(1); // Reset to first page when changing days
  };

  const previousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const goToPage = (page: number) => {
    setCurrentPage(page);
  };

  // Generate page numbers to display (max 7 pages visible)
  const getPageNumbers = () => {
    const pages: number[] = [];
    const maxVisible = 7;

    if (totalPages <= maxVisible) {
      // Show all pages
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Show first page, last page, and pages around current page
      if (currentPage <= 4) {
        for (let i = 1; i <= 5; i++) pages.push(i);
        pages.push(-1); // Ellipsis
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 3) {
        pages.push(1);
        pages.push(-1); // Ellipsis
        for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push(-1); // Ellipsis
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
        pages.push(-1); // Ellipsis
        pages.push(totalPages);
      }
    }

    return pages;
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
              Day {currentDay} / {TOTAL_SEASONS * DAYS_PER_SEASON}
            </h2>
            <p className="text-base text-gray-700">
              Season {season.seasonNumber} (Days {season.startDay}-{season.endDay}) •
              Channels {getChannelName(season.startChannelIndex)}-{getChannelName(season.endChannelIndex)}
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

      {/* Channel grid */}
      <div className="glass-container p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
          {channelIndexes.map((channelIndex) => {
            const entry = getEntryForChannel(channelIndex);
            const channelName = getChannelName(channelIndex);

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

        {/* Pagination Controls */}
        <div className="flex justify-center items-center gap-2 mt-6 pt-4 border-t border-gray-200">
          <button
            onClick={previousPage}
            disabled={currentPage === 1}
            className="glass-btn !p-2 w-10 h-10 flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label="Previous page"
          >
            ←
          </button>

          {getPageNumbers().map((page, index) => {
            if (page === -1) {
              return (
                <span key={`ellipsis-${index}`} className="px-2 text-gray-500">
                  ...
                </span>
              );
            }

            return (
              <button
                key={page}
                onClick={() => goToPage(page)}
                className={`glass-btn !p-2 w-10 h-10 flex items-center justify-center text-base transition-all ${
                  currentPage === page
                    ? '!bg-blue-600 !text-white ring-2 ring-blue-600'
                    : 'hover:bg-gray-100'
                }`}
              >
                {page}
              </button>
            );
          })}

          <button
            onClick={nextPage}
            disabled={currentPage === totalPages}
            className="glass-btn !p-2 w-10 h-10 flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label="Next page"
          >
            →
          </button>
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
