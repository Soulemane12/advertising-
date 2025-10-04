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
    <div className="animate-fade-in-up">
      {/* Header Section */}
      <div className="card-elevated p-8 mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12,15.5A3.5,3.5 0 0,1 8.5,12A3.5,3.5 0 0,1 12,8.5A3.5,3.5 0 0,1 15.5,12A3.5,3.5 0 0,1 12,15.5M19.43,12.97C19.47,12.65 19.5,12.33 19.5,12C19.5,11.67 19.47,11.34 19.43,11L21.54,9.37C21.73,9.22 21.78,8.95 21.66,8.73L19.66,5.27C19.54,5.05 19.27,4.96 19.05,5.05L16.56,6.05C16.04,5.66 15.5,5.32 14.87,5.07L14.5,2.42C14.46,2.18 14.25,2 14,2H10C9.75,2 9.54,2.18 9.5,2.42L9.13,5.07C8.5,5.32 7.96,5.66 7.44,6.05L4.95,5.05C4.73,4.96 4.46,5.05 4.34,5.27L2.34,8.73C2.22,8.95 2.27,9.22 2.46,9.37L4.57,11C4.53,11.34 4.5,11.67 4.5,12C4.5,12.33 4.53,12.65 4.57,12.97L2.46,14.63C2.27,14.78 2.22,15.05 2.34,15.27L4.34,18.73C4.46,18.95 4.73,19.03 4.95,18.95L7.44,17.94C7.96,18.34 8.5,18.68 9.13,18.93L9.5,21.58C9.54,21.82 9.75,22 10,22H14C14.25,22 14.46,21.82 14.5,21.58L14.87,18.93C15.5,18.68 16.04,18.34 16.56,17.94L19.05,18.95C19.27,19.03 19.54,18.95 19.66,18.73L21.66,15.27C21.78,15.05 21.73,14.78 21.54,14.63L19.43,12.97Z"/>
              </svg>
            </div>
            <div>
              <h2 className="text-3xl font-bold text-white mb-1">Choose Template & Settings</h2>
              <p className="text-gray-400">
                {selectedSceneCount} scenes selected ({Math.round(totalDuration)}s total) •
                Will generate {estimatedOutputs} video{estimatedOutputs !== 1 ? 's' : ''}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="badge badge-success">
              {estimatedOutputs} outputs
            </div>
          </div>
        </div>
      </div>

      {/* Template Selection */}
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19,3H5C3.89,3 3,3.89 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5C21,3.89 20.1,3 19,3M19,19H5V8H19V19Z"/>
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-white">Template Presets</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {defaultTemplates.map((template, index) => (
            <div
              key={template.id}
              onClick={() => handleTemplateSelect(template)}
              className={`card cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-xl ${
                selectedTemplate.id === template.id
                  ? 'ring-2 ring-emerald-500 bg-emerald-500/10 border-emerald-500/50'
                  : 'hover:border-white/30'
              }`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <h4 className="text-xl font-bold text-white">{template.name}</h4>
                  {selectedTemplate.id === template.id && (
                    <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                      </svg>
                    </div>
                  )}
                </div>
                <p className="text-gray-400 mb-6 leading-relaxed">{template.description}</p>
                <div className="flex flex-wrap gap-2">
                  <div className="badge badge-neutral">
                    {template.durationsSec.join('s, ')}s
                  </div>
                  <div className="badge badge-info">
                    {template.aspectRatios.join(', ')}
                  </div>
                  <div className="badge badge-warning">
                    {captionLabels[template.captions]}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Customization Options */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Aspect Ratios */}
        <div className="card p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19,12H22L18,8V11H6V8L2,12L6,16V13H18V16L22,12M19,5V7H5V5H19M19,17V19H5V17H19Z"/>
              </svg>
            </div>
            <h3 className="text-xl font-bold text-white">Aspect Ratios</h3>
          </div>

          <div className="space-y-3">
            {(['9:16', '1:1', '16:9'] as AspectRatio[]).map((ratio) => (
              <label key={ratio} className="flex items-center space-x-3 cursor-pointer group">
                <div className={`relative w-6 h-6 rounded-lg border-2 transition-all duration-200 ${
                  customAspectRatios.includes(ratio)
                    ? 'bg-emerald-500 border-emerald-500'
                    : 'border-white/30 group-hover:border-emerald-500/50'
                }`}>
                  {customAspectRatios.includes(ratio) && (
                    <svg className="w-4 h-4 text-white absolute top-0.5 left-0.5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                    </svg>
                  )}
                  <input
                    type="checkbox"
                    checked={customAspectRatios.includes(ratio)}
                    onChange={() => handleAspectRatioToggle(ratio)}
                    className="sr-only"
                  />
                </div>
                <span className="text-white font-medium group-hover:text-emerald-400 transition-colors">
                  {aspectRatioLabels[ratio]}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Durations */}
        <div className="card p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12,20A8,8 0 0,0 20,12A8,8 0 0,0 12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22C6.47,22 2,17.5 2,12A10,10 0 0,1 12,2M12.5,7V12.25L17,14.92L16.25,16.15L11,13V7H12.5Z"/>
              </svg>
            </div>
            <h3 className="text-xl font-bold text-white">Video Lengths</h3>
          </div>

          <div className="space-y-3">
            {[6, 15, 30].map((duration) => (
              <label key={duration} className="flex items-center space-x-3 cursor-pointer group">
                <div className={`relative w-6 h-6 rounded-lg border-2 transition-all duration-200 ${
                  customDurations.includes(duration)
                    ? 'bg-emerald-500 border-emerald-500'
                    : 'border-white/30 group-hover:border-emerald-500/50'
                }`}>
                  {customDurations.includes(duration) && (
                    <svg className="w-4 h-4 text-white absolute top-0.5 left-0.5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                    </svg>
                  )}
                  <input
                    type="checkbox"
                    checked={customDurations.includes(duration)}
                    onChange={() => handleDurationToggle(duration)}
                    className="sr-only"
                  />
                </div>
                <span className="text-white font-medium group-hover:text-emerald-400 transition-colors">
                  {duration} seconds
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Captions */}
        <div className="card p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19,3H5C3.89,3 3,3.89 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5C21,3.89 20.1,3 19,3M19,19H5V8H19V19Z"/>
              </svg>
            </div>
            <h3 className="text-xl font-bold text-white">Captions</h3>
          </div>

          <div className="space-y-3">
            {(['burned', 'sidecar', 'off'] as CaptionStyle[]).map((style) => (
              <label key={style} className="flex items-center space-x-3 cursor-pointer group">
                <div className={`relative w-6 h-6 rounded-full border-2 transition-all duration-200 ${
                  customCaptions === style
                    ? 'bg-emerald-500 border-emerald-500'
                    : 'border-white/30 group-hover:border-emerald-500/50'
                }`}>
                  {customCaptions === style && (
                    <div className="w-2 h-2 bg-white rounded-full absolute top-1.5 left-1.5"></div>
                  )}
                  <input
                    type="radio"
                    name="captions"
                    value={style}
                    checked={customCaptions === style}
                    onChange={() => setCustomCaptions(style)}
                    className="sr-only"
                  />
                </div>
                <span className="text-white font-medium group-hover:text-emerald-400 transition-colors">
                  {captionLabels[style]}
                </span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Output Preview */}
      <div className="card p-8 mb-8">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12,9A3,3 0 0,0 9,12A3,3 0 0,0 12,15A3,3 0 0,0 15,12A3,3 0 0,0 12,9M12,17A5,5 0 0,1 7,12A5,5 0 0,1 12,7A5,5 0 0,1 17,12A5,5 0 0,1 12,17M12,4.5C7,4.5 2.73,7.61 1,12C2.73,16.39 7,19.5 12,19.5C17,19.5 21.27,16.39 23,12C21.27,7.61 17,4.5 12,4.5Z"/>
            </svg>
          </div>
          <h4 className="text-2xl font-bold text-white">Output Preview</h4>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-gray-400 mb-4">
              Will generate {estimatedOutputs} video file{estimatedOutputs !== 1 ? 's' : ''}:
            </p>
            <div className="space-y-2">
              {customDurations.map(duration =>
                customAspectRatios.map(ratio => (
                  <div key={`${duration}-${ratio}`} className="flex items-center space-x-3 text-gray-300">
                    <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                    <span>{duration}s video in {aspectRatioLabels[ratio]} format</span>
                    {customCaptions === 'burned' && (
                      <div className="badge badge-success text-xs">burned captions</div>
                    )}
                    {customCaptions === 'sidecar' && (
                      <div className="badge badge-info text-xs">+ caption file</div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="flex items-center justify-center">
            <div className="text-center">
              <div className="text-4xl font-bold text-emerald-400 mb-2">{estimatedOutputs}</div>
              <div className="text-gray-400">Total Videos</div>
              <div className="text-gray-500 text-sm mt-2">
                Est. processing: {Math.ceil(estimatedOutputs * 0.5)} min{Math.ceil(estimatedOutputs * 0.5) !== 1 ? 's' : ''}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Generate Button */}
      <div className="card-elevated p-6 sticky bottom-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="text-white font-medium">
              Ready to generate {estimatedOutputs} video{estimatedOutputs !== 1 ? 's' : ''}
            </div>
            <div className="text-gray-400 text-sm">
              Processing time: ~{Math.ceil(estimatedOutputs * 0.5)} minute{Math.ceil(estimatedOutputs * 0.5) !== 1 ? 's' : ''}
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={customAspectRatios.length === 0 || customDurations.length === 0}
            className={`btn-primary text-lg px-8 py-4 ${
              customAspectRatios.length === 0 || customDurations.length === 0
                ? 'opacity-50 cursor-not-allowed'
                : ''
            }`}
          >
            <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8,5.14V19.14L19,12.14L8,5.14Z"/>
            </svg>
            Generate {estimatedOutputs} Video{estimatedOutputs !== 1 ? 's' : ''}
          </button>
        </div>
      </div>
    </div>
  );
}