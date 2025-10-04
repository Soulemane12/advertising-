'use client';

import { useState, useEffect } from 'react';

interface StatusPollerProps {
  videoId: string;
}

interface VideoStatus {
  id: string;
  status: 'uploading' | 'processing' | 'indexing' | 'completed' | 'error';
  progress?: number;
  message?: string;
  error?: string;
  timeline?: any;
}

export default function StatusPoller({ videoId }: StatusPollerProps) {
  const [status, setStatus] = useState<VideoStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    const pollStatus = async () => {
      try {
        const response = await fetch(`http://localhost:8000/api/videos/${videoId}/status`);
        if (!response.ok) {
          throw new Error('Failed to fetch status');
        }

        const data: VideoStatus = await response.json();
        setStatus(data);
        setLoading(false);

        // Stop polling if video processing is complete or errored
        if (data.status === 'completed' || data.status === 'error') {
          clearInterval(interval);
        }
      } catch (error) {
        console.error('Error polling status:', error);
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
    interval = setInterval(pollStatus, 2000);

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

      {/* Success Message */}
      {status.status === 'completed' && (
        <div className="bg-green-50 border border-green-200 rounded-md p-4">
          <h4 className="font-semibold text-green-800 mb-2">Processing Complete!</h4>
          <p className="text-green-700 text-sm">
            Your video has been analyzed and is ready for template selection.
          </p>
          {status.timeline && (
            <div className="mt-3 p-3 bg-white rounded border">
              <h5 className="font-medium text-gray-800 mb-2">Analysis Summary:</h5>
              <pre className="text-xs text-gray-600 overflow-auto">
                {JSON.stringify(status.timeline, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* Processing Steps */}
      {(status.status === 'processing' || status.status === 'indexing') && (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <h4 className="font-semibold text-blue-800 mb-2">Processing Steps:</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li className={status.status === 'uploading' ? 'font-bold' : 'line-through'}>
              ✓ Upload video
            </li>
            <li className={status.status === 'processing' ? 'font-bold' : status.status === 'indexing' || status.status === 'completed' ? 'line-through' : ''}>
              {status.status === 'processing' ? '🔄' : '✓'} Analyze content (scenes, objects, speech)
            </li>
            <li className={status.status === 'indexing' ? 'font-bold' : status.status === 'completed' ? 'line-through' : ''}>
              {status.status === 'indexing' ? '🔄' : status.status === 'completed' ? '✓' : '⏳'} Create searchable index
            </li>
            <li className={status.status === 'completed' ? 'font-bold' : ''}>
              {status.status === 'completed' ? '✓' : '⏳'} Ready for template selection
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}