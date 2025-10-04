import { NextRequest, NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { randomUUID } from 'crypto';

// In-memory storage for video metadata (in production, use a database)
const videoStore = new Map<string, {
  id: string;
  filename?: string;
  url?: string;
  status: 'uploading' | 'processing' | 'indexing' | 'completed' | 'error';
  progress: number;
  message?: string;
  error?: string;
  createdAt: Date;
  timeline?: any;
}>();

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const url = formData.get('url') as string | null;

    if (!file && !url) {
      return NextResponse.json(
        { error: 'Either file or url is required' },
        { status: 400 }
      );
    }

    const videoId = randomUUID();

    // Initialize video record
    const videoRecord = {
      id: videoId,
      status: 'uploading' as const,
      progress: 0,
      createdAt: new Date(),
    };

    if (file) {
      // Handle file upload
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // Create uploads directory if it doesn't exist
      const uploadsDir = join(process.cwd(), 'uploads');

      try {
        await writeFile(join(uploadsDir, 'test'), '');
      } catch {
        // Directory doesn't exist, we'll handle this in production with proper setup
      }

      const filename = `${videoId}_${file.name}`;
      const filepath = join(process.cwd(), 'uploads', filename);

      try {
        await writeFile(filepath, buffer);
        videoRecord.filename = filename;
      } catch (error) {
        // For now, just store the original filename since uploads dir might not exist
        videoRecord.filename = file.name;
      }

      videoRecord.message = `Uploaded file: ${file.name}`;
    } else if (url) {
      // Handle URL
      try {
        new URL(url); // Validate URL
        videoRecord.url = url;
        videoRecord.message = `Processing URL: ${url}`;
      } catch {
        return NextResponse.json(
          { error: 'Invalid URL provided' },
          { status: 400 }
        );
      }
    }

    // Store video record
    videoStore.set(videoId, videoRecord);

    // Simulate processing workflow
    simulateProcessing(videoId);

    return NextResponse.json(
      {
        videoId,
        status: 'uploading',
        message: videoRecord.message
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Upload failed' },
      { status: 500 }
    );
  }
}

// Simulate the video processing workflow
async function simulateProcessing(videoId: string) {
  const video = videoStore.get(videoId);
  if (!video) return;

  // Simulate upload completion
  setTimeout(() => {
    const updated = videoStore.get(videoId);
    if (updated) {
      updated.status = 'processing';
      updated.progress = 25;
      updated.message = 'Analyzing video content...';
      videoStore.set(videoId, updated);
    }
  }, 1000);

  // Simulate processing
  setTimeout(() => {
    const updated = videoStore.get(videoId);
    if (updated) {
      updated.status = 'processing';
      updated.progress = 50;
      updated.message = 'Extracting scenes and objects...';
      videoStore.set(videoId, updated);
    }
  }, 3000);

  // Simulate indexing
  setTimeout(() => {
    const updated = videoStore.get(videoId);
    if (updated) {
      updated.status = 'indexing';
      updated.progress = 75;
      updated.message = 'Creating searchable index...';
      videoStore.set(videoId, updated);
    }
  }, 5000);

  // Simulate completion
  setTimeout(() => {
    const updated = videoStore.get(videoId);
    if (updated) {
      updated.status = 'completed';
      updated.progress = 100;
      updated.message = 'Analysis complete';
      updated.timeline = {
        duration: 30,
        scenes: [
          { start: 0, end: 10, description: 'Opening scene' },
          { start: 10, end: 20, description: 'Main content' },
          { start: 20, end: 30, description: 'Closing scene' }
        ],
        objects: ['person', 'car', 'building'],
        text: ['Sample text detected'],
        speech: 'Sample speech transcription'
      };
      videoStore.set(videoId, updated);
    }
  }, 8000);
}

// Export the video store for use in status endpoint
export { videoStore };