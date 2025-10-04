'use client';

import { useState } from 'react';
import SimpleStatusPoller from './SimpleStatusPoller';

export default function SimpleUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState("");
  const [vid, setVid] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!file && !url) {
      setError("Please provide a file or URL");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const body = new FormData();
      if (file) body.append("file", file);
      if (url) body.append("url", url);

      const res = await fetch("/api/videos", { method: "POST", body });

      if (!res.ok) {
        throw new Error(`Upload failed: ${res.statusText}`);
      }

      const json = await res.json();
      setVid(json.videoId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setLoading(false);
    }
  }

  const reset = () => {
    setFile(null);
    setUrl("");
    setVid(null);
    setError(null);
  };

  if (vid) {
    return (
      <div>
        <h2>Video Analysis</h2>
        <SimpleStatusPoller videoId={vid} />
        <button onClick={reset} style={{ marginTop: '16px' }}>
          Upload Another Video
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '500px', margin: '0 auto', padding: '20px' }}>
      <h1>Upload Video for Analysis</h1>

      <div style={{ marginBottom: '16px' }}>
        <label>Upload file:</label>
        <input
          type="file"
          accept="video/*"
          onChange={e => setFile(e.target.files?.[0] || null)}
          style={{ display: 'block', marginTop: '8px' }}
        />
      </div>

      <div style={{ marginBottom: '16px' }}>
        <label>Or paste video URL:</label>
        <input
          type="url"
          placeholder="https://example.com/video.mp4"
          value={url}
          onChange={e => setUrl(e.target.value)}
          style={{
            display: 'block',
            marginTop: '8px',
            width: '100%',
            padding: '8px',
            border: '1px solid #ccc'
          }}
        />
      </div>

      {error && (
        <div style={{
          color: 'red',
          marginBottom: '16px',
          padding: '8px',
          backgroundColor: '#ffebee',
          border: '1px solid #ffcdd2'
        }}>
          {error}
        </div>
      )}

      <button
        onClick={submit}
        disabled={loading || (!file && !url)}
        style={{
          padding: '12px 24px',
          backgroundColor: loading || (!file && !url) ? '#ccc' : '#007bff',
          color: 'white',
          border: 'none',
          cursor: loading || (!file && !url) ? 'not-allowed' : 'pointer'
        }}
      >
        {loading ? 'Uploading...' : 'Analyze Video'}
      </button>

      {file && (
        <div style={{ marginTop: '16px', padding: '8px', backgroundColor: '#f5f5f5' }}>
          <strong>Selected file:</strong> {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
        </div>
      )}
    </div>
  );
}