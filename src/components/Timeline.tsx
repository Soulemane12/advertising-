'use client';

import { useState, useEffect } from 'react';
import { loadAnalysis } from '@/lib/api';
import TemplateSelector from './TemplateSelector';
import { Template, EditRequest, AspectRatio, CaptionStyle } from '@/types/template';

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
  const [showTemplates, setShowTemplates] = useState(false);
  const [generating, setGenerating] = useState(false);

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
    if (selectedIds.length === 0) {
      alert('Please select at least one scene');
      return;
    }
    setShowTemplates(true);
  };

  const handleTemplateGenerate = async (
    template: Template,
    customizations: {
      aspectRatios: AspectRatio[];
      durationsSec: number[];
      captions: CaptionStyle;
    }
  ) => {
    setGenerating(true);

    try {
      const selectedScenes = scenes.filter(s => selectedIds.includes(s.id));
      const selections = selectedScenes.map(scene => ({
        startMs: scene.start * 1000,
        endMs: scene.end * 1000
      }));

      const editRequest: EditRequest = {
        videoId,
        selections,
        templateId: template.id,
        aspectRatios: customizations.aspectRatios,
        durationsSec: customizations.durationsSec,
        captions: customizations.captions
      };

      console.log('🎬 Sending edit request:', editRequest);

      const response = await fetch('/api/edits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editRequest)
      });

      if (!response.ok) {
        throw new Error(`Edit request failed: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('✅ Edit job created:', result);

      alert(`🎉 Successfully generated ${result.files?.length || 0} video files!\nJob ID: ${result.jobId}`);

    } catch (error) {
      console.error('❌ Edit generation error:', error);
      alert(`Failed to generate videos: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setGenerating(false);
    }
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

  // Show template selector after scene selection
  if (showTemplates) {
    return (
      <div>
        <div className="mb-6">
          <button
            onClick={() => setShowTemplates(false)}
            className="mb-4 text-blue-600 hover:text-blue-800 transition-colors"
          >
            ← Back to Scene Selection
          </button>
        </div>
        <TemplateSelector
          onGenerate={handleTemplateGenerate}
          selectedSceneCount={selectedIds.length}
          totalDuration={getTotalDuration()}
        />
        {generating && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-center">Generating videos...</p>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="animate-fade-in-up">
      {/* Header Section */}
      <div className="card-elevated p-8 mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12,20A8,8 0 0,0 20,12A8,8 0 0,0 12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22C6.47,22 2,17.5 2,12A10,10 0 0,1 12,2M12.5,7V12.25L17,14.92L16.25,16.15L11,13V7H12.5Z"/>
              </svg>
            </div>
            <div>
              <h2 className="text-3xl font-bold text-white mb-1">Select Video Clips</h2>
              <p className="text-gray-400">
                Choose scenes to include in your advertisement • Total: {formatTime(getTotalDuration())}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="badge badge-info">
              {selectedIds.length} of {scenes.length} selected
            </div>
          </div>
        </div>

        {/* Progress Indicator */}
        <div className="mb-6">
          <div className="flex justify-between text-sm text-gray-400 mb-2">
            <span>Selection Progress</span>
            <span>{Math.round((selectedIds.length / scenes.length) * 100)}%</span>
          </div>
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${(selectedIds.length / scenes.length) * 100}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Scene Selection Grid */}
      <div className="space-y-4 mb-8">
        {scenes.map((scene, index) => (
          <div
            key={scene.id}
            className={`card cursor-pointer transition-all duration-300 hover:scale-[1.01] hover:shadow-xl ${
              selectedIds.includes(scene.id)
                ? 'ring-2 ring-emerald-500 bg-emerald-500/10 border-emerald-500/50'
                : 'hover:border-white/30'
            }`}
            onClick={() => toggleScene(scene.id)}
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <div className="p-6">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 mt-1">
                  <div className={`relative w-6 h-6 rounded-lg border-2 transition-all duration-200 ${
                    selectedIds.includes(scene.id)
                      ? 'bg-emerald-500 border-emerald-500'
                      : 'border-white/30 hover:border-emerald-500/50'
                  }`}>
                    {selectedIds.includes(scene.id) && (
                      <svg className="w-4 h-4 text-white absolute top-0.5 left-0.5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                      </svg>
                    )}
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  {/* Scene Header */}
                  <div className="flex items-center space-x-4 mb-3">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                      <span className="font-semibold text-white text-lg">
                        {formatTime(scene.start)} - {formatTime(scene.end)}
                      </span>
                    </div>
                    <div className="badge badge-neutral">
                      {scene.end - scene.start}s
                    </div>
                    {scene.sentiment === 'positive' && (
                      <div className="badge badge-success">
                        <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12,2L13.09,8.26L22,9L17,14L18.18,22L12,19L5.82,22L7,14L2,9L10.91,8.26L12,2Z"/>
                        </svg>
                        High Energy
                      </div>
                    )}
                  </div>

                  {/* Scene Content */}
                  {scene.transcript && (
                    <div className="mb-4">
                      <p className="text-gray-300 leading-relaxed">
                        {scene.transcript.length > 150
                          ? `${scene.transcript.substring(0, 150)}...`
                          : scene.transcript
                        }
                      </p>
                    </div>
                  )}

                  {/* Scene Tags */}
                  {scene.tags && scene.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {scene.tags.slice(0, 5).map((tag, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1 text-xs font-medium bg-white/10 text-gray-300 rounded-full border border-white/20"
                        >
                          {tag}
                        </span>
                      ))}
                      {scene.tags.length > 5 && (
                        <span className="px-3 py-1 text-xs font-medium bg-white/5 text-gray-400 rounded-full border border-white/10">
                          +{scene.tags.length - 5} more
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Selection Indicator */}
                {selectedIds.includes(scene.id) && (
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                      </svg>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Action Bar */}
      <div className="card-elevated p-6 sticky bottom-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="text-white font-medium">
              {selectedIds.length} scene{selectedIds.length !== 1 ? 's' : ''} selected
            </div>
            {selectedIds.length > 0 && (
              <div className="text-gray-400 text-sm">
                Total duration: {formatTime(getTotalDuration())}
              </div>
            )}
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => setSelectedIds([])}
              className="btn-ghost"
              disabled={selectedIds.length === 0}
            >
              Clear All
            </button>
            <button
              onClick={() => setSelectedIds(scenes.map(s => s.id))}
              className="btn-secondary"
            >
              Select All
            </button>
            <button
              onClick={generateClips}
              disabled={selectedIds.length === 0}
              className={`btn-primary ${
                selectedIds.length === 0 ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8,5.14V19.14L19,12.14L8,5.14Z"/>
              </svg>
              Generate Advertisement
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}