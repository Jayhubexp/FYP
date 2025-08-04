import React, { useState } from "react";
import { useElectron } from "../hooks/useElectron";
import {
	Mic,
	MicOff,
	Monitor,
	Settings,
	Search,
	Play,
	Pause,
	Music,
	FileText,
	Image,
	Calendar,
	Palette,
	Radio,
} from "lucide-react";
import {
	AppState,
	BibleVerse,
	Song,
	MediaItem,
	Schedule,
	PlaylistItem,
	Theme,
} from "../types/app";
import StatusIndicator from "./StatusIndicator";
import VerseList from "./VerseList";
import ManualSearch from "./ManualSearch";
import ProjectionSettings from "./ProjectionSettings";
import ActivityLog from "./ActivityLog";
import SongManager from "./SongManager";
import MediaManager from "./MediaManager";
import ScheduleManager from "./ScheduleManager";
import ThemeManager from "./ThemeManager";
import LiveControls from "./LiveControls";

interface ControlPanelProps {
	appState: AppState;
	onStartListening: () => void;
	onStopListening: () => void;
	onVerseSelect: (verse: BibleVerse) => void;
	onManualSearch: (query: string) => void;
	onProjectionSettingsChange: (settings: any) => void;
	onToggleProjection: () => void;
	onSongCreate: (song: Omit<Song, "id" | "createdAt" | "updatedAt">) => void;
	onSongSelect: (song: Song) => void;
	onMediaSelect: (media: MediaItem) => void;
	onScheduleCreate: (
		schedule: Omit<Schedule, "id" | "createdAt" | "updatedAt">,
	) => void;
	onPlaylistItemSelect: (item: PlaylistItem) => void;
	onThemeApply: (theme: Theme) => void;
	onLiveControl: (action: "live" | "preview" | "black" | "logo") => void;
	showProjection: boolean;
	currentVerseIndex: number;
	goToNextVerse: () => void;
	goToPrevVerse: () => void;
	onMediaAdd?: (media: MediaItem) => void;
}

const ControlPanel: React.FC<ControlPanelProps> = ({
	appState,
	onStartListening,
	onStopListening,
	onVerseSelect,
	onManualSearch,
	onProjectionSettingsChange,
	onToggleProjection,
	onSongCreate,
	onSongSelect,
	onMediaSelect,
	onScheduleCreate,
	onPlaylistItemSelect,
	onThemeApply,
	onLiveControl,
	showProjection,
	currentVerseIndex,
	goToNextVerse,
	goToPrevVerse,
	onMediaAdd,
}) => {
	const { isElectron } = useElectron();
	const [activeTab, setActiveTab] = useState<
		"main" | "songs" | "media" | "schedule" | "themes" | "settings" | "logs"
	>("main");

	// Determine the currently selected song
	const selectedSong =
		appState.currentPlaylistItem?.type === "song"
			? (appState.currentPlaylistItem.content as Song)
			: null;

	return (
		<div className='h-full flex flex-col bg-gray-900'>
			{/* Header */}
			<div className='bg-gray-800 p-4 border-b border-gray-700'>
				<div className='flex items-center justify-between'>
					<div className='flex items-center space-x-3'>
						<h1 className='text-2xl font-bold text-blue-400'>Bible Echo</h1>
						{isElectron && (
							<span className='text-xs px-2 py-1 bg-green-600 text-white rounded'>
								Desktop
							</span>
						)}
					</div>
					<div className='flex items-center space-x-4'>
						<StatusIndicator
							status={appState.isListening ? "listening" : "idle"}
							transcription={appState.currentTranscription}
						/>
						<LiveControls
							isLiveMode={appState.isLiveMode}
							previewMode={appState.previewMode}
							showBlackScreen={appState.showBlackScreen}
							showLogo={appState.showLogo}
							onLiveControl={onLiveControl}
						/>
						<button
							onClick={onToggleProjection}
							className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
								showProjection
									? "bg-green-600 hover:bg-green-700 text-white"
									: "bg-gray-700 hover:bg-gray-600 text-gray-200"
							}`}>
							<Monitor size={20} />
							<span>
								{showProjection ? "Hide Projection" : "Show Projection"}
							</span>
						</button>
					</div>
				</div>
			</div>

			{/* Tab Navigation */}
			<div className='flex border-b border-gray-700'>
				{[
					{ id: "main", label: "Main Control", icon: Mic },
					{ id: "songs", label: "Songs", icon: Music },
					{ id: "media", label: "Media", icon: Image },
					{ id: "schedule", label: "Schedule", icon: Calendar },
					{ id: "themes", label: "Themes", icon: Palette },
					{ id: "settings", label: "Projection Settings", icon: Settings },
					{ id: "logs", label: "Activity Log", icon: Radio },
				].map((tab) => (
					<button
						key={tab.id}
						onClick={() => setActiveTab(tab.id as any)}
						className={`flex items-center space-x-2 px-6 py-3 font-medium transition-colors ${
							activeTab === tab.id
								? "bg-blue-600 text-white border-b-2 border-blue-400"
								: "text-gray-400 hover:text-white hover:bg-gray-800"
						}`}>
						<tab.icon size={18} />
						<span>{tab.label}</span>
					</button>
				))}
			</div>

			{/* Tab Content */}
			<div className='flex-1 overflow-hidden'>
				{activeTab === "main" && (
					<div className='h-full flex flex-col'>
						{/* Speech Controls */}
						<div className='p-6 border-b border-gray-700'>
							<div className='flex items-center justify-center space-x-4'>
								<button
									onClick={
										appState.isListening ? onStopListening : onStartListening
									}
									className={`flex items-center space-x-3 px-8 py-4 rounded-xl font-semibold text-lg transition-all transform hover:scale-105 ${
										appState.isListening
											? "bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-500/30"
											: "bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-500/30"
									}`}>
									{appState.isListening ? (
										<MicOff size={24} />
									) : (
										<Mic size={24} />
									)}
									<span>
										{appState.isListening
											? "Stop Listening"
											: "Start Listening"}
									</span>
								</button>
							</div>
						</div>

						{/* Manual Search */}
						<div className='p-6 border-b border-gray-700'>
							<ManualSearch onSearch={onManualSearch} />
						</div>

						{/* Matched Verses */}
						<div className='flex-1 overflow-hidden'>
							<VerseList
								verses={appState.matchedVerses}
								selectedVerse={appState.selectedVerse}
								onVerseSelect={onVerseSelect}
							/>
						</div>
					</div>
				)}

				{activeTab === "songs" && (
					<div className='h-full'>
						<SongManager
							songs={appState.songs}
							onSongCreate={onSongCreate}
							onSongSelect={onSongSelect}
							currentVerseIndex={currentVerseIndex}
							goToNextVerse={goToNextVerse}
							goToPrevVerse={goToPrevVerse}
							selectedSong={selectedSong}
						/>
					</div>
				)}

				{activeTab === "media" && (
					<div className='h-full'>
						<MediaManager
							mediaItems={appState.mediaItems}
							onMediaSelect={onMediaSelect}
							onMediaAdd={onMediaAdd}
						/>
					</div>
				)}

				{activeTab === "schedule" && (
					<div className='h-full'>
						<ScheduleManager
							currentSchedule={appState.currentSchedule}
							songs={appState.songs}
							mediaItems={appState.mediaItems}
							onScheduleCreate={onScheduleCreate}
							onPlaylistItemSelect={onPlaylistItemSelect}
						/>
					</div>
				)}

				{activeTab === "themes" && (
					<div className='h-full'>
						<ThemeManager
							themes={appState.themes}
							currentSettings={appState.projectionSettings}
							onThemeApply={onThemeApply}
						/>
					</div>
				)}

				{activeTab === "settings" && (
					<div className='p-6'>
						<ProjectionSettings
							settings={appState.projectionSettings}
							onChange={onProjectionSettingsChange}
						/>
					</div>
				)}

				{activeTab === "logs" && (
					<div className='h-full'>
						<ActivityLog logs={appState.logs} />
					</div>
				)}
			</div>
		</div>
	);
};

export default ControlPanel;
