import React, { useState, useRef, useEffect } from "react";
import {
	BibleVerse,
	ProjectionSettings,
	PlaylistItem,
	Song,
	MediaItem,
} from "../types/app";
import { mediaService } from "../services/mediaService";

interface ProjectionDisplayProps {
	currentItem: PlaylistItem | null;
	verse: BibleVerse | null;
	settings: ProjectionSettings;
	isLiveMode: boolean;
	showBlackScreen: boolean;
	showLogo: boolean;
	previewMode: boolean;
	currentVerseIndex?: number;
}

const ProjectionDisplay: React.FC<ProjectionDisplayProps> = ({
	currentItem,
	verse,
	settings,
	isLiveMode,
	showBlackScreen,
	showLogo,
	previewMode,
	currentVerseIndex = 0,
}) => {
	const videoRef = useRef<HTMLVideoElement>(null);
	const [isPlaying, setIsPlaying] = useState(false);
	const [currentTime, setCurrentTime] = useState(0);
	const [duration, setDuration] = useState(0);

	// Handle media playback state
	useEffect(() => {
		if (currentItem?.type === "media") {
			const media = currentItem.content as MediaItem;

			if (media.type === "video" && videoRef.current) {
				const video = videoRef.current;

				const handleTimeUpdate = () => setCurrentTime(video.currentTime);
				const handleLoadedMetadata = () => {
					setDuration(video.duration);
					if (isLiveMode) {
						video.play().then(() => setIsPlaying(true));
					}
				};
				const handleEnded = () => setIsPlaying(false);

				video.addEventListener("timeupdate", handleTimeUpdate);
				video.addEventListener("loadedmetadata", handleLoadedMetadata);
				video.addEventListener("ended", handleEnded);

				return () => {
					video.removeEventListener("timeupdate", handleTimeUpdate);
					video.removeEventListener("loadedmetadata", handleLoadedMetadata);
					video.removeEventListener("ended", handleEnded);
				};
			}
		}
	}, [currentItem, isLiveMode]);

	// Format time for display
	const formatTime = (time: number) => {
		const minutes = Math.floor(time / 60);
		const seconds = Math.floor(time % 60);
		return `${minutes}:${seconds.toString().padStart(2, "0")}`;
	};

	// Toggle play/pause
	const togglePlayback = () => {
		if (currentItem?.type === "media") {
			const media = currentItem.content as MediaItem;

			if (media.type === "video" && videoRef.current) {
				if (isPlaying) {
					videoRef.current.pause();
				} else {
					videoRef.current.play();
				}
				setIsPlaying(!isPlaying);
			}
		}
	};

	const renderContent = () => {
		// Only show content if in live mode, otherwise show black screen
		if (!isLiveMode) {
			return <div className='w-full h-full bg-black'></div>;
		}

		if (showBlackScreen) {
			return <div className='w-full h-full bg-black'></div>;
		}

		if (showLogo) {
			return (
				<div className='text-center'>
					<div className='w-24 h-24 md:w-32 md:h-32 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4'>
						<span className='text-3xl md:text-4xl font-bold text-white'>✝</span>
					</div>
					<div className='text-xl md:text-2xl font-semibold opacity-90'>
						Church Logo
					</div>
				</div>
			);
		}

		if (currentItem) {
			switch (currentItem.type) {
				case "song":
					const song = currentItem.content as Song;
					const currentLyric = song.lyrics[currentVerseIndex];

					return (
						<div className='text-center max-w-4xl'>
							<div className='mb-8'>
								<div
									className='font-bold mb-6'
									style={{ fontSize: `${settings.fontSize * 0.8}px` }}>
									{song.title}
								</div>
								<div
									className='leading-relaxed whitespace-pre-line'
									style={{ fontSize: `${settings.fontSize}px` }}>
									{currentLyric?.text || "No lyrics available"}
								</div>
								<div className='mt-4 text-sm opacity-75'>
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
						// Get optimized image URL based on screen size
						const optimizedUrl = mediaService.getOptimizedImageUrl(
							media.publicId || "",
							{
								width: window.innerWidth,
								height: window.innerHeight,
								quality: 80,
							},
						);

						return (
							<div className='w-full h-full flex items-center justify-center'>
								<img
									src={optimizedUrl}
									alt={media.title}
									className='max-w-full max-h-full object-contain'
									style={{ maxHeight: "85vh" }}
								/>
							</div>
						);
					} else if (media.type === "video") {
						// Get optimized video URL
						const videoUrl = mediaService.getVideoStreamUrl(
							media.publicId || "",
						);

						return (
							<div className='w-full h-full flex flex-col items-center justify-center'>
								<div className='w-full max-w-4xl aspect-video bg-black rounded-lg overflow-hidden relative'>
									<video
										ref={videoRef}
										src={videoUrl}
										className='w-full h-full'
										playsInline
									/>

									{/* Video Controls Overlay */}
									<div className='absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4'>
										<div className='flex items-center space-x-4'>
											<button
												onClick={togglePlayback}
												className='p-2 rounded-full bg-white/20 hover:bg-white/30 text-white'>
												{isPlaying ? (
													<svg
														xmlns='http://www.w3.org/2000/svg'
														className='h-6 w-6'
														fill='none'
														viewBox='0 0 24 24'
														stroke='currentColor'>
														<path
															strokeLinecap='round'
															strokeLinejoin='round'
															strokeWidth={2}
															d='M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z'
														/>
													</svg>
												) : (
													<svg
														xmlns='http://www.w3.org/2000/svg'
														className='h-6 w-6'
														fill='none'
														viewBox='0 0 24 24'
														stroke='currentColor'>
														<path
															strokeLinecap='round'
															strokeLinejoin='round'
															strokeWidth={2}
															d='M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z'
														/>
														<path
															strokeLinecap='round'
															strokeLinejoin='round'
															strokeWidth={2}
															d='M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
														/>
													</svg>
												)}
											</button>

											<div className='flex-1'>
												<div className='h-1 bg-white/30 rounded-full overflow-hidden'>
													<div
														className='h-full bg-white'
														style={{
															width: `${(currentTime / duration) * 100}%`,
														}}
													/>
												</div>
											</div>

											<div className='text-white text-sm'>
												{formatTime(currentTime)} / {formatTime(duration)}
											</div>
										</div>
									</div>
								</div>

								<div className='mt-4 text-white text-xl'>{media.title}</div>
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
						className='mb-6 md:mb-8 leading-relaxed max-w-full overflow-hidden'
						style={{ fontSize: `${settings.fontSize}px` }}>
						"{verse.text}"
					</div>
					<div
						className='font-semibold opacity-90'
						style={{ fontSize: `${settings.fontSize * 0.6}px` }}>
						{verse.reference}
					</div>
				</div>
			);
		}

		// Show black screen when no content is selected
		return <div className='w-full h-full bg-black'></div>;
	};

	const getBackgroundStyle = (): React.CSSProperties => {
		const baseStyle: React.CSSProperties = {
			backgroundColor: settings.backgroundColor,
			color: settings.textColor,
			fontFamily: settings.fontFamily,
			fontSize: "16px",
		};

		if (settings.backgroundImage) {
			baseStyle.backgroundImage = `url(${settings.backgroundImage})`;
			baseStyle.backgroundSize = "cover";
			baseStyle.backgroundPosition = "center";
		}

		if (settings.textShadow) {
			baseStyle.textShadow = "2px 2px 4px rgba(0,0,0,0.8)";
		}

		if (settings.textOutline) {
			baseStyle.WebkitTextStroke = "1px rgba(0,0,0,0.8)";
		}

		return baseStyle;
	};

	return (
		<div
			className='h-screen w-screen flex flex-col justify-center items-center p-4 md:p-8 relative overflow-hidden'
			style={getBackgroundStyle()}>
			{/* Content */}
			{renderContent()}
		</div>
	);
};

export default ProjectionDisplay;

// import React, { useState, useRef, useEffect } from "react";
// import {
// 	BibleVerse,
// 	ProjectionSettings,
// 	PlaylistItem,
// 	Song,
// 	MediaItem,
// } from "../types/app";
// import { mediaService } from "../services/mediaService";

// interface ProjectionDisplayProps {
// 	currentItem: PlaylistItem | null;
// 	verse: BibleVerse | null;
// 	settings: ProjectionSettings;
// 	isLiveMode: boolean;
// 	showBlackScreen: boolean;
// 	showLogo: boolean;
// 	previewMode: boolean;
// 	currentVerseIndex?: number;
// }

// const ProjectionDisplay: React.FC<ProjectionDisplayProps> = ({
// 	currentItem,
// 	verse,
// 	settings,
// 	isLiveMode,
// 	showBlackScreen,
// 	showLogo,
// 	previewMode,
// 	currentVerseIndex = 0,
// }) => {
// 	const videoRef = useRef<HTMLVideoElement>(null);
// 	const [isPlaying, setIsPlaying] = useState(false);
// 	const [currentTime, setCurrentTime] = useState(0);
// 	const [duration, setDuration] = useState(0);

// 	// Handle media playback state
// 	useEffect(() => {
// 		if (currentItem?.type === "media") {
// 			const media = currentItem.content as MediaItem;

// 			if (media.type === "video" && videoRef.current) {
// 				const video = videoRef.current;

// 				const handleTimeUpdate = () => setCurrentTime(video.currentTime);
// 				const handleLoadedMetadata = () => {
// 					setDuration(video.duration);
// 					if (isLiveMode) {
// 						video.play().then(() => setIsPlaying(true));
// 					}
// 				};
// 				const handleEnded = () => setIsPlaying(false);

// 				video.addEventListener("timeupdate", handleTimeUpdate);
// 				video.addEventListener("loadedmetadata", handleLoadedMetadata);
// 				video.addEventListener("ended", handleEnded);

// 				return () => {
// 					video.removeEventListener("timeupdate", handleTimeUpdate);
// 					video.removeEventListener("loadedmetadata", handleLoadedMetadata);
// 					video.removeEventListener("ended", handleEnded);
// 				};
// 			}
// 		}
// 	}, [currentItem, isLiveMode]);

// 	// Format time for display
// 	const formatTime = (time: number) => {
// 		const minutes = Math.floor(time / 60);
// 		const seconds = Math.floor(time % 60);
// 		return `${minutes}:${seconds.toString().padStart(2, "0")}`;
// 	};

// 	// Toggle play/pause
// 	const togglePlayback = () => {
// 		if (currentItem?.type === "media") {
// 			const media = currentItem.content as MediaItem;

// 			if (media.type === "video" && videoRef.current) {
// 				if (isPlaying) {
// 					videoRef.current.pause();
// 				} else {
// 					videoRef.current.play();
// 				}
// 				setIsPlaying(!isPlaying);
// 			}
// 		}
// 	};

// 	const renderContent = () => {
// 		if (showBlackScreen) {
// 			return <div className='text-center opacity-60'>Black Screen</div>;
// 		}

// 		if (showLogo) {
// 			return (
// 				<div className='text-center'>
// 					<div className='w-24 h-24 md:w-32 md:h-32 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4'>
// 						<span className='text-3xl md:text-4xl font-bold text-white'>✝</span>
// 					</div>
// 					<div className='text-xl md:text-2xl font-semibold opacity-90'>
// 						Church Logo
// 					</div>
// 				</div>
// 			);
// 		}

// 		if (currentItem) {
// 			switch (currentItem.type) {
// 				case "song":
// 					const song = currentItem.content as Song;
// 					const currentLyric = song.lyrics[currentVerseIndex];

// 					return (
// 						<div className='text-center max-w-4xl'>
// 							<div className='mb-8'>
// 								<div
// 									className='font-bold mb-6'
// 									style={{ fontSize: `${settings.fontSize * 0.8}px` }}>
// 									{song.title}
// 								</div>
// 								<div
// 									className='leading-relaxed whitespace-pre-line'
// 									style={{ fontSize: `${settings.fontSize}px` }}>
// 									{currentLyric?.text || "No lyrics available"}
// 								</div>
// 								<div className='mt-4 text-sm opacity-75'>
// 									{currentLyric?.type === "verse"
// 										? `Verse ${currentLyric.number} of ${song.lyrics.length}`
// 										: `${currentLyric?.type} of ${song.lyrics.length}`}
// 								</div>
// 							</div>
// 						</div>
// 					);

// 				case "media":
// 					const media = currentItem.content as MediaItem;

// 					if (media.type === "image") {
// 						// Get optimized image URL based on screen size
// 						const optimizedUrl = mediaService.getOptimizedImageUrl(
// 							media.publicId || "",
// 							{
// 								width: window.innerWidth,
// 								height: window.innerHeight,
// 								quality: 80,
// 							},
// 						);

// 						return (
// 							<div className='w-full h-full flex items-center justify-center'>
// 								<img
// 									src={optimizedUrl}
// 									alt={media.title}
// 									className='max-w-full max-h-full object-contain'
// 									style={{ maxHeight: "85vh" }}
// 								/>
// 							</div>
// 						);
// 					} else if (media.type === "video") {
// 						// Get optimized video URL
// 						const videoUrl = mediaService.getVideoStreamUrl(
// 							media.publicId || "",
// 						);

// 						return (
// 							<div className='w-full h-full flex flex-col items-center justify-center'>
// 								<div className='w-full max-w-4xl aspect-video bg-black rounded-lg overflow-hidden relative'>
// 									<video
// 										ref={videoRef}
// 										src={videoUrl}
// 										className='w-full h-full'
// 										playsInline
// 									/>

// 									{/* Video Controls Overlay */}
// 									<div className='absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4'>
// 										<div className='flex items-center space-x-4'>
// 											<button
// 												onClick={togglePlayback}
// 												className='p-2 rounded-full bg-white/20 hover:bg-white/30 text-white'>
// 												{isPlaying ? (
// 													<svg
// 														xmlns='http://www.w3.org/2000/svg'
// 														className='h-6 w-6'
// 														fill='none'
// 														viewBox='0 0 24 24'
// 														stroke='currentColor'>
// 														<path
// 															strokeLinecap='round'
// 															strokeLinejoin='round'
// 															strokeWidth={2}
// 															d='M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z'
// 														/>
// 													</svg>
// 												) : (
// 													<svg
// 														xmlns='http://www.w3.org/2000/svg'
// 														className='h-6 w-6'
// 														fill='none'
// 														viewBox='0 0 24 24'
// 														stroke='currentColor'>
// 														<path
// 															strokeLinecap='round'
// 															strokeLinejoin='round'
// 															strokeWidth={2}
// 															d='M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z'
// 														/>
// 														<path
// 															strokeLinecap='round'
// 															strokeLinejoin='round'
// 															strokeWidth={2}
// 															d='M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
// 														/>
// 													</svg>
// 												)}
// 											</button>

// 											<div className='flex-1'>
// 												<div className='h-1 bg-white/30 rounded-full overflow-hidden'>
// 													<div
// 														className='h-full bg-white'
// 														style={{
// 															width: `${(currentTime / duration) * 100}%`,
// 														}}
// 													/>
// 												</div>
// 											</div>

// 											<div className='text-white text-sm'>
// 												{formatTime(currentTime)} / {formatTime(duration)}
// 											</div>
// 										</div>
// 									</div>
// 								</div>

// 								<div className='mt-4 text-white text-xl'>{media.title}</div>
// 							</div>
// 						);
// 					}
// 					break;

// 				default:
// 					break;
// 			}
// 		}

// 		if (verse) {
// 			return (
// 				<div className='text-center max-w-4xl mx-auto'>
// 					<div
// 						className='mb-6 md:mb-8 leading-relaxed max-w-full overflow-hidden'
// 						style={{ fontSize: `${settings.fontSize}px` }}>
// 						"{verse.text}"
// 					</div>
// 					<div
// 						className='font-semibold opacity-90'
// 						style={{ fontSize: `${settings.fontSize * 0.6}px` }}>
// 						{verse.reference}
// 					</div>
// 				</div>
// 			);
// 		}

// 		return (
// 			<div className='text-center opacity-60 max-w-full overflow-hidden'>
// 				<div
// 					className='mb-4'
// 					style={{ fontSize: `${settings.fontSize * 0.8}px` }}>
// 					Ready for Display
// 				</div>
// 				<div
// 					className='text-sm'
// 					style={{ fontSize: `${settings.fontSize * 0.4}px` }}>
// 					Select content from the control panel
// 				</div>
// 			</div>
// 		);
// 	};

// 	const getBackgroundStyle = (): React.CSSProperties => {
// 		const baseStyle: React.CSSProperties = {
// 			backgroundColor: settings.backgroundColor,
// 			color: settings.textColor,
// 			fontFamily: settings.fontFamily,
// 			fontSize: "16px",
// 		};

// 		if (settings.backgroundImage) {
// 			baseStyle.backgroundImage = `url(${settings.backgroundImage})`;
// 			baseStyle.backgroundSize = "cover";
// 			baseStyle.backgroundPosition = "center";
// 		}

// 		if (settings.textShadow) {
// 			baseStyle.textShadow = "2px 2px 4px rgba(0,0,0,0.8)";
// 		}

// 		if (settings.textOutline) {
// 			baseStyle.WebkitTextStroke = "1px rgba(0,0,0,0.8)";
// 		}

// 		return baseStyle;
// 	};

// 	return (
// 		<div
// 			className='h-screen w-screen flex flex-col justify-center items-center p-4 md:p-8 relative overflow-hidden'
// 			style={getBackgroundStyle()}>
// 			{/* Header */}
// 			<div className='absolute top-4 left-4 right-4 flex justify-between items-center'>
// 				<div className='text-sm opacity-75'>
// 					{previewMode
// 						? "Preview Mode"
// 						: isLiveMode
// 						? "Live Output"
// 						: "Projection Display"}
// 				</div>
// 				<div
// 					className={`w-3 h-3 rounded-full ${
// 						isLiveMode ? "bg-red-500" : "bg-green-500"
// 					} animate-pulse`}></div>
// 			</div>
// 			{/* Content */}
// 			{renderContent()}
// 		</div>
// 	);
// };

// export default ProjectionDisplay;
