import React from 'react';
import { LogEntry } from '../types/app';
import { Info, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';

interface ActivityLogProps {
  logs: LogEntry[];
}

const ActivityLog: React.FC<ActivityLogProps> = ({ logs }) => {
  const getLogIcon = (type: LogEntry['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle size={16} className="text-green-400" />;
      case 'warning':
        return <AlertTriangle size={16} className="text-yellow-400" />;
      case 'error':
        return <XCircle size={16} className="text-red-400" />;
      default:
        return <Info size={16} className="text-blue-400" />;
    }
  };

  const getLogColor = (type: LogEntry['type']) => {
    switch (type) {
      case 'success':
        return 'text-green-300';
      case 'warning':
        return 'text-yellow-300';
      case 'error':
        return 'text-red-300';
      default:
        return 'text-gray-300';
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-6 border-b border-gray-700">
        <h3 className="text-lg font-semibold text-gray-200">Activity Log</h3>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4">
        {logs.length === 0 ? (
          <div className="text-center text-gray-400 mt-8">
            <Info size={48} className="mx-auto mb-4 opacity-50" />
            <p>No activity logged yet.</p>
            <p className="text-sm mt-2">Start using the application to see logs here.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {logs.slice().reverse().map((log, index) => (
              <div
                key={index}
                className="flex items-start space-x-3 p-3 rounded-lg bg-gray-800 border border-gray-700"
              >
                <div className="mt-0.5">
                  {getLogIcon(log.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className={`text-sm ${getLogColor(log.type)}`}>
                    {log.message}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {log.timestamp.toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {logs.length > 0 && (
        <div className="p-4 border-t border-gray-700 text-center">
          <span className="text-sm text-gray-400">
            {logs.length} total log entries
          </span>
        </div>
      )}
    </div>
  );
};

export default ActivityLog;