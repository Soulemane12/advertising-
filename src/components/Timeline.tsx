'use client';

import { useState, useEffect } from 'react';
import { loadAnalysis } from '@/lib/api';

interface Scene {
  id: string;
  start: number;
  end: number;
  thumbnailUrl?: string;
  transcript?: string;
  tags?: string[];
  sentiment?: 'positive' | 'negative' | 'neutral';
  confidence?: number;
}

interface TimelineProps {
  videoId: string;
}

export default function Timeline({ videoId }: TimelineProps) {
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadVideoAnalysis();
  }, [videoId]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadVideoAnalysis = async () => {
    try {
      setLoading(true);
      const analysis = await loadAnalysis(videoId);

      // Parse TwelveLabs analysis data to extract scenes
      const extractedScenes = extractScenesFromAnalysis(analysis);
      setScenes(extractedScenes);

      // Auto-select good scenes
      const autoSelected = autoSelectScenes(extractedScenes);
      setSelectedIds(autoSelected);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analysis');
    } finally {
      setLoading(false);
    }
  };

  const extractScenesFromAnalysis = (analysis: Record<string, unknown>): Scene[] => {
    // Extract scenes from TwelveLabs analysis
    // This will vary based on actual TwelveLabs response structure
    const scenes: Scene[] = [];

    if (analysis.chapters && Array.isArray(analysis.chapters)) {
      analysis.chapters.forEach((chapter: Record<string, unknown>, index: number) => {
        scenes.push({
          id: `scene_${index}`,
          start: (chapter.start as number) || 0,
          end: (chapter.end as number) || 30,
          transcript: (chapter.summary as string) || (chapter.text as string) || '',
          tags: (chapter.tags as string[]) || [],
          sentiment: (chapter.sentiment as 'positive' | 'negative' | 'neutral') || 'neutral'
        });
      });
    }

    // If no chapters, create scenes from timestamps
    if (scenes.length === 0 && analysis.video_id) {
      // Create default scenes every 15 seconds for first 2 minutes
      for (let i = 0; i < 8; i++) {
        scenes.push({
          id: `scene_${i}`,
          start: i * 15,
          end: (i + 1) * 15,
          transcript: `Scene ${i + 1}`,
          tags: [],
          sentiment: 'neutral'
        });
      }
    }

    return scenes;
  };

  const autoSelectScenes = (sceneList: Scene[]): string[] => {
    const selected: string[] = [];

    // Strategy: Select first scene + high-sentiment scenes + middle scenes
    if (sceneList.length > 0) {
      // Always select first scene (often contains logo/intro)
      selected.push(sceneList[0].id);

      // Find high-sentiment scenes
      const positiveScenes = sceneList.filter(s => s.sentiment === 'positive');
      if (positiveScenes.length > 0) {
        selected.push(positiveScenes[0].id);
      }

      // Add a middle scene if we have enough scenes
      if (sceneList.length > 3) {
        const middleIndex = Math.floor(sceneList.length / 2);
        if (!selected.includes(sceneList[middleIndex].id)) {
          selected.push(sceneList[middleIndex].id);
        }
      }
    }

    return selected;
  };

  const toggleScene = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id)
        ? prev.filter(x => x !== id)
        : [...prev, id]
    );
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getTotalDuration = () => {
    return selectedIds.reduce((total, id) => {
      const scene = scenes.find(s => s.id === id);
      return total + (scene ? scene.end - scene.start : 0);
    }, 0);
  };

  const generateClips = () => {
    const selectedScenes = scenes.filter(s => selectedIds.includes(s.id));
    console.log('Generating clips from selected scenes:', selectedScenes);

    // Here you would typically send this to your video generation service
    alert(`Generating ${selectedScenes.length} clips with total duration: ${formatTime(getTotalDuration())}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3">Loading video analysis...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <p className="text-red-700">Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Select Video Clips</h2>
        <p className="text-gray-600">
          Choose scenes to include in your advertisement. Total duration: {formatTime(getTotalDuration())}
        </p>
      </div>

      {/* Scene Selection */}
      <div className="space-y-4 mb-6">
        {scenes.map((scene) => (
          <div
            key={scene.id}
            className={`border rounded-lg p-4 cursor-pointer transition-colors ${
              selectedIds.includes(scene.id)
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => toggleScene(scene.id)}
          >
            <div className="flex items-start space-x-4">
              <input
                type="checkbox"
                checked={selectedIds.includes(scene.id)}
                onChange={() => toggleScene(scene.id)}
                className="mt-1"
              />

              <div className="flex-1">
                <div className="flex items-center space-x-4 mb-2">
                  <span className="font-medium">
                    {formatTime(scene.start)} - {formatTime(scene.end)}
                  </span>
                  <span className="text-sm text-gray-500">
                    ({scene.end - scene.start}s)
                  </span>
                  {scene.sentiment === 'positive' && (
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                      High Energy
                    </span>
                  )}
                </div>

                {scene.transcript && (
                  <p className="text-gray-700 text-sm mb-2">
                    {scene.transcript.length > 100
                      ? `${scene.transcript.substring(0, 100)}...`
                      : scene.transcript
                    }
                  </p>
                )}

                {scene.tags && scene.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {scene.tags.slice(0, 5).map((tag, idx) => (
                      <span
                        key={idx}
                        className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">
          {selectedIds.length} scene{selectedIds.length !== 1 ? 's' : ''} selected
        </div>

        <div className="space-x-3">
          <button
            onClick={() => setSelectedIds([])}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
          >
            Clear All
          </button>
          <button
            onClick={() => setSelectedIds(scenes.map(s => s.id))}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
          >
            Select All
          </button>
          <button
            onClick={generateClips}
            disabled={selectedIds.length === 0}
            className={`px-6 py-2 rounded font-medium ${
              selectedIds.length === 0
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            Generate Advertisement
          </button>
        </div>
      </div>
    </div>
  );
}