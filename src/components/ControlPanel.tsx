import React, { useState } from "react";
import {
	useElectron,
	useElectronDisplays,
	useElectronProjection,
} from "../hooks/useElectron";
import {
	Mic,
	MicOff,
	Monitor,
	Settings,
	Music,
	Image,
	Calendar,
	Palette,
	Radio,
	Tv,
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
import ProjectionStudio from "./ProjectionStudio";

// Define the props that this component will receive from App.tsx
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
	onSongUpdate: (song: Song) => void;
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
	onSongUpdate,
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
	const displays = useElectronDisplays();
	const { openProjectionWindowOnDisplay } = useElectronProjection();
	const [selectedDisplayId, setSelectedDisplayId] = useState<
		number | undefined
	>(undefined);
	const [activeTab, setActiveTab] = useState<
		| "main"
		| "songs"
		| "media"
		| "schedule"
		| "themes"
		| "settings"
		| "logs"
		| "studio"
	>("main");

	const selectedSong =
		appState.currentPlaylistItem?.type === "song"
			? (appState.currentPlaylistItem.content as Song)
			: null;

	return (
		<div className='h-full flex flex-col bg-gray-900'>
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
						{isElectron && displays.length > 0 && (
							<select
								className='px-2 py-1 rounded bg-gray-700 text-white border border-gray-600 min-w-[120px]'
								value={selectedDisplayId ?? displays[0].id}
								onChange={(e) => setSelectedDisplayId(Number(e.target.value))}
								aria-label='Select display for projection'>
								{displays.map((d) => (
									<option key={d.id} value={d.id}>
										{d.internal ? "(Built-in) " : ""}Display {d.id} (
										{d.bounds.width}x{d.bounds.height})
									</option>
								))}
							</select>
						)}
						<button
							onClick={() => {
								if (isElectron && displays.length > 0) {
									openProjectionWindowOnDisplay(
										selectedDisplayId ?? displays[0].id,
									);
								} else {
									onToggleProjection();
								}
							}}
							className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
								showProjection
									? "bg-green-600 hover:bg-green-700"
									: "bg-gray-700 hover:bg-gray-600"
							}`}>
							<Monitor size={20} />
							<span>
								{showProjection ? "Hide Projection" : "Show Projection"}
							</span>
						</button>
					</div>
				</div>
			</div>

			<div className='flex border-b border-gray-700'>
				{[
					{ id: "main", label: "Main Control", icon: Mic },
					{ id: "studio", label: "Projection Studio", icon: Tv },
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

			<div className='flex-1 overflow-hidden'>
				{activeTab === "main" && (
					<div className='h-full flex flex-col'>
						<div className='p-6 border-b border-gray-700'>
							<div className='flex flex-col items-center space-y-4'>
								<button
									onClick={
										appState.isListening ? onStopListening : onStartListening
									}
									className={`flex items-center space-x-3 px-8 py-4 rounded-xl font-semibold text-lg transition-all transform hover:scale-105 ${
										appState.isListening
											? "bg-red-600 hover:bg-red-700"
											: "bg-green-600 hover:bg-green-700"
									}`}>
									{appState.isListening ? (
										<>
											<MicOff size={24} />
											<span>Stop Listening</span>
										</>
									) : (
										<>
											<Mic size={24} />
											<span>Start Listening</span>
										</>
									)}
								</button>
							</div>
						</div>
						<div className='p-6 border-b border-gray-700'>
							<ManualSearch onSearch={onManualSearch} />
						</div>
						<div className='flex-1 overflow-hidden'>
							<VerseList
								verses={appState.matchedVerses}
								selectedVerse={appState.selectedVerse}
								onVerseSelect={onVerseSelect}
							/>
						</div>
					</div>
				)}

				{activeTab === "studio" && (
					<ProjectionStudio
						currentItem={appState.currentPlaylistItem}
						verse={appState.selectedVerse}
						settings={appState.projectionSettings}
						isLiveMode={appState.isLiveMode}
						showBlackScreen={appState.showBlackScreen}
						showLogo={appState.showLogo}
						previewMode={appState.previewMode}
						currentVerseIndex={currentVerseIndex}
						onLiveControl={onLiveControl}
						goToNextVerse={goToNextVerse}
						goToPrevVerse={goToPrevVerse}
					/>
				)}

				{activeTab === "songs" && (
					<SongManager
						songs={appState.songs}
						onSongCreate={onSongCreate}
						onSongSelect={onSongSelect}
						onSongUpdate={onSongUpdate}
						selectedSong={selectedSong}
						currentVerseIndex={currentVerseIndex}
						goToNextVerse={goToNextVerse}
						goToPrevVerse={goToPrevVerse}
					/>
				)}

				{activeTab === "media" && (
					<MediaManager
						mediaItems={appState.mediaItems}
						onMediaSelect={onMediaSelect}
						onMediaAdd={onMediaAdd}
					/>
				)}

				{activeTab === "schedule" && (
					<ScheduleManager
						currentSchedule={appState.currentSchedule}
						songs={appState.songs}
						mediaItems={appState.mediaItems}
						onScheduleCreate={onScheduleCreate}
						onPlaylistItemSelect={onPlaylistItemSelect}
					/>
				)}

				{activeTab === "themes" && (
					<ThemeManager
						themes={appState.themes}
						currentSettings={appState.projectionSettings}
						onThemeApply={onThemeApply}
					/>
				)}

				{activeTab === "settings" && (
					<div className='p-6'>
						<ProjectionSettings
							settings={appState.projectionSettings}
							onChange={onProjectionSettingsChange}
						/>
					</div>
				)}

				{activeTab === "logs" && <ActivityLog logs={appState.logs} />}
			</div>
		</div>
	);
};

export default ControlPanel;

// import React, { useState } from "react";
// import {
// 	useElectron,
// 	useElectronDisplays,
// 	useElectronProjection,
// } from "../hooks/useElectron";
// import {
// 	Mic,
// 	MicOff,
// 	Monitor,
// 	Settings,
// 	Music,
// 	Image,
// 	Calendar,
// 	Palette,
// 	Radio,
// } from "lucide-react";
// import {
// 	AppState,
// 	BibleVerse,
// 	Song,
// 	MediaItem,
// 	Schedule,
// 	PlaylistItem,
// 	Theme,
// } from "../types/app";
// import StatusIndicator from "./StatusIndicator";
// import VerseList from "./VerseList";
// import ManualSearch from "./ManualSearch";
// import ProjectionSettings from "./ProjectionSettings";
// import ActivityLog from "./ActivityLog";
// import SongManager from "./SongManager";
// import MediaManager from "./MediaManager";
// import ScheduleManager from "./ScheduleManager";
// import ThemeManager from "./ThemeManager";
// import LiveControls from "./LiveControls";

// // Define the props that this component will receive from App.tsx
// interface ControlPanelProps {
// 	appState: AppState;
// 	onStartListening: () => void;
// 	onStopListening: () => void;
// 	onVerseSelect: (verse: BibleVerse) => void;
// 	onManualSearch: (query: string) => void;
// 	onProjectionSettingsChange: (settings: any) => void;
// 	onToggleProjection: () => void;
// 	onSongCreate: (song: Omit<Song, "id" | "createdAt" | "updatedAt">) => void;
// 	onSongSelect: (song: Song) => void;
// 	onSongUpdate: (song: Song) => void;
// 	onMediaSelect: (media: MediaItem) => void;
// 	onScheduleCreate: (
// 		schedule: Omit<Schedule, "id" | "createdAt" | "updatedAt">,
// 	) => void;
// 	onPlaylistItemSelect: (item: PlaylistItem) => void;
// 	onThemeApply: (theme: Theme) => void;
// 	onLiveControl: (action: "live" | "preview" | "black" | "logo") => void;
// 	showProjection: boolean;
// 	currentVerseIndex: number;
// 	goToNextVerse: () => void;
// 	goToPrevVerse: () => void;
// 	onMediaAdd?: (media: MediaItem) => void;
// }

// const ControlPanel: React.FC<ControlPanelProps> = ({
// 	appState,
// 	onStartListening,
// 	onStopListening,
// 	onVerseSelect,
// 	onManualSearch,
// 	onProjectionSettingsChange,
// 	onToggleProjection,
// 	onSongCreate,
// 	onSongSelect,
// 	onSongUpdate,
// 	onMediaSelect,
// 	onScheduleCreate,
// 	onPlaylistItemSelect,
// 	onThemeApply,
// 	onLiveControl,
// 	showProjection,
// 	currentVerseIndex,
// 	goToNextVerse,
// 	goToPrevVerse,
// 	onMediaAdd,
// }) => {
// 	const { isElectron } = useElectron();
// 	const displays = useElectronDisplays();
// 	const { openProjectionWindowOnDisplay } = useElectronProjection();
// 	const [selectedDisplayId, setSelectedDisplayId] = useState<
// 		number | undefined
// 	>(undefined);
// 	const [activeTab, setActiveTab] = useState<
// 		"main" | "songs" | "media" | "schedule" | "themes" | "settings" | "logs"
// 	>("main");

// 	const selectedSong =
// 		appState.currentPlaylistItem?.type === "song"
// 			? (appState.currentPlaylistItem.content as Song)
// 			: null;

// 	return (
// 		<div className='h-full flex flex-col bg-gray-900'>
// 			<div className='bg-gray-800 p-4 border-b border-gray-700'>
// 				<div className='flex items-center justify-between'>
// 					<div className='flex items-center space-x-3'>
// 						<h1 className='text-2xl font-bold text-blue-400'>Bible Echo</h1>
// 						{isElectron && (
// 							<span className='text-xs px-2 py-1 bg-green-600 text-white rounded'>
// 								Desktop
// 							</span>
// 						)}
// 					</div>
// 					<div className='flex items-center space-x-4'>
// 						<StatusIndicator
// 							status={appState.isListening ? "listening" : "idle"}
// 							transcription={appState.currentTranscription}
// 						/>
// 						<LiveControls {...appState} onLiveControl={onLiveControl} />
// 						{isElectron && displays.length > 0 && (
// 							<select
// 								className='px-2 py-1 rounded bg-gray-700 text-white border border-gray-600 min-w-[120px]'
// 								value={selectedDisplayId ?? displays[0].id}
// 								onChange={(e) => setSelectedDisplayId(Number(e.target.value))}
// 								aria-label='Select display for projection'>
// 								{displays.map((d) => (
// 									<option key={d.id} value={d.id}>
// 										{d.internal ? "(Built-in) " : ""}Display {d.id} (
// 										{d.bounds.width}x{d.bounds.height})
// 									</option>
// 								))}
// 							</select>
// 						)}
// 						<button
// 							onClick={() => {
// 								if (isElectron && displays.length > 0) {
// 									openProjectionWindowOnDisplay(
// 										selectedDisplayId ?? displays[0].id,
// 									);
// 								} else {
// 									onToggleProjection();
// 								}
// 							}}
// 							className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
// 								showProjection
// 									? "bg-green-600 hover:bg-green-700"
// 									: "bg-gray-700 hover:bg-gray-600"
// 							}`}>
// 							<Monitor size={20} />
// 							<span>
// 								{showProjection ? "Hide Projection" : "Show Projection"}
// 							</span>
// 						</button>
// 					</div>
// 				</div>
// 			</div>

// 			<div className='flex border-b border-gray-700'>
// 				{[
// 					{ id: "main", label: "Main Control", icon: Mic },
// 					{ id: "songs", label: "Songs", icon: Music },
// 					{ id: "media", label: "Media", icon: Image },
// 					{ id: "schedule", label: "Schedule", icon: Calendar },
// 					{ id: "themes", label: "Themes", icon: Palette },
// 					{ id: "settings", label: "Projection Settings", icon: Settings },
// 					{ id: "logs", label: "Activity Log", icon: Radio },
// 				].map((tab) => (
// 					<button
// 						key={tab.id}
// 						onClick={() => setActiveTab(tab.id as any)}
// 						className={`flex items-center space-x-2 px-6 py-3 font-medium transition-colors ${
// 							activeTab === tab.id
// 								? "bg-blue-600 text-white border-b-2 border-blue-400"
// 								: "text-gray-400 hover:text-white hover:bg-gray-800"
// 						}`}>
// 						<tab.icon size={18} />
// 						<span>{tab.label}</span>
// 					</button>
// 				))}
// 			</div>

// 			<div className='flex-1 overflow-hidden'>
// 				{activeTab === "main" && (
// 					<div className='h-full flex flex-col'>
// 						<div className='p-6 border-b border-gray-700'>
// 							<div className='flex flex-col items-center space-y-4'>
// 								<button
// 									onClick={
// 										appState.isListening ? onStopListening : onStartListening
// 									}
// 									className={`flex items-center space-x-3 px-8 py-4 rounded-xl font-semibold text-lg transition-all transform hover:scale-105 ${
// 										appState.isListening
// 											? "bg-red-600 hover:bg-red-700"
// 											: "bg-green-600 hover:bg-green-700"
// 									}`}>
// 									{appState.isListening ? (
// 										<>
// 											<MicOff size={24} />
// 											<span>Stop Listening</span>
// 										</>
// 									) : (
// 										<>
// 											<Mic size={24} />
// 											<span>Start Listening</span>
// 										</>
// 									)}
// 								</button>
// 							</div>
// 						</div>
// 						<div className='p-6 border-b border-gray-700'>
// 							<ManualSearch onSearch={onManualSearch} />
// 						</div>
// 						<div className='flex-1 overflow-hidden'>
// 							<VerseList
// 								verses={appState.matchedVerses}
// 								selectedVerse={appState.selectedVerse}
// 								onVerseSelect={onVerseSelect}
// 							/>
// 						</div>
// 					</div>
// 				)}

// 				{activeTab === "songs" && (
// 					<SongManager
// 						songs={appState.songs}
// 						onSongCreate={onSongCreate}
// 						onSongSelect={onSongSelect}
// 						onSongUpdate={onSongUpdate}
// 						selectedSong={selectedSong}
// 						currentVerseIndex={currentVerseIndex}
// 						goToNextVerse={goToNextVerse}
// 						goToPrevVerse={goToPrevVerse}
// 					/>
// 				)}

// 				{activeTab === "media" && (
// 					<MediaManager
// 						mediaItems={appState.mediaItems}
// 						onMediaSelect={onMediaSelect}
// 						onMediaAdd={onMediaAdd}
// 					/>
// 				)}

// 				{activeTab === "schedule" && (
// 					<ScheduleManager
// 						currentSchedule={appState.currentSchedule}
// 						songs={appState.songs}
// 						mediaItems={appState.mediaItems}
// 						onScheduleCreate={onScheduleCreate}
// 						onPlaylistItemSelect={onPlaylistItemSelect}
// 					/>
// 				)}

// 				{activeTab === "themes" && (
// 					<ThemeManager
// 						themes={appState.themes}
// 						currentSettings={appState.projectionSettings}
// 						onThemeApply={onThemeApply}
// 					/>
// 				)}

// 				{activeTab === "settings" && (
// 					<div className='p-6'>
// 						<ProjectionSettings
// 							settings={appState.projectionSettings}
// 							onChange={onProjectionSettingsChange}
// 						/>
// 					</div>
// 				)}

// 				{activeTab === "logs" && <ActivityLog logs={appState.logs} />}
// 			</div>
// 		</div>
// 	);
// };

// export default ControlPanel;
