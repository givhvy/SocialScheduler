export interface Channel {
  id: string;
  name: string;
  color: string;
  yearlyGoal: number; // Number of videos per year
  isActive: boolean;
}

export interface ScheduleEntry {
  id: string;
  channelId: string;
  date: string; // ISO date string
  completed: boolean;
}

export interface ScheduleConfig {
  channels: Channel[];
  scheduleEntries: ScheduleEntry[];
}

// User settings for channel customization
export interface UserSettings {
  channelSuffixes: Record<number, string>; // Channel index -> suffix mapping (e.g., {0: "Boom Bap", 1: "Lo-fi"})
  updatedAt?: Date;
}

// Season-based system: 12 seasons x 40 days = 480 days total
export const TOTAL_SEASONS = 12;
export const DAYS_PER_SEASON = 40;
export const CHANNELS_PER_SEASON = 84;

// Start date for the schedule (customize this to your needs)
export const SCHEDULE_START_DATE = new Date('2025-11-08');

export interface Season {
  seasonNumber: number; // 1-12
  startDay: number; // 1-480
  endDay: number; // 1-480
  startChannelIndex: number; // C1 = 0, C85 = 84, etc.
  endChannelIndex: number; // C84 = 83, C168 = 167, etc.
}

export function getSeason(dayNumber: number): Season {
  const seasonNumber = Math.ceil(dayNumber / DAYS_PER_SEASON);
  const startDay = (seasonNumber - 1) * DAYS_PER_SEASON + 1;
  const endDay = seasonNumber * DAYS_PER_SEASON;
  const startChannelIndex = (seasonNumber - 1) * CHANNELS_PER_SEASON;
  const endChannelIndex = seasonNumber * CHANNELS_PER_SEASON - 1;

  return {
    seasonNumber,
    startDay,
    endDay,
    startChannelIndex,
    endChannelIndex,
  };
}

export function getChannelName(channelIndex: number, suffixes?: Record<number, string>): string {
  const baseName = `C${channelIndex + 1}`;
  const suffix = suffixes?.[channelIndex] || "";
  return suffix ? `${baseName} - ${suffix}` : baseName;
}

// Convert day number (1-480) to actual date
export function getDayDate(dayNumber: number): Date {
  const date = new Date(SCHEDULE_START_DATE);
  date.setDate(date.getDate() + (dayNumber - 1));
  return date;
}

// Format date as "Ngày DD/MM/YYYY"
export function formatDayDate(dayNumber: number): string {
  const date = getDayDate(dayNumber);
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `Ngày ${day}/${month}/${year}`;
}
