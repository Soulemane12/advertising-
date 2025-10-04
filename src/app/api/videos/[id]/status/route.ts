import { NextRequest, NextResponse } from 'next/server';
import { videoStore } from '../../route';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: 'Video ID is required' },
        { status: 400 }
      );
    }

    const video = videoStore.get(id);

    if (!video) {
      return NextResponse.json(
        { error: 'Video not found' },
        { status: 404 }
      );
    }

    // Return video status
    return NextResponse.json({
      id: video.id,
      status: video.status,
      progress: video.progress,
      message: video.message,
      error: video.error,
      timeline: video.timeline,
      createdAt: video.createdAt
    });

  } catch (error) {
    console.error('Status check error:', error);
    return NextResponse.json(
      { error: 'Failed to check status' },
      { status: 500 }
    );
  }
}