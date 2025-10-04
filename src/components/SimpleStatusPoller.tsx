'use client';

import { useState, useEffect } from 'react';

interface StatusPollerProps {
  videoId: string;
}

interface VideoStatus {
  id: string;
  status: 'processing' | 'indexing' | 'completed' | 'error';
  progress?: number;
  message?: string;
  error?: string;
  analysis?: Record<string, unknown>;
}

export default function StatusPoller({ videoId }: StatusPollerProps) {
  const [status, setStatus] = useState<VideoStatus | null>(null);

  useEffect(() => {
    const poll = async () => {
      try {
        const res = await fetch(`/api/videos/${videoId}/status`);
        const data = await res.json();
        setStatus(data);

        // Stop polling if complete or error
        if (data.status === 'completed' || data.status === 'error') {
          clearInterval(interval);
        }
      } catch (err) {
        console.error('Polling error:', err);
        setStatus({
          id: videoId,
          status: 'error',
          error: 'Failed to check status'
        });
        clearInterval(interval);
      }
    };

    // Poll immediately, then every 2 seconds
    poll();
    const interval = setInterval(poll, 2000);

    return () => clearInterval(interval);
  }, [videoId]);

  if (!status) {
    return <div>Loading status...</div>;
  }

  return (
    <div style={{ border: '1px solid #ccc', padding: '16px', marginTop: '16px' }}>
      <h3>Video Processing Status</h3>
      <p><strong>ID:</strong> {status.id}</p>
      <p><strong>Status:</strong> {status.status}</p>
      {status.progress && <p><strong>Progress:</strong> {status.progress}%</p>}
      {status.message && <p><strong>Message:</strong> {status.message}</p>}
      {status.error && <p style={{ color: 'red' }}><strong>Error:</strong> {status.error}</p>}

      {status.status === 'completed' && status.analysis && (
        <details>
          <summary>Analysis Results</summary>
          <pre style={{ fontSize: '12px', maxHeight: '200px', overflow: 'auto' }}>
            {JSON.stringify(status.analysis, null, 2)}
          </pre>
        </details>
      )}
    </div>
  );
}