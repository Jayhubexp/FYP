import React from 'react';
import { Monitor, Eye, Square, Image } from 'lucide-react';

interface LiveControlsProps {
  isLiveMode: boolean;
  previewMode: boolean;
  showBlackScreen: boolean;
  showLogo: boolean;
  onLiveControl: (action: 'live' | 'preview' | 'black' | 'logo') => void;
}

const LiveControls: React.FC<LiveControlsProps> = ({
  isLiveMode,
  previewMode,
  showBlackScreen,
  showLogo,
  onLiveControl
}) => {
  return (
    <div className="flex items-center space-x-2">
      {/* Preview/Live Toggle */}
      <div className="flex items-center bg-gray-700 rounded-lg overflow-hidden">
        <button
          onClick={() => onLiveControl('preview')}
          className={`flex items-center space-x-2 px-3 py-2 text-sm font-medium transition-colors ${
            previewMode
              ? 'bg-blue-600 text-white'
              : 'text-gray-300 hover:text-white hover:bg-gray-600'
          }`}
        >
          <Eye size={16} />
          <span>Preview</span>
        </button>
        <button
          onClick={() => onLiveControl('live')}
          className={`flex items-center space-x-2 px-3 py-2 text-sm font-medium transition-colors ${
            isLiveMode
              ? 'bg-red-600 text-white'
              : 'text-gray-300 hover:text-white hover:bg-gray-600'
          }`}
        >
          <Monitor size={16} />
          <span>Live</span>
        </button>
      </div>

      {/* Quick Controls */}
      <div className="flex items-center space-x-1">
        <button
          onClick={() => onLiveControl('black')}
          className={`p-2 rounded transition-colors ${
            showBlackScreen
              ? 'bg-gray-600 text-white'
              : 'text-gray-400 hover:text-white hover:bg-gray-700'
          }`}
          title="Black Screen"
        >
          <Square size={18} />
        </button>
        
        <button
          onClick={() => onLiveControl('logo')}
          className={`p-2 rounded transition-colors ${
            showLogo
              ? 'bg-gray-600 text-white'
              : 'text-gray-400 hover:text-white hover:bg-gray-700'
          }`}
          title="Show Logo"
        >
          <Image size={18} />
        </button>
      </div>
    </div>
  );
};

export default LiveControls;