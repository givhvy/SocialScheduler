'use client';

import { Channel } from '../types';
import { useState } from 'react';

interface ChannelManagerProps {
  channels: Channel[];
  onAddChannel: (channel: Omit<Channel, 'id'>) => void;
  onUpdateChannel: (id: string, updates: Partial<Channel>) => void;
  onDeleteChannel: (id: string) => void;
}

const PRESET_COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16',
  '#22c55e', '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9',
  '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef',
  '#ec4899', '#f43f5e'
];