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

export default function ChannelManager({
  channels,
  onAddChannel,
  onUpdateChannel,
  onDeleteChannel,
}: ChannelManagerProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newChannel, setNewChannel] = useState({
    name: '',
    yearlyGoal: 52,
    color: PRESET_COLORS[0],
    isActive: true,
  });

  const handleAdd = () => {
    if (newChannel.name.trim()) {
      onAddChannel(newChannel);
      setNewChannel({
        name: '',
        yearlyGoal: 52,
        color: PRESET_COLORS[channels.length % PRESET_COLORS.length],
        isActive: true,
      });
      setIsAdding(false);
    }
  };

  return (
    <div className="glass-container p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-white">Channels</h2>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="glass-btn"
        >
          {isAdding ? 'Cancel' : '+ Add Channel'}
        </button>
      </div>

      {isAdding && (
        <div className="mb-4 glass-card">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-white/90">Channel Name</label>
              <input
                type="text"
                value={newChannel.name}
                onChange={(e) => setNewChannel({ ...newChannel, name: e.target.value })}
                placeholder="e.g., Beats Channel 1"
                className="glass-input w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-white/90">
                Yearly Goal (videos per year)
              </label>
              <input
                type="number"
                value={newChannel.yearlyGoal}
                onChange={(e) => setNewChannel({ ...newChannel, yearlyGoal: parseInt(e.target.value) || 0 })}
                min="1"
                max="365"
                className="glass-input w-full"
              />
            <div>
              <label className="block text-sm font-medium mb-1">Color</label>
              <div className="flex gap-2 flex-wrap">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => setNewChannel({ ...newChannel, color })}
                    className={`w-8 h-8 rounded-full border-2 ${
                      newChannel.color === color ? 'border-black dark:border-white' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
            {/* Close space-y-4 div here */}
          </div>
          <button
            onClick={handleAdd}
            className="w-full px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Add Channel
          </button>
          </div>
        </div>
      )}

    <div className="space-y-3">
        {channels.map((channel) => (
          <div
            key={channel.id}
            className="glass-card flex items-center justify-between p-4"
          >
            <div className="flex items-center gap-3 flex-1">
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: channel.color }}
              />
              <div className="flex-1">
                <input
                  type="text"
                  value={channel.name}
                  onChange={(e) => onUpdateChannel(channel.id, { name: e.target.value })}
                  className="glass-input font-medium"
                />
                <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  <input
                    type="number"
                    value={channel.yearlyGoal}
                    onChange={(e) => onUpdateChannel(channel.id, { yearlyGoal: parseInt(e.target.value) || 0 })}
                    className="w-16 bg-transparent border-b border-transparent hover:border-gray-300 focus:border-blue-500 outline-none"
                    min="1"
                    max="365"
                  />
                  {' '}videos/year • Every{' '}
                  {Math.floor(365 / channel.yearlyGoal)} days
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={channel.isActive}
                  onChange={(e) => onUpdateChannel(channel.id, { isActive: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              </label>
              <button
                onClick={() => onDeleteChannel(channel.id)}
                className="px-3 py-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
              >
                Delete
              </button>
            </div>
          </div>
        ))}

        {channels.length === 0 && !isAdding && (
          <div className="text-center py-8 text-gray-500">
            No channels yet. Add your first channel to get started!
          </div>
        )}
      </div>
    </div>
  );
}
