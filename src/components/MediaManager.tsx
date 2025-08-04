import React, { useState } from "react";
import { MediaItem } from "../types/app";
import {
	Upload,
	Search,
	Image,
	Video,
	Music,
	Play,
	Trash2,
	FileText,
} from "lucide-react";
import { mediaService } from "../services/mediaService";

interface MediaManagerProps {
	mediaItems: MediaItem[];
	onMediaSelect: (media: MediaItem) => void;
	onMediaAdd?: (media: MediaItem) => void; // Add this prop
}

const MediaManager: React.FC<MediaManagerProps> = ({
	mediaItems,
	onMediaSelect,
	onMediaAdd,
}) => {
	const [searchQuery, setSearchQuery] = useState("");
	const [selectedType, setSelectedType] = useState<
		"all" | "image" | "video" | "audio"
	>("all");
	const [uploading, setUploading] = useState(false);

	const filteredMedia = mediaItems.filter((item) => {
		const matchesSearch = item.title
			.toLowerCase()
			.includes(searchQuery.toLowerCase());
		const matchesType = selectedType === "all" || item.type === selectedType;
		return matchesSearch && matchesType;
	});

	const getMediaIcon = (type: MediaItem["type"]) => {
		switch (type) {
			case "image":
				return <Image size={20} className='text-blue-400' />;
			case "video":
				return <Video size={20} className='text-green-400' />;
			case "audio":
				return <Music size={20} className='text-purple-400' />;
			default:
				return <FileText size={20} className='text-gray-400' />;
		}
	};

	const formatDuration = (seconds?: number) => {
		if (!seconds) return "";
		const mins = Math.floor(seconds / 60);
		const secs = seconds % 60;
		return `${mins}:${secs.toString().padStart(2, "0")}`;
	};

	const handleFileUpload = async (
		event: React.ChangeEvent<HTMLInputElement>,
	) => {
		const files = event.target.files;
		if (!files || files.length === 0) return;

		setUploading(true);

		try {
			// In a real app, you would upload files to a server or save them locally
			// For now, we'll simulate the upload and create media items
			for (let i = 0; i < files.length; i++) {
				const file = files[i];
				const fileType = file.type.split("/")[0] as MediaItem["type"];

				// Create a URL for the file (in a real app, this would be a server URL)
				const fileUrl = URL.createObjectURL(file);
				const thumbnailUrl = fileType === "image" ? fileUrl : undefined;

				const newMedia: Omit<MediaItem, "id" | "createdAt"> = {
					title: file.name.replace(/\.[^/.]+$/, ""), // Remove file extension
					type: fileType,
					filePath: fileUrl,
					thumbnailUrl,
					duration:
						fileType === "video" || fileType === "audio" ? 0 : undefined,
				};

				// Add to media service
				const addedMedia = mediaService.addMediaItem(newMedia);

				// Notify parent component
				if (onMediaAdd) {
					onMediaAdd(addedMedia);
				}
			}
		} catch (error) {
			console.error("Error uploading files:", error);
		} finally {
			setUploading(false);
			// Reset the file input
			event.target.value = "";
		}
	};

	const handleDeleteMedia = (id: string) => {
		if (window.confirm("Are you sure you want to delete this media item?")) {
			mediaService.deleteMediaItem(id);
			// In a real app, you would also delete the file from storage
		}
	};

	return (
		<div className='h-full flex flex-col'>
			<div className='p-6 border-b border-gray-700'>
				<div className='flex items-center justify-between mb-4'>
					<h3 className='text-lg font-semibold text-gray-200'>Media Library</h3>
					<label
						className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors cursor-pointer ${
							uploading
								? "bg-gray-600 cursor-not-allowed"
								: "bg-blue-600 hover:bg-blue-700 text-white"
						}`}>
						<Upload size={18} />
						<span>{uploading ? "Uploading..." : "Upload Media"}</span>
						<input
							type='file'
							multiple
							accept='image/*,video/*,audio/*,.ppt,.pptx'
							onChange={handleFileUpload}
							className='hidden'
							disabled={uploading}
						/>
					</label>
				</div>

				{/* Search and Filter */}
				<div className='flex space-x-4'>
					<div className='flex-1 relative'>
						<Search
							size={20}
							className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400'
						/>
						<input
							type='text'
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							placeholder='Search media files...'
							className='w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500'
						/>
					</div>

					<select
						value={selectedType}
						onChange={(e) => setSelectedType(e.target.value as any)}
						className='px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500'>
						<option value='all'>All Types</option>
						<option value='image'>Images</option>
						<option value='video'>Videos</option>
						<option value='audio'>Audio</option>
					</select>
				</div>
			</div>

			<div className='flex-1 overflow-y-auto p-4'>
				{filteredMedia.length === 0 ? (
					<div className='text-center text-gray-400 mt-8'>
						<Upload size={48} className='mx-auto mb-4 opacity-50' />
						<p>No media files found.</p>
						<p className='text-sm mt-2'>
							Upload images, videos, audio files, or presentations to get
							started.
						</p>
					</div>
				) : (
					<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
						{filteredMedia.map((item) => (
							<div
								key={item.id}
								className='bg-gray-800 border border-gray-700 rounded-lg overflow-hidden hover:border-gray-600 transition-colors'>
								{/* Thumbnail */}
								<div className='aspect-video bg-gray-700 flex items-center justify-center'>
									{item.thumbnailUrl ? (
										<img
											src={item.thumbnailUrl}
											alt={item.title}
											className='w-full h-full object-cover'
										/>
									) : (
										<div className='text-gray-400'>
											{getMediaIcon(item.type)}
										</div>
									)}
								</div>

								{/* Info */}
								<div className='p-4'>
									<div className='flex items-start justify-between mb-2'>
										<div className='flex-1 min-w-0'>
											<h4 className='font-medium text-white truncate'>
												{item.title}
											</h4>
											<div className='flex items-center space-x-2 mt-1'>
												{getMediaIcon(item.type)}
												<span className='text-sm text-gray-400 capitalize'>
													{item.type}
												</span>
												{item.duration !== undefined && (
													<>
														<span className='text-gray-500'>•</span>
														<span className='text-sm text-gray-400'>
															{formatDuration(item.duration)}
														</span>
													</>
												)}
											</div>
										</div>
									</div>

									{/* Actions */}
									<div className='flex items-center justify-between mt-3'>
										<span className='text-xs text-gray-500'>
											{item.createdAt.toLocaleDateString()}
										</span>
										<div className='flex items-center space-x-2'>
											<button
												onClick={() => onMediaSelect(item)}
												className='p-2 text-green-400 hover:text-green-300 transition-colors'
												title='Select for projection'>
												<Play size={16} />
											</button>
											<button
												onClick={() => handleDeleteMedia(item.id)}
												className='p-2 text-red-400 hover:text-red-300 transition-colors'
												title='Delete media'>
												<Trash2 size={16} />
											</button>
										</div>
									</div>
								</div>
							</div>
						))}
					</div>
				)}
			</div>
		</div>
	);
};

export default MediaManager;
