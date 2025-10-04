'use client';

import { useState, useRef, DragEvent, useEffect } from 'react';
import StatusPoller from './StatusPoller';
import VideoHistory from './VideoHistory';
import { videoStorage, createStoredVideo } from '@/lib/videoStorage';

export default function Upload() {
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState('');
  const [videoId, setVideoId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [currentView, setCurrentView] = useState<'upload' | 'history' | 'processing'>('upload');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type.startsWith('video/')) {
        setFile(droppedFile);
        setUrl('');
        setError(null);
      } else {
        setError('Please upload a video file');
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];

      // Check file type
      if (!selectedFile.type.startsWith('video/')) {
        setError('Please select a video file');
        return;
      }

      // Check file size (warn if > 50MB)
      const fileSizeMB = selectedFile.size / 1024 / 1024;
      if (fileSizeMB > 100) {
        setError('File too large. Please use a video smaller than 100MB or try a video URL instead.');
        return;
      }

      setFile(selectedFile);
      setUrl('');
      setError(null);

      // Show warning for large files
      if (fileSizeMB > 50) {
        setError(`Large file detected (${fileSizeMB.toFixed(1)}MB). Upload may take longer. Consider using a video URL for faster processing.`);
      }
    }
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUrl(e.target.value);
    if (e.target.value) {
      setFile(null);
      setError(null);
    }
  };

  const validateUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const submit = async () => {
    console.log('🚀 Upload submit started');
    console.log('📁 File:', file?.name || 'none');
    console.log('🔗 URL:', url || 'none');

    if (!file && !url) {
      console.log('❌ No file or URL provided');
      setError('Please select a file or enter a URL');
      return;
    }

    if (url && !validateUrl(url)) {
      console.log('❌ Invalid URL format');
      setError('Please enter a valid URL');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const body = new FormData();
      if (file) {
        console.log('📁 Adding file to FormData:', file.name, file.size, 'bytes');
        body.append('file', file);
      }
      if (url) {
        console.log('🔗 Adding URL to FormData:', url);
        body.append('url', url);
      }

      const apiUrl = 'https://advertising-475w.onrender.com/api/videos';
      console.log('📡 Making request to:', apiUrl);
      console.log('📦 Request method: POST');
      console.log('📋 FormData entries:');
      for (const [key, value] of body.entries()) {
        console.log(`  ${key}:`, value);
      }

      const res = await fetch(apiUrl, {
        method: 'POST',
        body,
      });

      console.log('📊 Response status:', res.status);
      console.log('📝 Response statusText:', res.statusText);
      console.log('🔗 Response URL:', res.url);

      if (!res.ok) {
        const errorText = await res.text();
        console.log('❌ Response error text:', errorText);
        throw new Error(`Upload failed: ${res.statusText} - ${errorText}`);
      }

      const json = await res.json();
      console.log('✅ Upload successful:', json);
      const newVideoId = json.videoId;
      setVideoId(newVideoId);

      // Save to localStorage
      const videoName = file ? file.name : url.split('/').pop() || 'Video from URL';
      const storedVideo = createStoredVideo(
        newVideoId,
        videoName,
        file?.size
      );
      videoStorage.save(storedVideo);

      // Switch to processing view
      setCurrentView('processing');
    } catch (err) {
      console.error('❌ Upload error:', err);
      if (err instanceof TypeError && err.message.includes('fetch')) {
        setError('Network connection failed. Please check your internet connection and try again.');
      } else {
        setError(err instanceof Error ? err.message : 'Upload failed');
      }
    } finally {
      setLoading(false);
      console.log('🏁 Upload process finished');
    }
  };

  const reset = () => {
    setFile(null);
    setUrl('');
    setVideoId(null);
    setError(null);
    setLoading(false);
    setCurrentView('upload');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSelectVideo = (selectedVideoId: string) => {
    setVideoId(selectedVideoId);
    setCurrentView('processing');
  };

  const handleUploadNew = () => {
    reset();
  };

  // Add useEffect to update video status in localStorage
  useEffect(() => {
    if (videoId) {
      const video = videoStorage.get(videoId);
      if (video) {
        videoStorage.save({ ...video, status: 'processing' });
      }
    }
  }, [videoId]);

  // Show VideoHistory view
  if (currentView === 'history') {
    return (
      <VideoHistory
        onSelectVideo={handleSelectVideo}
        onUploadNew={handleUploadNew}
      />
    );
  }

  // Show processing/results view
  if (currentView === 'processing' && videoId) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">Video Processing</h2>
            <p className="text-gray-600">Video ID: {videoId}</p>
          </div>
          <div className="space-x-2">
            <button
              onClick={() => setCurrentView('history')}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
            >
              View History
            </button>
            <button
              onClick={reset}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              Upload New
            </button>
          </div>
        </div>
        <StatusPoller videoId={videoId} />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Upload Video for Analysis</h1>
        <button
          onClick={() => setCurrentView('history')}
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
        >
          📂 View History
        </button>
      </div>

      <div className="space-y-6">
        {/* Drag and Drop Zone */}
        <div
          className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragActive
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*"
            onChange={handleFileChange}
            className="hidden"
          />

          <div className="space-y-4">
            <div className="text-6xl">🎬</div>
            <div>
              <p className="text-lg font-semibold">
                {file ? file.name : 'Drop video file here or click to browse'}
              </p>
              <p className="text-gray-500 text-sm mt-1">
                Supports MP4, MOV, AVI and other video formats
              </p>
            </div>
          </div>
        </div>

        {/* URL Input */}
        <div>
          <label htmlFor="url" className="block text-sm font-medium mb-2">
            Or paste video URL:
          </label>
          <input
            id="url"
            type="url"
            placeholder="https://example.com/video.mp4"
            value={url}
            onChange={handleUrlChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Submit Button */}
        <button
          onClick={submit}
          disabled={loading || (!file && !url)}
          className={`w-full py-3 px-4 rounded-md font-semibold transition-colors ${
            loading || (!file && !url)
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {loading ? 'Uploading...' : 'Analyze Video'}
        </button>

        {/* File Info */}
        {file && (
          <div className="bg-gray-50 rounded-md p-4">
            <h3 className="font-semibold mb-2">Selected File:</h3>
            <p className="text-sm text-gray-600">Name: {file.name}</p>
            <p className="text-sm text-gray-600">Size: {(file.size / 1024 / 1024).toFixed(2)} MB</p>
            <p className="text-sm text-gray-600">Type: {file.type}</p>
          </div>
        )}
      </div>
    </div>
  );
}