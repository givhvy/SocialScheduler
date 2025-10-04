import { ScheduleEntry, TOTAL_SEASONS, DAYS_PER_SEASON, CHANNELS_PER_SEASON, getChannelName } from '../types';

/**
 * Generate schedule entries for the season-based system
 * 12 seasons x 40 days = 480 days total
 * Each season has 84 channels
 */
export function generateSeasonSchedule(): ScheduleEntry[] {
  const entries: ScheduleEntry[] = [];

  for (let season = 1; season <= TOTAL_SEASONS; season++) {
    const seasonStartDay = (season - 1) * DAYS_PER_SEASON + 1;
    const seasonEndDay = season * DAYS_PER_SEASON;
    const channelOffset = (season - 1) * CHANNELS_PER_SEASON;

    for (let day = seasonStartDay; day <= seasonEndDay; day++) {
      for (let channelIndex = 0; channelIndex < CHANNELS_PER_SEASON; channelIndex++) {
        const globalChannelIndex = channelOffset + channelIndex;
        const channelName = getChannelName(globalChannelIndex);

        entries.push({
          id: `${channelName}-day${day}`,
          channelId: channelName,
          date: day.toString(),
          completed: false,
        });
      }
    }
  }

  return entries;
}

/**
 * Get schedule entries for a specific day
 */
export function getEntriesForDay(
  entries: ScheduleEntry[],
  dayNumber: number
): ScheduleEntry[] {
  return entries.filter(entry => entry.date === dayNumber.toString());
}

/**
 * Get all entries for a specific channel
 */
export function getEntriesForChannel(
  entries: ScheduleEntry[],
  channelId: string
): ScheduleEntry[] {
  return entries.filter(entry => entry.channelId === channelId);
}
