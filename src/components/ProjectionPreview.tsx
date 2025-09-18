import React from "react";
import {
	BibleVerse,
	ProjectionSettings,
	PlaylistItem,
	Song,
	MediaItem,
} from "../types/app";
import { Eye, Monitor } from "lucide-react";

interface ProjectionPreviewProps {
	currentItem: PlaylistItem | null;
	verse: BibleVerse | null;
	settings: ProjectionSettings;
	currentVerseIndex?: number;
	isPreview?: boolean;
	title?: string;
}

const ProjectionPreview: React.FC<ProjectionPreviewProps> = ({
	currentItem,
	verse,
	settings,
	currentVerseIndex = 0,
	isPreview = false,
	title = "Preview",
}) => {
	const renderContent = () => {
		if (currentItem) {
			switch (currentItem.type) {
				case "song":
					const song = currentItem.content as Song;
					const currentLyric = song.lyrics[currentVerseIndex];

					return (
						<div className='text-center max-w-4xl'>
							<div className='mb-4'>
								<div
									className='font-bold mb-3'
									style={{
										fontSize: `${Math.min(settings.fontSize * 0.4, 16)}px`,
									}}>
									{song.title}
								</div>
								<div
									className='leading-relaxed whitespace-pre-line'
									style={{
										fontSize: `${Math.min(settings.fontSize * 0.5, 20)}px`,
									}}>
									{currentLyric?.text || "No lyrics available"}
								</div>
								<div className='mt-2 text-xs opacity-75'>
									{currentLyric?.type === "verse"
										? `Verse ${currentLyric.number} of ${song.lyrics.length}`
										: `${currentLyric?.type} of ${song.lyrics.length}`}
								</div>
							</div>
						</div>
					);

				case "media":
					const media = currentItem.content as MediaItem;

					if (media.type === "image") {
						return (
							<div className='w-full h-full flex items-center justify-center'>
								<img
									src={media.thumbnailUrl || media.url}
									alt={media.title}
									className='max-w-full max-h-full object-contain rounded'
									style={{ maxHeight: "120px" }}
								/>
							</div>
						);
					} else if (media.type === "video") {
						return (
							<div className='w-full h-full flex flex-col items-center justify-center'>
								<div className='w-full max-w-xs aspect-video bg-black rounded overflow-hidden relative'>
									<img
										src={media.thumbnailUrl || ""}
										alt={media.title}
										className='w-full h-full object-cover'
									/>
									<div className='absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center'>
										<div className='w-8 h-8 bg-white bg-opacity-80 rounded-full flex items-center justify-center'>
											<div className='w-0 h-0 border-l-[6px] border-l-gray-800 border-y-[4px] border-y-transparent ml-0.5'></div>
										</div>
									</div>
								</div>
								<div className='mt-2 text-xs text-center'>{media.title}</div>
							</div>
						);
					}
					break;

				default:
					break;
			}
		}

		if (verse) {
			return (
				<div className='text-center max-w-4xl mx-auto'>
					<div
						className='mb-3 leading-relaxed max-w-full overflow-hidden'
						style={{ fontSize: `${Math.min(settings.fontSize * 0.5, 20)}px` }}>
						"{verse.text}"
					</div>
					<div
						className='font-semibold opacity-90'
						style={{ fontSize: `${Math.min(settings.fontSize * 0.3, 14)}px` }}>
						{verse.reference}
					</div>
				</div>
			);
		}

		return (
			<div className='text-center opacity-60 max-w-full overflow-hidden'>
				<div
					className='mb-2'
					style={{ fontSize: `${Math.min(settings.fontSize * 0.4, 16)}px` }}>
					Ready for Display
				</div>
				<div
					className='text-xs'
					style={{ fontSize: `${Math.min(settings.fontSize * 0.2, 10)}px` }}>
					Select content from the control panel
				</div>
			</div>
		);
	};

	const getBackgroundStyle = (): React.CSSProperties => {
		const baseStyle: React.CSSProperties = {
			backgroundColor: settings.backgroundColor,
			color: settings.textColor,
			fontFamily: settings.fontFamily,
			fontSize: "12px",
		};

		if (settings.backgroundImage) {
			baseStyle.backgroundImage = `url(${settings.backgroundImage})`;
			baseStyle.backgroundSize = "cover";
			baseStyle.backgroundPosition = "center";
		}

		if (settings.textShadow) {
			baseStyle.textShadow = "1px 1px 2px rgba(0,0,0,0.8)";
		}

		if (settings.textOutline) {
			baseStyle.WebkitTextStroke = "0.5px rgba(0,0,0,0.8)";
		}

		return baseStyle;
	};

	return (
		<div className='flex flex-col h-full'>
			{/* Preview Header */}
			<div className='flex items-center justify-between p-2 bg-gray-800 border-b border-gray-600'>
				<div className='flex items-center space-x-2'>
					{isPreview ? (
						<Eye size={16} className='text-blue-400' />
					) : (
						<Monitor size={16} className='text-red-400' />
					)}
					<span className='text-sm font-medium text-gray-200'>{title}</span>
				</div>
				<div
					className={`w-2 h-2 rounded-full ${
						isPreview ? "bg-blue-400" : "bg-red-500 animate-pulse"
					}`}></div>
			</div>

			{/* Preview Content */}
			<div
				className='flex-1 flex items-center justify-center p-4 relative overflow-hidden'
				style={getBackgroundStyle()}>
				{renderContent()}
			</div>
		</div>
	);
};

export default ProjectionPreview;
