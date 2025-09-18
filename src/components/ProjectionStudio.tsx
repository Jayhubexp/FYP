import React from "react";
import {
	BibleVerse,
	ProjectionSettings,
	PlaylistItem,
	Song,
} from "../types/app";
import ProjectionPreview from "./ProjectionPreview";
import ProjectionControls from "./ProjectionControl";

interface ProjectionStudioProps {
	currentItem: PlaylistItem | null;
	verse: BibleVerse | null;
	settings: ProjectionSettings;
	isLiveMode: boolean;
	showBlackScreen: boolean;
	showLogo: boolean;
	previewMode: boolean;
	currentVerseIndex: number;
	onLiveControl: (action: "live" | "preview" | "black" | "logo") => void;
	goToNextVerse: () => void;
	goToPrevVerse: () => void;
}

const ProjectionStudio: React.FC<ProjectionStudioProps> = ({
	currentItem,
	verse,
	settings,
	isLiveMode,
	showBlackScreen,
	showLogo,
	previewMode,
	currentVerseIndex,
	onLiveControl,
	goToNextVerse,
	goToPrevVerse,
}) => {
	// Determine what content to show in preview vs live
	const previewContent = {
		currentItem,
		verse,
		settings,
		currentVerseIndex,
		showBlackScreen: false,
		showLogo: false,
	};

	const liveContent = {
		currentItem: isLiveMode ? currentItem : null,
		verse: isLiveMode ? verse : null,
		settings,
		currentVerseIndex,
		showBlackScreen: isLiveMode ? showBlackScreen : false,
		showLogo: isLiveMode ? showLogo : false,
	};

	const handleGoLive = () => {
		if (isLiveMode) {
			onLiveControl("preview");
		} else {
			onLiveControl("live");
		}
	};

	// Check if we can navigate (for songs with multiple verses)
	const canNavigate =
		currentItem?.type === "song" &&
		(currentItem.content as Song)?.lyrics?.length > 1;
	const canGoNext =
		canNavigate &&
		currentVerseIndex < (currentItem.content as Song)?.lyrics?.length - 1;
	const canGoPrev = canNavigate && currentVerseIndex > 0;

	return (
		<div className='h-full flex flex-col bg-gray-900'>
			{/* Preview Monitors */}
			<div className='flex-1 grid grid-cols-2 gap-4 p-4'>
				{/* Preview Screen */}
				<div className='bg-gray-800 rounded-lg overflow-hidden border border-gray-700'>
					<ProjectionPreview
						{...previewContent}
						isPreview={true}
						title='Preview'
					/>
				</div>

				{/* Live Screen */}
				<div className='bg-gray-800 rounded-lg overflow-hidden border border-gray-700'>
					<ProjectionPreview
						{...liveContent}
						isPreview={false}
						title='Live Output'
					/>
				</div>
			</div>

			{/* Control Bar */}
			<ProjectionControls
				isLiveMode={isLiveMode}
				previewMode={previewMode}
				showBlackScreen={showBlackScreen}
				showLogo={showLogo}
				onLiveControl={onLiveControl}
				onGoLive={handleGoLive}
				canGoNext={canGoNext}
				canGoPrev={canGoPrev}
				onNext={goToNextVerse}
				onPrev={goToPrevVerse}
			/>
		</div>
	);
};

export default ProjectionStudio;
