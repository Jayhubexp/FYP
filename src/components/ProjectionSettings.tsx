import React from 'react';
import { ProjectionSettings as ProjectionSettingsType } from '../types/app';

interface ProjectionSettingsProps {
  settings: ProjectionSettingsType;
  onChange: (settings: Partial<ProjectionSettingsType>) => void;
}

const ProjectionSettings: React.FC<ProjectionSettingsProps> = ({ settings, onChange }) => {
  const fontFamilies = [
    'Arial',
    'Times New Roman',
    'Georgia',
    'Helvetica',
    'Verdana',
    'Trebuchet MS'
  ];

  const presetColors = [
    { name: 'Black', bg: '#000000', text: '#FFFFFF' },
    { name: 'Navy Blue', bg: '#1e293b', text: '#FFFFFF' },
    { name: 'Deep Green', bg: '#064e3b', text: '#FFFFFF' },
    { name: 'Dark Purple', bg: '#581c87', text: '#FFFFFF' },
    { name: 'White', bg: '#FFFFFF', text: '#000000' },
    { name: 'Light Blue', bg: '#dbeafe', text: '#1e40af' }
  ];

  return (
    <div className="max-w-2xl space-y-8">
      <h2 className="text-2xl font-bold text-gray-200 mb-6">Projection Settings</h2>
      
      {/* Font Size */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-3">
          Font Size: {settings.fontSize}px
        </label>
        <input
          type="range"
          min="24"
          max="120"
          value={settings.fontSize}
          onChange={(e) => onChange({ fontSize: parseInt(e.target.value) })}
          className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
        />
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>24px</span>
          <span>120px</span>
        </div>
      </div>

      {/* Font Family */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-3">Font Family</label>
        <select
          value={settings.fontFamily}
          onChange={(e) => onChange({ fontFamily: e.target.value })}
          className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
        >
          {fontFamilies.map((font) => (
            <option key={font} value={font}>{font}</option>
          ))}
        </select>
      </div>

      {/* Color Presets */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-3">Color Presets</label>
        <div className="grid grid-cols-3 gap-3">
          {presetColors.map((preset) => (
            <button
              key={preset.name}
              onClick={() => onChange({ 
                backgroundColor: preset.bg, 
                textColor: preset.text 
              })}
              className="flex items-center space-x-3 p-3 rounded-lg border border-gray-600 hover:border-gray-500 transition-colors"
              style={{ backgroundColor: preset.bg }}
            >
              <div className="w-4 h-4 rounded border border-gray-400" style={{ backgroundColor: preset.text }}></div>
              <span style={{ color: preset.text }} className="text-sm font-medium">
                {preset.name}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Custom Colors */}
      <div className="grid grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-3">Background Color</label>
          <div className="flex items-center space-x-3">
            <input
              type="color"
              value={settings.backgroundColor}
              onChange={(e) => onChange({ backgroundColor: e.target.value })}
              className="w-12 h-10 rounded border border-gray-600 cursor-pointer"
            />
            <input
              type="text"
              value={settings.backgroundColor}
              onChange={(e) => onChange({ backgroundColor: e.target.value })}
              className="flex-1 p-2 bg-gray-800 border border-gray-600 rounded text-white text-sm focus:outline-none focus:border-blue-500"
              placeholder="#000000"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-3">Text Color</label>
          <div className="flex items-center space-x-3">
            <input
              type="color"
              value={settings.textColor}
              onChange={(e) => onChange({ textColor: e.target.value })}
              className="w-12 h-10 rounded border border-gray-600 cursor-pointer"
            />
            <input
              type="text"
              value={settings.textColor}
              onChange={(e) => onChange({ textColor: e.target.value })}
              className="flex-1 p-2 bg-gray-800 border border-gray-600 rounded text-white text-sm focus:outline-none focus:border-blue-500"
              placeholder="#FFFFFF"
            />
          </div>
        </div>
      </div>

      {/* Preview */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-3">Preview</label>
        <div 
          className="p-6 rounded-lg border border-gray-600"
          style={{ 
            backgroundColor: settings.backgroundColor,
            color: settings.textColor,
            fontFamily: settings.fontFamily
          }}
        >
          <div style={{ fontSize: `${Math.min(settings.fontSize, 32)}px` }} className="mb-2">
            "For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life."
          </div>
          <div style={{ fontSize: `${Math.min(settings.fontSize * 0.6, 20)}px` }} className="opacity-90">
            John 3:16
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectionSettings;