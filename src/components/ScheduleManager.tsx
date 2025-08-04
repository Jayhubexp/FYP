import React, { useState } from 'react';
import { Schedule, PlaylistItem, Song, MediaItem } from '../types/app';
import { Calendar, Plus, Search, GripVertical, Play, Trash2, Clock, FileText } from 'lucide-react';

interface ScheduleManagerProps {
  currentSchedule: Schedule | null;
  songs: Song[];
  mediaItems: MediaItem[];
  onScheduleCreate: (schedule: Omit<Schedule, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onPlaylistItemSelect: (item: PlaylistItem) => void;
}

const ScheduleManager: React.FC<ScheduleManagerProps> = ({
  currentSchedule,
  songs,
  mediaItems,
  onScheduleCreate,
  onPlaylistItemSelect
}) => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newSchedule, setNewSchedule] = useState({
    title: '',
    date: new Date().toISOString().split('T')[0],
    items: [] as PlaylistItem[]
  });
  const [searchQuery, setSearchQuery] = useState('');

  const handleCreateSchedule = () => {
    if (newSchedule.title.trim()) {
      onScheduleCreate({
        title: newSchedule.title,
        date: new Date(newSchedule.date),
        items: newSchedule.items
      });
      setNewSchedule({
        title: '',
        date: new Date().toISOString().split('T')[0],
        items: []
      });
      setShowCreateForm(false);
    }
  };

  const addItemToSchedule = (type: PlaylistItem['type'], content?: any) => {
    const newItem: PlaylistItem = {
      id: Date.now().toString(),
      type,
      title: content?.title || `New ${type}`,
      content: content || null,
      duration: content?.duration
    };

    if (currentSchedule) {
      // In a real app, this would update the schedule
      console.log('Adding item to schedule:', newItem);
    } else {
      setNewSchedule(prev => ({
        ...prev,
        items: [...prev.items, newItem]
      }));
    }
  };

  const removeItemFromSchedule = (itemId: string) => {
    if (currentSchedule) {
      // In a real app, this would update the schedule
      console.log('Removing item from schedule:', itemId);
    } else {
      setNewSchedule(prev => ({
        ...prev,
        items: prev.items.filter(item => item.id !== itemId)
      }));
    }
  };

  const filteredSongs = songs.filter(song =>
    song.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredMedia = mediaItems.filter(media =>
    media.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getItemIcon = (type: PlaylistItem['type']) => {
    switch (type) {
      case 'bible':
        return '📖';
      case 'song':
        return '🎵';
      case 'media':
        return '🎬';
      case 'presentation':
        return '📊';
      case 'blank':
        return '⬛';
      default:
        return '📄';
    }
  };

  const schedule = currentSchedule || newSchedule;

  return (
    <div className="h-full flex">
      {/* Schedule Builder */}
      <div className="w-1/2 border-r border-gray-700 flex flex-col">
        <div className="p-6 border-b border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-200">
              {currentSchedule ? currentSchedule.title : 'New Schedule'}
            </h3>
            {!currentSchedule && (
              <button
                onClick={() => setShowCreateForm(!showCreateForm)}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                <Plus size={18} />
                <span>Create Schedule</span>
              </button>
            )}
          </div>

          {showCreateForm && (
            <div className="space-y-4 p-4 bg-gray-800 rounded-lg">
              <input
                type="text"
                value={newSchedule.title}
                onChange={(e) => setNewSchedule(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Schedule Title (e.g., Sunday Morning Service)"
                className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
              />
              <input
                type="date"
                value={newSchedule.date}
                onChange={(e) => setNewSchedule(prev => ({ ...prev, date: e.target.value }))}
                className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
              />
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateSchedule}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  Create
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Playlist Items */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-300 mb-2">Order of Service</h4>
            <div className="flex space-x-2 mb-4">
              <button
                onClick={() => addItemToSchedule('blank')}
                className="px-3 py-1 text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 rounded transition-colors"
              >
                + Blank Screen
              </button>
              <button
                onClick={() => addItemToSchedule('bible')}
                className="px-3 py-1 text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 rounded transition-colors"
              >
                + Scripture
              </button>
            </div>
          </div>

          {schedule.items.length === 0 ? (
            <div className="text-center text-gray-400 mt-8">
              <Calendar size={48} className="mx-auto mb-4 opacity-50" />
              <p>No items in schedule.</p>
              <p className="text-sm mt-2">Add songs, media, and other content from the right panel.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {schedule.items.map((item, index) => (
                <div
                  key={item.id}
                  className="flex items-center space-x-3 p-3 bg-gray-800 border border-gray-700 rounded-lg hover:border-gray-600 transition-colors"
                >
                  <GripVertical size={16} className="text-gray-500 cursor-move" />
                  <span className="text-lg">{getItemIcon(item.type)}</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-white truncate">{item.title}</div>
                    <div className="text-sm text-gray-400">
                      {item.type} {item.duration && `• ${Math.floor(item.duration / 60)}:${(item.duration % 60).toString().padStart(2, '0')}`}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => onPlaylistItemSelect(item)}
                      className="p-2 text-green-400 hover:text-green-300 transition-colors"
                      title="Select for projection"
                    >
                      <Play size={16} />
                    </button>
                    <button
                      onClick={() => removeItemFromSchedule(item.id)}
                      className="p-2 text-red-400 hover:text-red-300 transition-colors"
                      title="Remove from schedule"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Content Library */}
      <div className="w-1/2 flex flex-col">
        <div className="p-6 border-b border-gray-700">
          <h4 className="text-lg font-semibold text-gray-200 mb-4">Add Content</h4>
          <div className="relative">
            <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search songs and media..."
              className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {/* Songs Section */}
          <div className="mb-6">
            <h5 className="text-sm font-medium text-gray-300 mb-3">Songs ({filteredSongs.length})</h5>
            <div className="space-y-2">
              {filteredSongs.slice(0, 5).map((song) => (
                <div
                  key={song.id}
                  className="flex items-center justify-between p-3 bg-gray-800 border border-gray-700 rounded-lg hover:border-gray-600 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-white truncate">{song.title}</div>
                    {song.artist && (
                      <div className="text-sm text-gray-400">by {song.artist}</div>
                    )}
                  </div>
                  <button
                    onClick={() => addItemToSchedule('song', song)}
                    className="p-2 text-blue-400 hover:text-blue-300 transition-colors"
                    title="Add to schedule"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Media Section */}
          <div>
            <h5 className="text-sm font-medium text-gray-300 mb-3">Media ({filteredMedia.length})</h5>
            <div className="space-y-2">
              {filteredMedia.slice(0, 5).map((media) => (
                <div
                  key={media.id}
                  className="flex items-center justify-between p-3 bg-gray-800 border border-gray-700 rounded-lg hover:border-gray-600 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-white truncate">{media.title}</div>
                    <div className="text-sm text-gray-400 capitalize">{media.type}</div>
                  </div>
                  <button
                    onClick={() => addItemToSchedule('media', media)}
                    className="p-2 text-blue-400 hover:text-blue-300 transition-colors"
                    title="Add to schedule"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScheduleManager;