'use client';

import { useState, useRef, DragEvent, useEffect } from 'react';
import StatusPoller from './StatusPoller';
import VideoHistory from './VideoHistory';
import Layout from './Layout';
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
      <Layout>
        <VideoHistory
          onSelectVideo={handleSelectVideo}
          onUploadNew={handleUploadNew}
        />
      </Layout>
    );
  }

  // Show processing/results view
  if (currentView === 'processing' && videoId) {
    return (
      <Layout>
        <div className="min-h-screen p-6">
          <div className="max-w-4xl mx-auto">
            <div className="card-elevated p-8 mb-8 animate-fade-in-up">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                    <div className="spinner border-white"></div>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-1">Video Processing</h2>
                    <p className="text-gray-400 text-sm">Video ID: {videoId}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setCurrentView('history')}
                    className="btn-secondary"
                  >
                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                    </svg>
                    View History
                  </button>
                  <button
                    onClick={reset}
                    className="btn-primary"
                  >
                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4v2z"/>
                    </svg>
                    Upload New
                  </button>
                </div>
              </div>
              <StatusPoller videoId={videoId} />
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen p-6">
        <div className="max-w-4xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-12 animate-fade-in-up">
            <h1 className="text-5xl font-bold mb-4">
              <span className="gradient-text">AI Video Analysis</span>
            </h1>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Upload your video and let our AI analyze scenes, extract insights, and generate compelling advertisements automatically.
            </p>
          </div>

          {/* Main Upload Card */}
          <div className="card-elevated p-8 mb-8 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">Upload Video</h2>
                  <p className="text-gray-400">Start your AI-powered video analysis</p>
                </div>
              </div>
              <button
                onClick={() => setCurrentView('history')}
                className="btn-ghost"
              >
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
                View History
              </button>
            </div>

            <div className="space-y-8">
              {/* Drag and Drop Zone */}
              <div
                className={`relative border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300 cursor-pointer group ${
                  dragActive
                    ? 'border-emerald-500 bg-emerald-500/10 scale-[1.02]'
                    : 'border-white/20 hover:border-emerald-500/50 hover:bg-emerald-500/5'
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

                <div className="space-y-6">
                  <div className="relative">
                    <div className={`text-8xl transition-transform duration-300 ${dragActive ? 'scale-110' : 'group-hover:scale-105'}`}>
                      🎬
                    </div>
                    {dragActive && (
                      <div className="absolute inset-0 bg-emerald-500/20 rounded-full animate-pulse"></div>
                    )}
                  </div>
                  <div>
                    <p className="text-2xl font-semibold text-white mb-2">
                      {file ? file.name : 'Drop your video here'}
                    </p>
                    <p className="text-gray-400 text-lg">
                      {file ? 'Click to choose a different file' : 'or click to browse files'}
                    </p>
                    <p className="text-gray-500 text-sm mt-3">
                      Supports MP4, MOV, AVI, MKV and other video formats
                    </p>
                  </div>
                </div>

                {/* Upload Progress Indicator */}
                {file && (
                  <div className="absolute top-4 right-4">
                    <div className="badge badge-success">
                      <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                      </svg>
                      File Ready
                    </div>
                  </div>
                )}
              </div>

              {/* URL Input */}
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="h-px bg-white/20 flex-1"></div>
                  <span className="text-gray-400 text-sm font-medium">OR</span>
                  <div className="h-px bg-white/20 flex-1"></div>
                </div>

                <div>
                  <label htmlFor="url" className="block text-sm font-medium text-gray-300 mb-3">
                    Paste video URL
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H6.9C4.71 7 2.9 8.81 2.9 11c0 2.19 1.81 4 4 4h4v-1.9H6.9c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9.1-6H13v1.9h4.1c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1H13V17h4.1c2.19 0 4-1.81 4-4s-1.81-4-4-4z"/>
                      </svg>
                    </div>
                    <input
                      id="url"
                      type="url"
                      placeholder="https://example.com/video.mp4"
                      value={url}
                      onChange={handleUrlChange}
                      className="input-field pl-12 w-full"
                    />
                  </div>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="glass-effect border-red-500/50 rounded-xl p-4 animate-fade-in">
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                      </svg>
                    </div>
                    <div>
                      <p className="text-red-400 font-medium">Upload Error</p>
                      <p className="text-red-300 text-sm mt-1">{error}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <div className="flex items-center justify-center">
                <button
                  onClick={submit}
                  disabled={loading || (!file && !url)}
                  className={`btn-primary text-lg px-12 py-4 ${
                    loading || (!file && !url) ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {loading ? (
                    <>
                      <div className="spinner mr-3"></div>
                      Analyzing Video...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                      </svg>
                      Start AI Analysis
                    </>
                  )}
                </button>
              </div>

              {/* File Info */}
              {file && (
                <div className="glass-effect rounded-xl p-6 animate-fade-in">
                  <h3 className="font-semibold text-white mb-4 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-emerald-400" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
                    </svg>
                    File Details
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-gray-400 text-sm">Name</p>
                      <p className="text-white font-medium truncate">{file.name}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">Size</p>
                      <p className="text-white font-medium">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">Type</p>
                      <p className="text-white font-medium">{file.type}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
            <div className="card p-6 text-center">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12,2A3,3 0 0,1 15,5V11A3,3 0 0,1 12,14A3,3 0 0,1 9,11V5A3,3 0 0,1 12,2M19,11C19,14.53 16.39,17.44 13,17.93V21H11V17.93C7.61,17.44 5,14.53 5,11H7A5,5 0 0,0 12,16A5,5 0 0,0 17,11H19Z"/>
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Scene Analysis</h3>
              <p className="text-gray-400 text-sm">AI-powered scene detection and content understanding</p>
            </div>

            <div className="card p-6 text-center">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12,15.5A3.5,3.5 0 0,1 8.5,12A3.5,3.5 0 0,1 12,8.5A3.5,3.5 0 0,1 15.5,12A3.5,3.5 0 0,1 12,15.5M19.43,12.97C19.47,12.65 19.5,12.33 19.5,12C19.5,11.67 19.47,11.34 19.43,11L21.54,9.37C21.73,9.22 21.78,8.95 21.66,8.73L19.66,5.27C19.54,5.05 19.27,4.96 19.05,5.05L16.56,6.05C16.04,5.66 15.5,5.32 14.87,5.07L14.5,2.42C14.46,2.18 14.25,2 14,2H10C9.75,2 9.54,2.18 9.5,2.42L9.13,5.07C8.5,5.32 7.96,5.66 7.44,6.05L4.95,5.05C4.73,4.96 4.46,5.05 4.34,5.27L2.34,8.73C2.22,8.95 2.27,9.22 2.46,9.37L4.57,11C4.53,11.34 4.5,11.67 4.5,12C4.5,12.33 4.53,12.65 4.57,12.97L2.46,14.63C2.27,14.78 2.22,15.05 2.34,15.27L4.34,18.73C4.46,18.95 4.73,19.03 4.95,18.95L7.44,17.94C7.96,18.34 8.5,18.68 9.13,18.93L9.5,21.58C9.54,21.82 9.75,22 10,22H14C14.25,22 14.46,21.82 14.5,21.58L14.87,18.93C15.5,18.68 16.04,18.34 16.56,17.94L19.05,18.95C19.27,19.03 19.54,18.95 19.66,18.73L21.66,15.27C21.78,15.05 21.73,14.78 21.54,14.63L19.43,12.97Z"/>
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Smart Templates</h3>
              <p className="text-gray-400 text-sm">Pre-built templates optimized for different platforms</p>
            </div>

            <div className="card p-6 text-center">
              <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-green-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M9,11H7V9H9V11M13,11H11V9H13V11M17,11H15V9H17V11M19,3H5C3.89,3 3,3.89 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5C21,3.89 20.1,3 19,3M19,19H5V8H19V19Z"/>
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Auto Generation</h3>
              <p className="text-gray-400 text-sm">Generate multiple ad variations automatically</p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}