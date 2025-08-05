import { MediaItem } from "../types/app";
import { cloudinaryService } from "./cloudinaryService";

class MediaService {
	private mediaItems: MediaItem[] = [];

	constructor() {
		// Initialize with sample media from Cloudinary
		this.initializeSampleMedia();
	}

	private initializeSampleMedia() {
		// Sample media items with Cloudinary URLs
		this.mediaItems = [
			{
				id: "1",
				title: "Mountain Sunrise",
				type: "image",
				url: "https://res.cloudinary.com/demo/image/upload/v1699999999/mountain-sunrise.jpg",
				thumbnailUrl:
					"https://res.cloudinary.com/demo/image/upload/c_fill,w_400,h_300/v1699999999/mountain-sunrise.jpg",
				publicId: "mountain-sunrise",
				createdAt: new Date("2024-01-01"),
				format: "jpg",
				size: 2048000, // 2MB
			},
			{
				id: "2",
				title: "Cross on Hill",
				type: "image",
				url: "https://res.cloudinary.com/demo/image/upload/v1699999999/cross-on-hill.jpg",
				thumbnailUrl:
					"https://res.cloudinary.com/demo/image/upload/c_fill,w_400,h_300/v1699999999/cross-on-hill.jpg",
				publicId: "cross-on-hill",
				createdAt: new Date("2024-01-02"),
				format: "jpg",
				size: 1843200, // 1.8MB
			},
			{
				id: "3",
				title: "Church Interior",
				type: "image",
				url: "https://res.cloudinary.com/demo/image/upload/v1699999999/church-interior.jpg",
				thumbnailUrl:
					"https://res.cloudinary.com/demo/image/upload/c_fill,w_400,h_300/v1699999999/church-interior.jpg",
				publicId: "church-interior",
				createdAt: new Date("2024-01-03"),
				format: "jpg",
				size: 2560000, // 2.5MB
			},
			{
				id: "4",
				title: "Welcome Video",
				type: "video",
				url: "https://res.cloudinary.com/demo/video/upload/v1699999999/welcome-video.mp4",
				thumbnailUrl:
					"https://res.cloudinary.com/demo/video/upload/c_fill,w_400,h_300/v1699999999/welcome-video.jpg",
				publicId: "welcome-video",
				duration: 120,
				createdAt: new Date("2024-01-04"),
				format: "mp4",
				size: 10240000, // 10MB
			},
			{
				id: "5",
				title: "Worship Background",
				type: "image",
				url: "https://res.cloudinary.com/demo/image/upload/v1699999999/worship-background.jpg",
				thumbnailUrl:
					"https://res.cloudinary.com/demo/image/upload/c_fill,w_400,h_300/v1699999999/worship-background.jpg",
				publicId: "worship-background",
				createdAt: new Date("2024-01-05"),
				format: "jpg",
				size: 3072000, // 3MB
			},
			{
				id: "6",
				title: "Announcement Video",
				type: "video",
				url: "https://res.cloudinary.com/demo/video/upload/v1699999999/announcement-video.mp4",
				thumbnailUrl:
					"https://res.cloudinary.com/demo/video/upload/c_fill,w_400,h_300/v1699999999/announcement-video.jpg",
				publicId: "announcement-video",
				duration: 180,
				createdAt: new Date("2024-01-06"),
				format: "mp4",
				size: 15360000, // 15MB
			},
			{
				id: "7",
				title: "Bible on Table",
				type: "image",
				url: "https://res.cloudinary.com/demo/image/upload/v1699999999/bible-on-table.jpg",
				thumbnailUrl:
					"https://res.cloudinary.com/demo/image/upload/c_fill,w_400,h_300/v1699999999/bible-on-table.jpg",
				publicId: "bible-on-table",
				createdAt: new Date("2024-01-07"),
				format: "jpg",
				size: 2252800, // 2.2MB
			},
			{
				id: "8",
				title: "Sunset Worship",
				type: "image",
				url: "https://res.cloudinary.com/demo/image/upload/v1699999999/sunset-worship.jpg",
				thumbnailUrl:
					"https://res.cloudinary.com/demo/image/upload/c_fill,w_400,h_300/v1699999999/sunset-worship.jpg",
				publicId: "sunset-worship",
				createdAt: new Date("2024-01-08"),
				format: "jpg",
				size: 2867200, // 2.8MB
			},
		];
	}

	getAllMedia(): MediaItem[] {
		return this.mediaItems;
	}

	/**
	 * Upload a media file to Cloudinary
	 */
	async uploadMediaFile(file: File): Promise<MediaItem> {
		try {
			// Upload to Cloudinary
			const response = await cloudinaryService.uploadFile(
				file,
				"bible-echo-media",
			);

			if (!response.success) {
				throw new Error(response.error || "Failed to upload file");
			}

			// Create media item
			const newMedia: MediaItem = {
				id: `media-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
				title: file.name.replace(/\.[^/.]+$/, ""), // Remove file extension
				type: file.type.startsWith("image/") ? "image" : "video",
				url: response.url!,
				thumbnailUrl: response.thumbnailUrl,
				publicId: response.publicId,
				createdAt: new Date(),
				size: file.size,
				format: file.name.split(".").pop(),
			};

			// Add to media items
			this.mediaItems.push(newMedia);

			return newMedia;
		} catch (error) {
			console.error("Error uploading media file:", error);
			throw error;
		}
	}

	/**
	 * Delete a media item
	 */
	async deleteMediaItem(id: string): Promise<boolean> {
		const index = this.mediaItems.findIndex((item) => item.id === id);
		if (index === -1) return false;

		const mediaItem = this.mediaItems[index];

		try {
			// Delete from Cloudinary
			if (mediaItem.publicId) {
				await cloudinaryService.deleteFile(mediaItem.publicId);
			}

			// Remove from media items
			this.mediaItems.splice(index, 1);

			return true;
		} catch (error) {
			console.error("Error deleting media item:", error);
			return false;
		}
	}

	/**
	 * Search media items
	 */
	searchMedia(query: string, type?: MediaItem["type"]): MediaItem[] {
		const normalizedQuery = query.toLowerCase();
		return this.mediaItems.filter((item) => {
			const matchesQuery = item.title.toLowerCase().includes(normalizedQuery);
			const matchesType = !type || item.type === type;
			return matchesQuery && matchesType;
		});
	}

	/**
	 * Get media by type
	 */
	getMediaByType(type: MediaItem["type"]): MediaItem[] {
		return this.mediaItems.filter((item) => item.type === type);
	}

	/**
	 * Get optimized image URL
	 */
	getOptimizedImageUrl(
		publicId: string,
		options?: {
			width?: number;
			height?: number;
			quality?: number;
		},
	): string {
		return cloudinaryService.getOptimizedImageUrl(publicId, options);
	}

	/**
	 * Get video stream URL
	 */
	getVideoStreamUrl(publicId: string): string {
		return cloudinaryService.getVideoStreamUrl(publicId);
	}
}

export const mediaService = new MediaService();
