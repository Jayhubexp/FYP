import { useState, useEffect } from "react";
import { useElectron, useElectronProjection } from "./hooks/useElectron";
import ControlPanel from "./components/ControlPanel";
import ProjectionDisplay from "./components/ProjectionDisplay";
import {
	BibleVerse,
	// TranscriptionResult, // Removed unused import
	AppState,
	Song,
	// Presentation, // Removed unused import
	MediaItem,
	Schedule,
	PlaylistItem,
	Theme,
} from "./types/app";
import { bibleSearchService } from "./services/bibleSearchService";
// import { mockSpeechService } from "./services/mockSpeechService";
import { speechRecognitionService } from "./services/speechRecognitionService";
// import { verseDetectionService } from "./services/verseDetectionService"; // Removed unused import
import { songService } from "./services/songService";
import { mediaService } from "./services/mediaService";
import { scheduleService } from "./services/scheduleService";
import { themeService } from "./services/themeService";

function App() {
	const { isElectron, electronAPI } = useElectron();
	const {
		projectionWindowOpen,
		toggleProjectionWindow,
		updateProjectionContent,
	} = useElectronProjection();

	const [appState, setAppState] = useState<AppState>({
		isListening: false,
		currentTranscription: "",
		matchedVerses: [],
		selectedVerse: null,
		projectionSettings: {
			fontSize: 48,
			backgroundColor: "#000000",
			textColor: "#FFFFFF",
			fontFamily: "Arial",
			textShadow: false,
			textOutline: false,
		},
		logs: [],
		songs: [],
		presentations: [],
		mediaItems: [],
		currentSchedule: null,
		currentPlaylistItem: null,
		themes: [],
		isLiveMode: false,
		showBlackScreen: false,
		showLogo: false,
		previewMode: true,
	});

	const [showProjection, setShowProjection] = useState(false);
	const [currentVerseIndex, setCurrentVerseIndex] = useState(0);

	// Reset verse index when current playlist item changes
	useEffect(() => {
		setCurrentVerseIndex(0);
	}, [appState.currentPlaylistItem]);

	// Navigation functions
	const goToNextVerse = () => {
		if (appState.currentPlaylistItem?.type === "song") {
			const song = appState.currentPlaylistItem.content as Song;
			if (currentVerseIndex < song.lyrics.length - 1) {
				setCurrentVerseIndex(currentVerseIndex + 1);
			}
		}
	};

	const handleSongUpdate = (song: Song) => {
		setAppState((prev) => ({
			...prev,
			songs: prev.songs.map((s) => (s.id === song.id ? song : s)),
			logs: [
				...prev.logs,
				{
					timestamp: new Date(),
					message: `Updated song: ${song.title}`,
					type: "success",
				},
			],
		}));
	};

	const goToPrevVerse = () => {
		if (currentVerseIndex > 0) {
			setCurrentVerseIndex(currentVerseIndex - 1);
		}
	};

	// Handle keyboard navigation
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === "ArrowDown") {
				goToNextVerse();
			} else if (e.key === "ArrowUp") {
				goToPrevVerse();
			}
		};
		window.addEventListener("keydown", handleKeyDown);
		return () => {
			window.removeEventListener("keydown", handleKeyDown);
		};
	}, [goToNextVerse, goToPrevVerse]);

	// Handle Electron-specific functionality
	useEffect(() => {
		if (electronAPI) {
			// Listen for menu actions
			electronAPI.onMenuAction((_, action) => {
				switch (action) {
					case "new-schedule":
						// Handle new schedule creation
						break;
					case "open-schedule":
						// Handle schedule opening
						break;
					case "about":
						// Show about dialog
						break;
					case "help":
						// Show help
						break;
				}
			});

			// Listen for projection control shortcuts
			electronAPI.onProjectionControl((_, action) => {
				handleLiveControl(action as any);
			});

			// Listen for global shortcuts
			electronAPI.onGlobalShortcut((_, shortcut) => {
				if (shortcut === "navigate-verse") {
					// This will be handled by the keyboard event listener
				} else if (shortcut === "help") {
					// Show help
				}
			});

			return () => {
				electronAPI.removeAllListeners("menu-action");
				electronAPI.removeAllListeners("projection-control");
				electronAPI.removeAllListeners("global-shortcut");
			};
		}
	}, [electronAPI]);

	// Update projection content when state changes
	useEffect(() => {
		if (isElectron && projectionWindowOpen) {
			updateProjectionContent({
				currentItem: appState.currentPlaylistItem,
				verse: appState.selectedVerse,
				settings: appState.projectionSettings,
				isLiveMode: appState.isLiveMode,
				showBlackScreen: appState.showBlackScreen,
				showLogo: appState.showLogo,
				previewMode: appState.previewMode,
				currentVerseIndex,
			});
		}
	}, [
		appState.currentPlaylistItem,
		appState.selectedVerse,
		appState.projectionSettings,
		appState.isLiveMode,
		appState.showBlackScreen,
		appState.showLogo,
		appState.previewMode,
		currentVerseIndex,
		isElectron,
		projectionWindowOpen,
		updateProjectionContent,
	]);

	useEffect(() => {
		// Initialize services
		// bibleSearchService.initialize(); // Not needed, no such method
		songService.initialize();
		// mediaService.initialize();
		scheduleService.initialize();
		themeService.initialize();

		// Load initial data
		setAppState((prev) => ({
			...prev,
			songs: songService.getAllSongs(),
			presentations: [],
			mediaItems: mediaService.getAllMedia(),
			themes: themeService.getAllThemes(),
		}));
	}, []);

	const handleStartListening = async () => {
		try {
			setAppState((prev) => ({
				...prev,
				isListening: true,
				logs: [
					...prev.logs,
					{
						timestamp: new Date(),
						message: "Started listening for speech",
						type: "info",
					},
				],
			}));

			// Start the real speech recognition service
			await speechRecognitionService.startListening();
		} catch (error) {
			console.error("Error starting speech recognition:", error);
			setAppState((prev) => ({
				...prev,
				isListening: false,
				logs: [
					...prev.logs,
					{
						timestamp: new Date(),
						message: `Error starting speech recognition: ${error}`,
						type: "error",
					},
				],
			}));
		}
	};

	const handleStopListening = () => {
		setAppState((prev) => ({
			...prev,
			isListening: false,
			logs: [
				...prev.logs,
				{ timestamp: new Date(), message: "Stopped listening", type: "info" },
			],
		}));

		// Stop the real speech recognition service
		speechRecognitionService.stopListening();
	};

	const handleTranscriptionUpdate = (text: string) => {
		// Update the app state with the new transcription
		setAppState((prev) => ({
			...prev,
			currentTranscription: text,
		}));
	};

	const handleVerseDetected = (verses: BibleVerse[]) => {
		// Update the app state with the matched verses
		setAppState((prev) => ({
			...prev,
			matchedVerses: verses,
			selectedVerse: verses.length > 0 ? verses[0] : null,
			logs: [
				...prev.logs,
				{
					timestamp: new Date(),
					message: `Detected ${verses.length} matching verses from speech`,
					type: "success",
				},
			],
		}));
	};

	const handleVerseSelect = (verse: BibleVerse) => {
		setAppState((prev) => ({
			...prev,
			selectedVerse: verse,
			logs: [
				...prev.logs,
				{
					timestamp: new Date(),
					message: `Selected verse: ${verse.reference}`,
					type: "success",
				},
			],
		}));
	};

	const handleManualSearch = async (query: string) => {
		const matches = await bibleSearchService.searchVerses(query);
		setAppState((prev) => ({
			...prev,
			matchedVerses: matches,
			logs: [
				...prev.logs,
				{
					timestamp: new Date(),
					message: `Manual search for: "${query}" returned ${matches.length} results`,
					type: "info",
				},
			],
		}));
	};

	const handleProjectionSettingsChange = (settings: any) => {
		setAppState((prev) => ({
			...prev,
			projectionSettings: { ...prev.projectionSettings, ...settings },
		}));
	};

	const handleSongCreate = (
		song: Omit<Song, "id" | "createdAt" | "updatedAt">,
	) => {
		const newSong = songService.createSong(song);
		setAppState((prev) => ({
			...prev,
			songs: [...prev.songs, newSong],
			logs: [
				...prev.logs,
				{
					timestamp: new Date(),
					message: `Created new song: ${newSong.title}`,
					type: "success",
				},
			],
		}));
	};

	const handleSongSelect = (song: Song) => {
		const playlistItem: PlaylistItem = {
			id: Date.now().toString(),
			type: "song",
			title: song.title,
			content: song,
		};
		setAppState((prev) => ({
			...prev,
			currentPlaylistItem: playlistItem,
			logs: [
				...prev.logs,
				{
					timestamp: new Date(),
					message: `Selected song: ${song.title}`,
					type: "success",
				},
			],
		}));
		setCurrentVerseIndex(0);
	};

	const handleMediaSelect = (media: MediaItem) => {
		const playlistItem: PlaylistItem = {
			id: Date.now().toString(),
			type: "media",
			title: media.title,
			content: media,
		};
		setAppState((prev) => ({
			...prev,
			currentPlaylistItem: playlistItem,
			logs: [
				...prev.logs,
				{
					timestamp: new Date(),
					message: `Selected media: ${media.title}`,
					type: "success",
				},
			],
		}));
	};

	const handleMediaAdd = (media: MediaItem) => {
		setAppState((prev) => ({
			...prev,
			mediaItems: [...prev.mediaItems, media],
			logs: [
				...prev.logs,
				{
					timestamp: new Date(),
					message: `Added new media: ${media.title}`,
					type: "success",
				},
			],
		}));
	};

	const handleScheduleCreate = (
		schedule: Omit<Schedule, "id" | "createdAt" | "updatedAt">,
	) => {
		const newSchedule = scheduleService.createSchedule(schedule);
		setAppState((prev) => ({
			...prev,
			currentSchedule: newSchedule,
			logs: [
				...prev.logs,
				{
					timestamp: new Date(),
					message: `Created schedule: ${newSchedule.title}`,
					type: "success",
				},
			],
		}));
	};

	const handlePlaylistItemSelect = (item: PlaylistItem) => {
		setAppState((prev) => ({
			...prev,
			currentPlaylistItem: item,
			logs: [
				...prev.logs,
				{
					timestamp: new Date(),
					message: `Selected playlist item: ${item.title}`,
					type: "info",
				},
			],
		}));
		setCurrentVerseIndex(0);
	};

	const handleThemeApply = (theme: Theme) => {
		const newSettings = {
			backgroundColor: theme.backgroundColor,
			textColor: theme.textColor,
			fontFamily: theme.fontFamily,
			fontSize: theme.fontSize,
			backgroundImage: theme.backgroundImage,
			textShadow: theme.textShadow,
			textOutline: theme.textOutline,
			theme: theme.name,
		};
		setAppState((prev) => ({
			...prev,
			projectionSettings: { ...prev.projectionSettings, ...newSettings },
			logs: [
				...prev.logs,
				{
					timestamp: new Date(),
					message: `Applied theme: ${theme.name}`,
					type: "success",
				},
			],
		}));
	};

	const handleLiveControl = (action: "live" | "preview" | "black" | "logo") => {
		switch (action) {
			case "live":
				setAppState((prev) => ({
					...prev,
					isLiveMode: true,
					previewMode: false,
					showBlackScreen: false,
					showLogo: false,
				}));
				break;
			case "preview":
				setAppState((prev) => ({
					...prev,
					previewMode: true,
					isLiveMode: false,
				}));
				break;
			case "black":
				setAppState((prev) => ({
					...prev,
					showBlackScreen: !prev.showBlackScreen,
					showLogo: false,
				}));
				break;
			case "logo":
				setAppState((prev) => ({
					...prev,
					showLogo: !prev.showLogo,
					showBlackScreen: false,
				}));
				break;
		}
	};

	const toggleProjection = () => {
		if (isElectron) {
			toggleProjectionWindow();
		} else {
			setShowProjection(!showProjection);
		}
		setAppState((prev) => ({
			...prev,
			logs: [
				...prev.logs,
				{
					timestamp: new Date(),
					message: (isElectron ? projectionWindowOpen : showProjection)
						? "Projection display closed"
						: "Projection display opened",
					type: "info",
				},
			],
		}));
	};

	return (
		<div className='h-screen bg-gray-900 text-white flex'>
			{/* Main Control Panel */}
			<div className='flex-1'>
				<ControlPanel
					appState={appState}
					onStartListening={handleStartListening}
					onStopListening={handleStopListening}
					onVerseSelect={handleVerseSelect}
					onManualSearch={handleManualSearch}
					onProjectionSettingsChange={handleProjectionSettingsChange}
					onToggleProjection={toggleProjection}
					onSongCreate={handleSongCreate}
					onSongSelect={handleSongSelect}
					onMediaSelect={handleMediaSelect}
					onScheduleCreate={handleScheduleCreate}
					onPlaylistItemSelect={handlePlaylistItemSelect}
					onThemeApply={handleThemeApply}
					onLiveControl={handleLiveControl}
					showProjection={isElectron ? projectionWindowOpen : showProjection}
					currentVerseIndex={currentVerseIndex}
					goToNextVerse={goToNextVerse}
					goToPrevVerse={goToPrevVerse}
					onMediaAdd={handleMediaAdd}
					onSongUpdate={handleSongUpdate}
					onTranscriptionUpdate={handleTranscriptionUpdate}
					onVerseDetected={handleVerseDetected}
				/>
			</div>
			{/* Projection Display Window */}
			{!isElectron && showProjection && (
				<div className='w-1/2 border-l border-gray-700'>
					<ProjectionDisplay
						currentItem={appState.currentPlaylistItem}
						verse={appState.selectedVerse}
						settings={appState.projectionSettings}
						isLiveMode={appState.isLiveMode}
						showBlackScreen={appState.showBlackScreen}
						showLogo={appState.showLogo}
						previewMode={appState.previewMode}
						currentVerseIndex={currentVerseIndex}
					/>
				</div>
			)}
		</div>
	);
}

export default App;
