// Video storage utilities for localStorage

export interface StoredVideo {
  videoId: string;
  name: string;
  uploadDate: string;
  status: 'uploading' | 'processing' | 'indexing' | 'completed' | 'error';
  fileSize?: number;
  duration?: number;
  thumbnailUrl?: string;
  error?: string;
}

const STORAGE_KEY = 'video_analysis_history';

export const videoStorage = {
  // Get all stored videos
  getAll(): StoredVideo[] {
    if (typeof window === 'undefined') return [];

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to load video history:', error);
      return [];
    }
  },

  // Get a specific video by ID
  get(videoId: string): StoredVideo | null {
    const videos = this.getAll();
    return videos.find(v => v.videoId === videoId) || null;
  },

  // Add or update a video
  save(video: StoredVideo): void {
    if (typeof window === 'undefined') return;

    try {
      const videos = this.getAll();
      const existingIndex = videos.findIndex(v => v.videoId === video.videoId);

      if (existingIndex >= 0) {
        // Update existing video
        videos[existingIndex] = { ...videos[existingIndex], ...video };
      } else {
        // Add new video (newest first)
        videos.unshift(video);
      }

      // Keep only last 50 videos
      const trimmedVideos = videos.slice(0, 50);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmedVideos));
    } catch (error) {
      console.error('Failed to save video:', error);
    }
  },

  // Delete a video by ID
  delete(videoId: string): void {
    if (typeof window === 'undefined') return;

    try {
      const videos = this.getAll();
      const filtered = videos.filter(v => v.videoId !== videoId);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    } catch (error) {
      console.error('Failed to delete video:', error);
    }
  },

  // Clear all videos
  clear(): void {
    if (typeof window === 'undefined') return;

    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear video history:', error);
    }
  },

  // Get videos by status
  getByStatus(status: StoredVideo['status']): StoredVideo[] {
    return this.getAll().filter(v => v.status === status);
  },

  // Get completed videos only
  getCompleted(): StoredVideo[] {
    return this.getByStatus('completed');
  }
};

// Helper function to create a stored video object
export function createStoredVideo(
  videoId: string,
  name: string,
  fileSize?: number
): StoredVideo {
  return {
    videoId,
    name,
    uploadDate: new Date().toISOString(),
    status: 'uploading',
    fileSize
  };
}

// Helper to format file size
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Helper to format upload date
export function formatUploadDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;

  return date.toLocaleDateString();
}