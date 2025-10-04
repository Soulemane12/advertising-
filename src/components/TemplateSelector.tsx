'use client';

import { useState } from 'react';
import { Template, defaultTemplates, aspectRatioLabels, captionLabels, AspectRatio, CaptionStyle } from '@/types/template';

interface TemplateSelectorProps {
  onGenerate: (template: Template, customizations: {
    aspectRatios: AspectRatio[];
    durationsSec: number[];
    captions: CaptionStyle;
  }) => void;
  selectedSceneCount: number;
  totalDuration: number;
}

export default function TemplateSelector({ onGenerate, selectedSceneCount, totalDuration }: TemplateSelectorProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<Template>(defaultTemplates[0]);
  const [customAspectRatios, setCustomAspectRatios] = useState<AspectRatio[]>(defaultTemplates[0].aspectRatios);
  const [customDurations, setCustomDurations] = useState<number[]>(defaultTemplates[0].durationsSec);
  const [customCaptions, setCustomCaptions] = useState<CaptionStyle>(defaultTemplates[0].captions);

  const handleTemplateSelect = (template: Template) => {
    setSelectedTemplate(template);
    setCustomAspectRatios(template.aspectRatios);
    setCustomDurations(template.durationsSec);
    setCustomCaptions(template.captions);
  };

  const handleAspectRatioToggle = (ratio: AspectRatio) => {
    setCustomAspectRatios(prev =>
      prev.includes(ratio)
        ? prev.filter(r => r !== ratio)
        : [...prev, ratio]
    );
  };

  const handleDurationToggle = (duration: number) => {
    setCustomDurations(prev =>
      prev.includes(duration)
        ? prev.filter(d => d !== duration)
        : [...prev, duration]
    );
  };

  const handleGenerate = () => {
    if (customAspectRatios.length === 0) {
      alert('Please select at least one aspect ratio');
      return;
    }
    if (customDurations.length === 0) {
      alert('Please select at least one duration');
      return;
    }

    onGenerate(selectedTemplate, {
      aspectRatios: customAspectRatios,
      durationsSec: customDurations,
      captions: customCaptions
    });
  };

  const estimatedOutputs = customAspectRatios.length * customDurations.length;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-2">Choose Template & Settings</h2>
        <p className="text-gray-600">
          Selected {selectedSceneCount} scenes ({Math.round(totalDuration)}s total) •
          Will generate {estimatedOutputs} video{estimatedOutputs !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Template Selection */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-4">Template Presets</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {defaultTemplates.map((template) => (
            <div
              key={template.id}
              onClick={() => handleTemplateSelect(template)}
              className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                selectedTemplate.id === template.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <h4 className="font-semibold mb-2">{template.name}</h4>
              <p className="text-sm text-gray-600 mb-3">{template.description}</p>
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="bg-gray-100 px-2 py-1 rounded">
                  {template.durationsSec.join('s, ')}s
                </span>
                <span className="bg-gray-100 px-2 py-1 rounded">
                  {template.aspectRatios.join(', ')}
                </span>
                <span className="bg-gray-100 px-2 py-1 rounded">
                  {captionLabels[template.captions]}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Customization Options */}
      <div className="space-y-6">
        {/* Aspect Ratios */}
        <div>
          <h3 className="text-lg font-semibold mb-3">Aspect Ratios</h3>
          <div className="flex flex-wrap gap-3">
            {(["9:16", "1:1", "16:9"] as AspectRatio[]).map((ratio) => (
              <label key={ratio} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={customAspectRatios.includes(ratio)}
                  onChange={() => handleAspectRatioToggle(ratio)}
                  className="rounded"
                />
                <span className="text-sm font-medium">{aspectRatioLabels[ratio]}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Durations */}
        <div>
          <h3 className="text-lg font-semibold mb-3">Video Lengths</h3>
          <div className="flex flex-wrap gap-3">
            {[6, 15, 30].map((duration) => (
              <label key={duration} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={customDurations.includes(duration)}
                  onChange={() => handleDurationToggle(duration)}
                  className="rounded"
                />
                <span className="text-sm font-medium">{duration} seconds</span>
              </label>
            ))}
          </div>
        </div>

        {/* Captions */}
        <div>
          <h3 className="text-lg font-semibold mb-3">Captions</h3>
          <div className="flex flex-wrap gap-3">
            {(["burned", "sidecar", "off"] as CaptionStyle[]).map((style) => (
              <label key={style} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="captions"
                  value={style}
                  checked={customCaptions === style}
                  onChange={() => setCustomCaptions(style)}
                  className="rounded"
                />
                <span className="text-sm font-medium">{captionLabels[style]}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Output Preview */}
      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-semibold mb-2">Output Preview</h4>
        <p className="text-sm text-gray-600 mb-2">
          Will generate {estimatedOutputs} video file{estimatedOutputs !== 1 ? 's' : ''}:
        </p>
        <div className="space-y-1 text-sm">
          {customDurations.map(duration =>
            customAspectRatios.map(ratio => (
              <div key={`${duration}-${ratio}`} className="text-gray-700">
                • {duration}s video in {aspectRatioLabels[ratio]} format
                {customCaptions === 'burned' && ' (with burned captions)'}
                {customCaptions === 'sidecar' && ' (+ separate caption file)'}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Generate Button */}
      <div className="mt-8 flex items-center justify-between">
        <div className="text-sm text-gray-600">
          Estimated processing time: {Math.ceil(estimatedOutputs * 0.5)} minute{Math.ceil(estimatedOutputs * 0.5) !== 1 ? 's' : ''}
        </div>
        <button
          onClick={handleGenerate}
          disabled={customAspectRatios.length === 0 || customDurations.length === 0}
          className={`px-8 py-3 rounded-lg font-semibold transition-colors ${
            customAspectRatios.length === 0 || customDurations.length === 0
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-green-600 text-white hover:bg-green-700'
          }`}
        >
          🎬 Generate {estimatedOutputs} Video{estimatedOutputs !== 1 ? 's' : ''}
        </button>
      </div>
    </div>
  );
}