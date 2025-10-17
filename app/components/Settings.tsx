"use client";

import { useState, useMemo } from 'react';
import { useFirebaseSettings } from '@/app/hooks/useFirebaseSettings';
import { CHANNELS_PER_SEASON, TOTAL_SEASONS } from '@/app/types';

interface SettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Settings({ isOpen, onClose }: SettingsProps) {
  const { settings, isLoading, updateChannelSuffix } = useFirebaseSettings();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterMode, setFilterMode] = useState<"all" | "configured" | "empty">("all");

  // Calculate total channels across all seasons
  const totalChannels = TOTAL_SEASONS * CHANNELS_PER_SEASON;

  // Generate all channel indexes (0-based)
  const allChannelIndexes = useMemo(() => {
    return Array.from({ length: totalChannels }, (_, i) => i);
  }, [totalChannels]);

  // Filter channels based on search and filter mode
  const filteredChannels = useMemo(() => {
    let channels = allChannelIndexes;

    // Filter by mode
    if (filterMode === "configured") {
      channels = channels.filter(idx => settings.channelSuffixes[idx]);
    } else if (filterMode === "empty") {
      channels = channels.filter(idx => !settings.channelSuffixes[idx]);
    }

    // Filter by search term
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      channels = channels.filter(idx => {
        const channelNum = idx + 1;
        const suffix = settings.channelSuffixes[idx] || "";
        return (
          `c${channelNum}`.includes(search) ||
          suffix.toLowerCase().includes(search)
        );
      });
    }

    return channels;
  }, [allChannelIndexes, settings.channelSuffixes, searchTerm, filterMode]);

  const handleSuffixChange = (channelIndex: number, newSuffix: string) => {
    updateChannelSuffix(channelIndex, newSuffix);
  };

  // Count configured channels
  const configuredCount = Object.keys(settings.channelSuffixes).length;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="glass-container max-w-5xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold">Cài đặt Channel</h2>
            <p className="text-sm text-gray-600 mt-1">
              {configuredCount} / {totalChannels} channels đã đặt tên
            </p>
          </div>
          <button
            onClick={onClose}
            className="glass-btn p-2 hover:bg-black/10 transition-colors"
            aria-label="Đóng"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Filters */}
        <div className="p-6 border-b border-gray-200 space-y-4">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm kiếm channel (ví dụ: C1, Boom Bap...)"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <div className="flex gap-2">
            <button
              onClick={() => setFilterMode("all")}
              className={`glass-btn px-4 py-2 ${filterMode === "all" ? "bg-blue-600 text-white" : ""}`}
            >
              Tất cả ({allChannelIndexes.length})
            </button>
            <button
              onClick={() => setFilterMode("configured")}
              className={`glass-btn px-4 py-2 ${filterMode === "configured" ? "bg-blue-600 text-white" : ""}`}
            >
              Đã đặt tên ({configuredCount})
            </button>
            <button
              onClick={() => setFilterMode("empty")}
              className={`glass-btn px-4 py-2 ${filterMode === "empty" ? "bg-blue-600 text-white" : ""}`}
            >
              Chưa đặt tên ({allChannelIndexes.length - configuredCount})
            </button>
          </div>
        </div>

        {/* Channel List */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredChannels.map((channelIndex) => {
              const channelNum = channelIndex + 1;
              const currentSuffix = settings.channelSuffixes[channelIndex] || "";

              return (
                <div key={channelIndex} className="glass-card p-4">
                  <label className="block mb-2 font-semibold text-sm">
                    C{channelNum}
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={currentSuffix}
                      onChange={(e) => handleSuffixChange(channelIndex, e.target.value)}
                      placeholder="Ví dụ: Boom Bap"
                      disabled={isLoading}
                      className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                    />
                    {currentSuffix && (
                      <button
                        onClick={() => handleSuffixChange(channelIndex, "")}
                        disabled={isLoading}
                        className="glass-btn px-3 py-2 text-sm hover:bg-red-50 hover:text-red-600 transition-colors disabled:opacity-50"
                        title="Xóa"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                  {currentSuffix && (
                    <div className="mt-2 text-xs text-gray-500 bg-blue-50 px-2 py-1 rounded">
                      Preview: C{channelNum}{currentSuffix}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {filteredChannels.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-lg">Không tìm thấy channel nào</p>
              <p className="text-sm mt-1">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
            </div>
          )}
        </div>

        {/* Info Section */}
        <div className="p-6 border-t border-gray-200">
          <div className="glass-card p-4 bg-yellow-50 border-yellow-200">
            <div className="flex gap-2">
              <svg className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <div>
                <p className="text-sm font-medium text-yellow-900">Lưu ý</p>
                <p className="text-sm text-yellow-800 mt-1">
                  Thay đổi sẽ tự động lưu sau 0.5 giây và đồng bộ trên tất cả thiết bị. Bạn có thể để trống đuôi cho các channel không cần tùy chỉnh.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="glass-btn px-6 py-2 hover:bg-black/10 transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
