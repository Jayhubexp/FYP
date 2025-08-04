import React, { useState } from 'react';
import { Theme, ProjectionSettings } from '../types/app';
import { Palette, Plus, Eye, Download, Upload } from 'lucide-react';

interface ThemeManagerProps {
  themes: Theme[];
  currentSettings: ProjectionSettings;
  onThemeApply: (theme: Theme) => void;
}

const ThemeManager: React.FC<ThemeManagerProps> = ({ themes, currentSettings, onThemeApply }) => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTheme, setNewTheme] = useState<Omit<Theme, 'id'>>({
    name: '',
    backgroundColor: '#000000',
    textColor: '#FFFFFF',
    fontFamily: 'Arial',
    fontSize: 48,
    textShadow: false,
    textOutline: false
  });

  const handleCreateTheme = () => {
    if (newTheme.name.trim()) {
      const theme: Theme = {
        ...newTheme,
        id: Date.now().toString()
      };
      // In a real app, this would save the theme
      console.log('Creating theme:', theme);
      setNewTheme({
        name: '',
        backgroundColor: '#000000',
        textColor: '#FFFFFF',
        fontFamily: 'Arial',
        fontSize: 48,
        textShadow: false,
        textOutline: false
      });
      setShowCreateForm(false);
    }
  };

  const presetThemes: Theme[] = [
    {
      id: 'classic-black',
      name: 'Classic Black',
      backgroundColor: '#000000',
      textColor: '#FFFFFF',
      fontFamily: 'Arial',
      fontSize: 48,
      textShadow: false,
      textOutline: false
    },
    {
      id: 'navy-elegance',
      name: 'Navy Elegance',
      backgroundColor: '#1e293b',
      textColor: '#f1f5f9',
      fontFamily: 'Georgia',
      fontSize: 52,
      textShadow: true,
      textOutline: false
    },
    {
      id: 'warm-wood',
      name: 'Warm Wood',
      backgroundColor: '#92400e',
      textColor: '#fef3c7',
      fontFamily: 'Times New Roman',
      fontSize: 50,
      textShadow: true,
      textOutline: false
    },
    {
      id: 'modern-gradient',
      name: 'Modern Gradient',
      backgroundColor: '#4338ca',
      textColor: '#ffffff',
      fontFamily: 'Helvetica',
      fontSize: 46,
      textShadow: false,
      textOutline: true,
      gradient: {
        from: '#4338ca',
        to: '#7c3aed',
        direction: 'to bottom right'
      }
    },
    {
      id: 'clean-white',
      name: 'Clean White',
      backgroundColor: '#ffffff',
      textColor: '#1f2937',
      fontFamily: 'Arial',
      fontSize: 48,
      textShadow: false,
      textOutline: false
    },
    {
      id: 'forest-green',
      name: 'Forest Green',
      backgroundColor: '#064e3b',
      textColor: '#ecfdf5',
      fontFamily: 'Verdana',
      fontSize: 50,
      textShadow: true,
      textOutline: false
    }
  ];

  const allThemes = [...presetThemes, ...themes];

  const getThemePreviewStyle = (theme: Theme) => {
    const style: React.CSSProperties = {
      backgroundColor: theme.backgroundColor,
      color: theme.textColor,
      fontFamily: theme.fontFamily
    };

    if (theme.gradient) {
      style.background = `linear-gradient(${theme.gradient.direction}, ${theme.gradient.from}, ${theme.gradient.to})`;
    }

    if (theme.textShadow) {
      style.textShadow = '2px 2px 4px rgba(0,0,0,0.8)';
    }

    if (theme.textOutline) {
      style.WebkitTextStroke = '1px rgba(0,0,0,0.8)';
    }

    return style;
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-6 border-b border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-200">Theme Manager</h3>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              <Plus size={18} />
              <span>Create Theme</span>
            </button>
          </div>
        </div>

        {showCreateForm && (
          <div className="p-4 bg-gray-800 rounded-lg space-y-4">
            <h4 className="text-md font-semibold text-gray-200">Create Custom Theme</h4>
            
            <div className="grid grid-cols-2 gap-4">
              <input
                type="text"
                value={newTheme.name}
                onChange={(e) => setNewTheme(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Theme Name"
                className="p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
              />
              
              <select
                value={newTheme.fontFamily}
                onChange={(e) => setNewTheme(prev => ({ ...prev, fontFamily: e.target.value }))}
                className="p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
              >
                <option value="Arial">Arial</option>
                <option value="Times New Roman">Times New Roman</option>
                <option value="Georgia">Georgia</option>
                <option value="Helvetica">Helvetica</option>
                <option value="Verdana">Verdana</option>
                <option value="Trebuchet MS">Trebuchet MS</option>
              </select>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm text-gray-300 mb-2">Background Color</label>
                <input
                  type="color"
                  value={newTheme.backgroundColor}
                  onChange={(e) => setNewTheme(prev => ({ ...prev, backgroundColor: e.target.value }))}
                  className="w-full h-10 rounded border border-gray-600 cursor-pointer"
                />
              </div>
              
              <div>
                <label className="block text-sm text-gray-300 mb-2">Text Color</label>
                <input
                  type="color"
                  value={newTheme.textColor}
                  onChange={(e) => setNewTheme(prev => ({ ...prev, textColor: e.target.value }))}
                  className="w-full h-10 rounded border border-gray-600 cursor-pointer"
                />
              </div>
              
              <div>
                <label className="block text-sm text-gray-300 mb-2">Font Size</label>
                <input
                  type="number"
                  value={newTheme.fontSize}
                  onChange={(e) => setNewTheme(prev => ({ ...prev, fontSize: parseInt(e.target.value) }))}
                  min="24"
                  max="120"
                  className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex items-center space-x-6">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={newTheme.textShadow}
                  onChange={(e) => setNewTheme(prev => ({ ...prev, textShadow: e.target.checked }))}
                  className="rounded"
                />
                <span className="text-sm text-gray-300">Text Shadow</span>
              </label>
              
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={newTheme.textOutline}
                  onChange={(e) => setNewTheme(prev => ({ ...prev, textOutline: e.target.checked }))}
                  className="rounded"
                />
                <span className="text-sm text-gray-300">Text Outline</span>
              </label>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowCreateForm(false)}
                className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateTheme}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Create Theme
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {allThemes.map((theme) => (
            <div
              key={theme.id}
              className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden hover:border-gray-600 transition-colors"
            >
              {/* Theme Preview */}
              <div
                className="h-32 flex items-center justify-center p-4"
                style={getThemePreviewStyle(theme)}
              >
                <div className="text-center">
                  <div style={{ fontSize: '16px' }} className="font-semibold mb-1">
                    "For God so loved the world..."
                  </div>
                  <div style={{ fontSize: '12px' }} className="opacity-90">
                    John 3:16
                  </div>
                </div>
              </div>

              {/* Theme Info */}
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-white">{theme.name}</h4>
                  {currentSettings.theme === theme.name && (
                    <span className="text-xs px-2 py-1 bg-green-600 text-white rounded">
                      Active
                    </span>
                  )}
                </div>
                
                <div className="text-sm text-gray-400 mb-3">
                  {theme.fontFamily} • {theme.fontSize}px
                  {theme.textShadow && ' • Shadow'}
                  {theme.textOutline && ' • Outline'}
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1">
                    <div
                      className="w-4 h-4 rounded border border-gray-600"
                      style={{ backgroundColor: theme.backgroundColor }}
                    ></div>
                    <div
                      className="w-4 h-4 rounded border border-gray-600"
                      style={{ backgroundColor: theme.textColor }}
                    ></div>
                  </div>
                  
                  <button
                    onClick={() => onThemeApply(theme)}
                    className="px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
                  >
                    Apply
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ThemeManager;