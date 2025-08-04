import React from 'react';
import { Mic, Volume2, Search } from 'lucide-react';

interface StatusIndicatorProps {
  status: 'idle' | 'listening' | 'processing' | 'error';
  transcription?: string;
}

const StatusIndicator: React.FC<StatusIndicatorProps> = ({ status, transcription }) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'listening':
        return {
          icon: Mic,
          color: 'text-green-400',
          bgColor: 'bg-green-900/30',
          label: 'Listening',
          animation: 'animate-pulse'
        };
      case 'processing':
        return {
          icon: Search,
          color: 'text-blue-400',
          bgColor: 'bg-blue-900/30',
          label: 'Processing',
          animation: 'animate-spin'
        };
      case 'error':
        return {
          icon: Volume2,
          color: 'text-red-400',
          bgColor: 'bg-red-900/30',
          label: 'Error',
          animation: ''
        };
      default:
        return {
          icon: Mic,
          color: 'text-gray-400',
          bgColor: 'bg-gray-700/30',
          label: 'Ready',
          animation: ''
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <div className={`flex items-center space-x-3 px-4 py-2 rounded-lg ${config.bgColor}`}>
      <Icon size={20} className={`${config.color} ${config.animation}`} />
      <div className="flex flex-col">
        <span className={`text-sm font-medium ${config.color}`}>
          {config.label}
        </span>
        {transcription && (
          <span className="text-xs text-gray-400 max-w-48 truncate">
            "{transcription}"
          </span>
        )}
      </div>
    </div>
  );
};

export default StatusIndicator;