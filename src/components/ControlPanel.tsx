import React, { useState, useEffect } from "react";
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
	// Search,
	// Play,
	// Pause,
	Music,
	// FileText,
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
	TranscriptionResult,
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
import { speechRecognitionService } from "../services/speechRecognitionService";
import { verseDetectionService } from "../services/verseDetectionService";

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
	onSongUpdate: (song: Song) => void;
	onTranscriptionUpdate: (text: string) => void;
	onVerseDetected: (verses: BibleVerse[]) => void;
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
	onSongUpdate,
	onTranscriptionUpdate,
	onVerseDetected,
}) => {
	const { isElectron, electronAPI } = useElectron();
	const displays = useElectronDisplays();
	const { openProjectionWindowOnDisplay } = useElectronProjection();
	const [selectedDisplayId, setSelectedDisplayId] = useState<
		number | undefined
	>(undefined);
	const [activeTab, setActiveTab] = useState<
		"main" | "songs" | "media" | "schedule" | "themes" | "settings" | "logs"
	>("main");
	const [isInitializing, setIsInitializing] = useState(false);
	const [transcriptionStatus, setTranscriptionStatus] = useState<
		"idle" | "listening" | "processing"
	>("idle");
	const [microphonePermission, setMicrophonePermission] = useState<
		boolean | null
	>(null);

	// Check microphone permission on mount
	useEffect(() => {
		const checkMicrophonePermission = async () => {
			if (isElectron && electronAPI) {
				try {
					const permission = await electronAPI.requestMicrophoneAccess();
					setMicrophonePermission(permission);
				} catch (error) {
					console.error("Error checking microphone permission:", error);
					setMicrophonePermission(false);
				}
			} else {
				// For web environment, we'll handle it differently
				setMicrophonePermission(true);
			}
		};

		checkMicrophonePermission();
	}, [isElectron, electronAPI]);

	// Determine the currently selected song
	const selectedSong =
		appState.currentPlaylistItem?.type === "song"
			? (appState.currentPlaylistItem.content as Song)
			: null;

	const handleStartListening = async () => {
		if (isInitializing || microphonePermission === false) return;

		try {
			setIsInitializing(true);
			setTranscriptionStatus("listening");

			await speechRecognitionService.startListening(
				async (result: TranscriptionResult) => {
					setTranscriptionStatus("processing");

					// Update transcription in UI
					onTranscriptionUpdate(result.text);

					// Check if the transcription contains trigger words
					if (speechRecognitionService.hasTriggerWords(result.text)) {
						// Detect Bible verses from the transcription
						const matchedVerses = await verseDetectionService.detectVerse(
							result,
						);

						if (matchedVerses.length > 0) {
							// Update the app state with matched verses
							onVerseDetected(matchedVerses);
						}
					}

					setTranscriptionStatus("listening");
				},
			);

			onStartListening(); // Call the existing prop to update state
		} catch (error) {
			console.error("Error starting speech recognition:", error);
			// Show error to user
		} finally {
			setIsInitializing(false);
		}
	};

	const handleStopListening = () => {
		speechRecognitionService.stopListening();
		setTranscriptionStatus("idle");
		onStopListening(); // Call the existing prop to update state
	};

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
						{isElectron && displays.length > 0 && (
							<>
								<label htmlFor='display-select' className='sr-only'>
									Select display for projection
								</label>
								<select
									id='display-select'
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
							</>
						)}
						<button
							onClick={async () => {
								if (isElectron && displays.length > 0) {
									const displayId = selectedDisplayId ?? displays[0].id;
									await openProjectionWindowOnDisplay(displayId);
								} else {
									onToggleProjection();
								}
							}}
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
							<div className='flex flex-col items-center space-y-4'>
								{microphonePermission === false && (
									<div className='bg-red-500/20 border border-red-500 rounded-lg p-4 w-full max-w-md'>
										<p className='text-red-300 text-center'>
											Microphone access denied. Please enable microphone
											permissions in your system settings.
										</p>
									</div>
								)}

								<button
									onClick={
										appState.isListening
											? handleStopListening
											: handleStartListening
									}
									disabled={isInitializing || microphonePermission === false}
									className={`flex items-center space-x-3 px-8 py-4 rounded-xl font-semibold text-lg transition-all transform hover:scale-105 ${
										appState.isListening
											? "bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-500/30"
											: "bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-500/30"
									} ${
										isInitializing || microphonePermission === false
											? "opacity-70 cursor-not-allowed"
											: ""
									}`}>
									{isInitializing ? (
										<>
											<div className='animate-spin rounded-full h-6 w-6 border-b-2 border-white'></div>
											<span>Initializing...</span>
										</>
									) : appState.isListening ? (
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

								{transcriptionStatus === "listening" && (
									<div className='flex items-center space-x-2 text-green-400'>
										<div className='w-3 h-3 rounded-full bg-green-500 animate-pulse'></div>
										<span>Listening for scripture references...</span>
									</div>
								)}

								{transcriptionStatus === "processing" && (
									<div className='flex items-center space-x-2 text-yellow-400'>
										<div className='w-3 h-3 rounded-full bg-yellow-500 animate-pulse'></div>
										<span>Processing speech...</span>
									</div>
								)}
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
							onSongUpdate={onSongUpdate}
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
