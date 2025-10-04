'use client';

import { useState, useEffect } from 'react';
import Timeline from './Timeline';

interface StatusPollerProps {
  videoId: string;
}

interface VideoStatus {
  id: string;
  status: 'uploading' | 'processing' | 'indexing' | 'completed' | 'error';
  progress?: number;
  message?: string;
  error?: string;
  timeline?: Record<string, unknown>;
}

export default function StatusPoller({ videoId }: StatusPollerProps) {
  const [status, setStatus] = useState<VideoStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('🔄 StatusPoller started for videoId:', videoId);

    const pollStatus = async () => {
      try {
        const statusUrl = `https://advertising-475w.onrender.com/api/videos/${videoId}/status`;
        console.log('📡 Polling status from:', statusUrl);

        const response = await fetch(statusUrl);
        console.log('📊 Status response:', response.status, response.statusText);

        if (!response.ok) {
          console.log('❌ Status response not ok:', response.status, response.statusText);
          throw new Error(`Status check failed: ${response.statusText}`);
        }

        const data: VideoStatus = await response.json();
        console.log('✅ Status data received:', data);
        setStatus(data);
        setLoading(false);

        // Stop polling if video processing is complete or errored
        if (data.status === 'completed' || data.status === 'error') {
          console.log('🏁 Polling stopped - final status:', data.status);
          clearInterval(interval);
        }
      } catch (error) {
        console.error('❌ Error polling status:', error);

        if (error instanceof TypeError && error.message.includes('fetch')) {
          console.log('🌐 Network error detected during status polling');
        }

        setStatus({
          id: videoId,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        setLoading(false);
        clearInterval(interval);
      }
    };

    // Poll immediately
    pollStatus();

    // Set up polling interval (every 2 seconds)
    const interval = setInterval(pollStatus, 2000);

    // Cleanup on unmount
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [videoId]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'uploading':
        return 'text-blue-600';
      case 'processing':
      case 'indexing':
        return 'text-yellow-600';
      case 'completed':
        return 'text-green-600';
      case 'error':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
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

  const getStatusMessage = (status: string) => {
    switch (status) {
      case 'uploading':
        return 'Uploading video...';
      case 'processing':
        return 'Processing video content...';
      case 'indexing':
        return 'Creating searchable index...';
      case 'completed':
        return 'Analysis complete!';
      case 'error':
        return 'Processing failed';
      default:
        return 'Initializing...';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Checking status...</span>
      </div>
    );
  }

  if (!status) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <p className="text-red-700">Failed to load video status</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Status Header */}
      <div className="flex items-center space-x-3">
        <span className="text-2xl">{getStatusIcon(status.status)}</span>
        <div>
          <h3 className={`text-lg font-semibold ${getStatusColor(status.status)}`}>
            {getStatusMessage(status.status)}
          </h3>
          {status.message && (
            <p className="text-sm text-gray-600">{status.message}</p>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      {status.progress !== undefined && status.status !== 'completed' && status.status !== 'error' && (
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${status.progress}%` }}
          ></div>
        </div>
      )}

      {/* Progress Text */}
      {status.progress !== undefined && (
        <p className="text-sm text-gray-600 text-center">
          {status.progress}% complete
        </p>
      )}

      {/* Error Message */}
      {status.status === 'error' && status.error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <h4 className="font-semibold text-red-800 mb-2">Error Details:</h4>
          <p className="text-red-700 text-sm">{status.error}</p>
        </div>
      )}

      {/* Timeline UI when analysis is complete */}
      {status.status === 'completed' && (
        <div>
          <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-6">
            <h4 className="font-semibold text-green-800 mb-2">✅ Analysis Complete!</h4>
            <p className="text-green-700 text-sm">
              Your video has been analyzed. Select scenes below to create your advertisement.
            </p>
          </div>
          <Timeline videoId={videoId} />
        </div>
      )}

      {/* Processing Steps */}
      {(status.status === 'processing' || status.status === 'indexing') && (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <h4 className="font-semibold text-blue-800 mb-2">Processing Steps:</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li className="line-through">
              ✓ Upload video
            </li>
            <li className={status.status === 'processing' ? 'font-bold' : 'line-through'}>
              {status.status === 'processing' ? '🔄' : '✓'} Analyze content (scenes, objects, speech)
            </li>
            <li className={status.status === 'indexing' ? 'font-bold' : ''}>
              {status.status === 'indexing' ? '🔄' : '⏳'} Create searchable index
            </li>
            <li>
              ⏳ Ready for template selection
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}