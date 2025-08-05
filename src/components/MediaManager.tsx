import React, { useState } from "react";
import { MediaItem } from "../types/app";
import {
	Upload,
	Search,
	Image,
	Video,
	Play,
	Trash2,
	FileText,
	Cloud,
	Loader2,
} from "lucide-react";
import { mediaService } from "../services/mediaService";

interface MediaManagerProps {
	mediaItems: MediaItem[];
	onMediaSelect: (media: MediaItem) => void;
	onMediaAdd?: (media: MediaItem) => void;
}

const MediaManager: React.FC<MediaManagerProps> = ({
	mediaItems,
	onMediaSelect,
	onMediaAdd,
}) => {
	const [searchQuery, setSearchQuery] = useState("");
	const [selectedType, setSelectedType] = useState<"all" | "image" | "video">(
		"all",
	);
	const [uploading, setUploading] = useState(false);
	const [uploadProgress, setUploadProgress] = useState(0);
	const [dragActive, setDragActive] = useState(false);

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
			default:
				return <FileText size={20} className='text-gray-400' />;
		}
	};

	const formatFileSize = (bytes?: number): string => {
		if (!bytes) return "";
		const sizes = ["Bytes", "KB", "MB", "GB"];
		if (bytes === 0) return "0 Bytes";
		const i = Math.floor(Math.log(bytes) / Math.log(1024));
		return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + " " + sizes[i];
	};

	const formatDuration = (seconds?: number): string => {
		if (!seconds) return "";
		const mins = Math.floor(seconds / 60);
		const secs = seconds % 60;
		return `${mins}:${secs.toString().padStart(2, "0")}`;
	};

	// Drag and drop handlers
	const handleDrag = (e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
		if (e.type === "dragenter" || e.type === "dragover") {
			setDragActive(true);
		} else if (e.type === "dragleave") {
			setDragActive(false);
		}
	};

	const handleDrop = (e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
		setDragActive(false);

		if (e.dataTransfer.files && e.dataTransfer.files[0]) {
			handleFileUpload({ target: { files: e.dataTransfer.files } } as any);
		}
	};

	const handleFileUpload = async (
		event: React.ChangeEvent<HTMLInputElement>,
	) => {
		const files = event.target.files;
		if (!files || files.length === 0) return;

		setUploading(true);
		setUploadProgress(0);

		try {
			const totalFiles = files.length;

			for (let i = 0; i < files.length; i++) {
				const file = files[i];

				try {
					// Validate file type
					if (
						!file.type.startsWith("image/") &&
						!file.type.startsWith("video/")
					) {
						console.warn(`Skipping unsupported file type: ${file.type}`);
						continue;
					}

					// Validate file size (max 50MB)
					if (file.size > 50 * 1024 * 1024) {
						console.warn(`File too large: ${file.name}`);
						continue;
					}

					// Upload the file
					const addedMedia = await mediaService.uploadMediaFile(file);

					// Notify parent component
					if (onMediaAdd) {
						onMediaAdd(addedMedia);
					}

					// Update progress
					setUploadProgress(((i + 1) / totalFiles) * 100);
				} catch (error) {
					console.error(`Error uploading file ${file.name}:`, error);
				}
			}
		} catch (error) {
			console.error("Error uploading files:", error);
		} finally {
			setUploading(false);
			setUploadProgress(0);
			// Reset the file input
			event.target.value = "";
		}
	};

	const handleDeleteMedia = async (id: string) => {
		if (
			window.confirm(
				"Are you sure you want to delete this media item? This will permanently delete it from Cloudinary.",
			)
		) {
			try {
				const success = await mediaService.deleteMediaItem(id);
				if (success) {
					// In a real app, you would update the state or refresh the media list
					window.location.reload(); // Simple refresh for now
				} else {
					alert("Failed to delete media item.");
				}
			} catch (error) {
				console.error("Error deleting media item:", error);
				alert("Failed to delete media item.");
			}
		}
	};

	return (
		<div className='h-full flex flex-col'>
			<div className='p-6 border-b border-gray-700'>
				<div className='flex items-center justify-between mb-4'>
					<div className='flex items-center space-x-3'>
						<h3 className='text-lg font-semibold text-gray-200 flex items-center'>
							<Cloud className='mr-2' size={20} />
							Media Library
						</h3>
						<span className='text-xs px-2 py-1 bg-blue-600 text-white rounded'>
							Cloud Storage
						</span>
					</div>
					<label
						className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors cursor-pointer ${
							uploading
								? "bg-gray-600 cursor-not-allowed"
								: "bg-blue-600 hover:bg-blue-700 text-white"
						}`}>
						{uploading ? (
							<Loader2 size={18} className='animate-spin' />
						) : (
							<Upload size={18} />
						)}
						<span>{uploading ? "Uploading..." : "Upload Media"}</span>
						<input
							type='file'
							multiple
							accept='image/*,video/*'
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
						className='px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500'
						title='Filter by media type'
						aria-label='Filter by media type'>
						<option value='all'>All Types</option>
						<option value='image'>Images</option>
						<option value='video'>Videos</option>
					</select>
				</div>

				{/* Upload Progress */}
				{uploading && (
					<div className='mt-4'>
						<div className='flex items-center justify-between mb-1'>
							<span className='text-sm text-gray-400'>Uploading files...</span>
							<span className='text-sm text-gray-400'>
								{Math.round(uploadProgress)}%
							</span>
						</div>
						<div
							className='w-full bg-gray-700 rounded-full h-2'
							role='progressbar'
							aria-valuemin='0'
							aria-valuemax='100'
							title={`Upload progress: ${Math.round(uploadProgress)}%`}>
							<div
								className='bg-blue-600 h-2 rounded-full transition-all duration-300'
								style={{ width: uploadProgress + "%" }}
							/>
						</div>
					</div>
				)}
			</div>

			<div className='flex-1 overflow-y-auto p-4'>
				{/* Drag and Drop Area */}
				{dragActive && (
					<div
						className='border-2 border-dashed border-blue-500 rounded-lg p-8 mb-4 text-center'
						onDragEnter={handleDrag}
						onDragOver={handleDrag}
						onDragLeave={handleDrag}
						onDrop={handleDrop}>
						<Cloud size={48} className='mx-auto mb-4 text-blue-400' />
						<p className='text-lg text-white mb-2'>Drop files here to upload</p>
						<p className='text-sm text-gray-400'>
							Supports images and videos up to 50MB
						</p>
					</div>
				)}

				{filteredMedia.length === 0 ? (
					<div className='text-center text-gray-400 mt-8'>
						<Cloud size={48} className='mx-auto mb-4 opacity-50' />
						<p>No media files found.</p>
						<p className='text-sm mt-2'>
							Upload images or videos to get started. Files are stored securely
							in the cloud.
						</p>
					</div>
				) : (
					<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
						{filteredMedia.map((item) => (
							<div
								key={item.id}
								className='bg-gray-800 border border-gray-700 rounded-lg overflow-hidden hover:border-gray-600 transition-colors group'>
								{/* Thumbnail */}
								<div className='aspect-video bg-gray-700 flex items-center justify-center relative overflow-hidden'>
									{item.type === "image" ? (
										<img
											src={item.thumbnailUrl || item.url}
											alt={item.title}
											className='w-full h-full object-cover group-hover:scale-105 transition-transform duration-300'
										/>
									) : (
										<div className='relative w-full h-full'>
											<img
												src={item.thumbnailUrl || ""}
												alt={item.title}
												className='w-full h-full object-cover'
											/>
											<div className='absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center'>
												<Video size={48} className='text-white' />
											</div>
										</div>
									)}

									{/* Type Badge */}
									<div className='absolute top-2 right-2 px-2 py-1 bg-black bg-opacity-70 rounded text-xs text-white'>
										{item.type.toUpperCase()}
									</div>
								</div>

								{/* Info */}
								<div className='p-4'>
									<div className='flex items-start justify-between mb-2'>
										<div className='flex-1 min-w-0'>
											<h4
												className='font-medium text-white truncate'
												title={item.title}>
												{item.title}
											</h4>
											<div className='flex items-center space-x-2 mt-1'>
												{getMediaIcon(item.type)}
												<span className='text-sm text-gray-400 capitalize'>
													{item.type}
												</span>
												{item.format && (
													<>
														<span className='text-gray-500'>•</span>
														<span className='text-sm text-gray-400'>
															{item.format.toUpperCase()}
														</span>
													</>
												)}
												{item.size && (
													<>
														<span className='text-gray-500'>•</span>
														<span className='text-sm text-gray-400'>
															{formatFileSize(item.size)}
														</span>
													</>
												)}
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
