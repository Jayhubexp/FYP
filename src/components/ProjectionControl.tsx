import React from "react";
import {
	Monitor,
	Eye,
	Square,
	Image,
	Play,
	Pause,
	SkipForward,
	SkipBack,
} from "lucide-react";

interface ProjectionControlsProps {
	isLiveMode: boolean;
	previewMode: boolean;
	showBlackScreen: boolean;
	showLogo: boolean;
	onLiveControl: (action: "live" | "preview" | "black" | "logo") => void;
	onGoLive: () => void;
	canGoNext?: boolean;
	canGoPrev?: boolean;
	onNext?: () => void;
	onPrev?: () => void;
}

const ProjectionControls: React.FC<ProjectionControlsProps> = ({
	isLiveMode,
	previewMode,
	showBlackScreen,
	showLogo,
	onLiveControl,
	onGoLive,
	canGoNext = false,
	canGoPrev = false,
	onNext,
	onPrev,
}) => {
	return (
		<div className='flex items-center justify-between p-4 bg-gray-800 border-t border-gray-700'>
			{/* Navigation Controls */}
			<div className='flex items-center space-x-2'>
				<button
					onClick={onPrev}
					disabled={!canGoPrev}
					className={`p-2 rounded transition-colors ${
						canGoPrev
							? "text-gray-300 hover:text-white hover:bg-gray-700"
							: "text-gray-600 cursor-not-allowed"
					}`}
					title='Previous'>
					<SkipBack size={18} />
				</button>

				<button
					onClick={onNext}
					disabled={!canGoNext}
					className={`p-2 rounded transition-colors ${
						canGoNext
							? "text-gray-300 hover:text-white hover:bg-gray-700"
							: "text-gray-600 cursor-not-allowed"
					}`}
					title='Next'>
					<SkipForward size={18} />
				</button>
			</div>

			{/* Main Controls */}
			<div className='flex items-center space-x-4'>
				{/* Preview/Live Status */}
				<div className='flex items-center bg-gray-700 rounded-lg overflow-hidden'>
					<div
						className={`flex items-center space-x-2 px-3 py-2 text-sm font-medium ${
							previewMode ? "bg-blue-600 text-white" : "text-gray-300"
						}`}>
						<Eye size={16} />
						<span>Preview</span>
					</div>
					<div
						className={`flex items-center space-x-2 px-3 py-2 text-sm font-medium ${
							isLiveMode ? "bg-red-600 text-white" : "text-gray-300"
						}`}>
						<Monitor size={16} />
						<span>Live</span>
					</div>
				</div>

				{/* Go Live Button */}
				<button
					onClick={onGoLive}
					className={`flex items-center space-x-2 px-6 py-2 rounded-lg font-medium transition-colors ${
						isLiveMode
							? "bg-red-600 hover:bg-red-700 text-white"
							: "bg-green-600 hover:bg-green-700 text-white"
					}`}>
					{isLiveMode ? <Pause size={18} /> : <Play size={18} />}
					<span>{isLiveMode ? "Take Offline" : "Go Live"}</span>
				</button>

				{/* Quick Controls */}
				<div className='flex items-center space-x-1'>
					<button
						onClick={() => onLiveControl("black")}
						className={`p-2 rounded transition-colors ${
							showBlackScreen
								? "bg-gray-600 text-white"
								: "text-gray-400 hover:text-white hover:bg-gray-700"
						}`}
						title='Black Screen'>
						<Square size={18} />
					</button>

					<button
						onClick={() => onLiveControl("logo")}
						className={`p-2 rounded transition-colors ${
							showLogo
								? "bg-gray-600 text-white"
								: "text-gray-400 hover:text-white hover:bg-gray-700"
						}`}
						title='Show Logo'>
						<Image size={18} />
					</button>
				</div>
			</div>
		</div>
	);
};

export default ProjectionControls;
