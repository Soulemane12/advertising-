'use client';

import { useState, useEffect } from 'react';
import { videoStorage, StoredVideo, formatFileSize, formatUploadDate } from '@/lib/videoStorage';

interface VideoHistoryProps {
  onSelectVideo: (videoId: string) => void;
  onUploadNew: () => void;
}

export default function VideoHistory({ onSelectVideo, onUploadNew }: VideoHistoryProps) {
  const [videos, setVideos] = useState<StoredVideo[]>([]);
  const [filter, setFilter] = useState<'all' | 'completed' | 'processing'>('all');

  useEffect(() => {
    loadVideos();
    // Refresh every 5 seconds to update status of processing videos
    const interval = setInterval(loadVideos, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadVideos = () => {
    const allVideos = videoStorage.getAll();
    setVideos(allVideos);
  };

  const handleDelete = (videoId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this video from your history?')) {
      videoStorage.delete(videoId);
      loadVideos();
    }
  };

  const filteredVideos = videos.filter(video => {
    switch (filter) {
      case 'completed':
        return video.status === 'completed';
      case 'processing':
        return ['uploading', 'processing', 'indexing'].includes(video.status);
      default:
        return true;
    }
  });

  const getStatusIcon = (status: StoredVideo['status']) => {
    switch (status) {
      case 'uploading':
        return '⬆️';
      case 'processing':
        return '⚙️';
      case 'indexing':
        return '🔍';
      case 'completed':
        return '✅';
      case 'error':
        return '❌';
      default:
        return '⏳';
    }
  };

  const getStatusColor = (status: StoredVideo['status']) => {
    switch (status) {
      case 'uploading':
        return 'text-blue-600 bg-blue-50';
      case 'processing':
      case 'indexing':
        return 'text-yellow-600 bg-yellow-50';
      case 'completed':
        return 'text-green-600 bg-green-50';
      case 'error':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  if (videos.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">📁</div>
        <h3 className="text-xl font-semibold mb-2">No videos yet</h3>
        <p className="text-gray-600 mb-6">Upload your first video to get started with analysis</p>
        <button
          onClick={onUploadNew}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Upload Video
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Video History</h2>
        <button
          onClick={onUploadNew}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Upload New Video
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
        {[
          { key: 'all', label: 'All Videos', count: videos.length },
          { key: 'completed', label: 'Ready', count: videos.filter(v => v.status === 'completed').length },
          { key: 'processing', label: 'Processing', count: videos.filter(v => ['uploading', 'processing', 'indexing'].includes(v.status)).length }
        ].map(({ key, label, count }) => (
          <button
            key={key}
            onClick={() => setFilter(key as typeof filter)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              filter === key
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {label} ({count})
          </button>
        ))}
      </div>

      {/* Video List */}
      <div className="space-y-3">
        {filteredVideos.map((video) => (
          <div
            key={video.videoId}
            onClick={() => video.status === 'completed' && onSelectVideo(video.videoId)}
            className={`border rounded-lg p-4 transition-colors ${
              video.status === 'completed'
                ? 'hover:border-blue-300 hover:bg-blue-50 cursor-pointer'
                : 'cursor-default'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-3 mb-2">
                  <span className="text-xl">{getStatusIcon(video.status)}</span>
                  <h3 className="font-medium text-gray-900 truncate">
                    {video.name}
                  </h3>
                  <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(video.status)}`}>
                    {video.status}
                  </span>
                </div>

                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <span>{formatUploadDate(video.uploadDate)}</span>
                  {video.fileSize && (
                    <span>{formatFileSize(video.fileSize)}</span>
                  )}
                  <span>ID: {video.videoId}</span>
                </div>

                {video.error && (
                  <p className="text-red-600 text-sm mt-2">{video.error}</p>
                )}
              </div>

              <div className="flex items-center space-x-2 ml-4">
                {video.status === 'completed' && (
                  <span className="text-xs text-green-600 font-medium">
                    Click to view
                  </span>
                )}
                <button
                  onClick={(e) => handleDelete(video.videoId, e)}
                  className="text-gray-400 hover:text-red-600 transition-colors"
                  title="Delete from history"
                >
                  🗑️
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredVideos.length === 0 && filter !== 'all' && (
        <div className="text-center py-8">
          <p className="text-gray-600">No {filter} videos found</p>
        </div>
      )}

      {/* Stats */}
      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-medium text-gray-900 mb-2">Statistics</h4>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Total Videos:</span>
            <span className="ml-2 font-medium">{videos.length}</span>
          </div>
          <div>
            <span className="text-gray-600">Completed:</span>
            <span className="ml-2 font-medium text-green-600">
              {videos.filter(v => v.status === 'completed').length}
            </span>
          </div>
          <div>
            <span className="text-gray-600">Processing:</span>
            <span className="ml-2 font-medium text-yellow-600">
              {videos.filter(v => ['uploading', 'processing', 'indexing'].includes(v.status)).length}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}