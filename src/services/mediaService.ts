import { MediaItem } from "../types/app";

class MediaService {
	private mediaItems: MediaItem[] = [];

	initialize() {
		// Load sample media items with actual image URLs
		this.mediaItems = [
			{
				id: "1",
				title: "Mountain Sunrise",
				type: "image",
				filePath: "../media/do.jpg",
				thumbnailUrl:
					"https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=400&q=80",
				createdAt: new Date("2024-01-01"),
			},
			{
				id: "2",
				title: "Cross on Hill",
				type: "image",
				filePath:
					"https://images.unsplash.com/photo-1549490349-8643362247b5?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
				thumbnailUrl:
					"https://images.unsplash.com/photo-1549490349-8643362247b5?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=400&q=80",
				createdAt: new Date("2024-01-02"),
			},
			{
				id: "3",
				title: "Ocean Waves",
				type: "image",
				filePath:
					"https://images.unsplash.com/photo-1549490349-8643362247b5?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
				thumbnailUrl:
					"https://images.unsplash.com/photo-1549490349-8643362247b5?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=400&q=80",
				createdAt: new Date("2024-01-03"),
			},
			{
				id: "4",
				title: "Forest Path",
				type: "image",
				filePath:
					"https://images.unsplash.com/photo-1441974231531-c6227db76b6e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
				thumbnailUrl:
					"https://images.unsplash.com/photo-1441974231531-c6227db76b6e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=400&q=80",
				createdAt: new Date("2024-01-04"),
			},
			{
				id: "5",
				title: "Welcome Video",
				type: "video",
				filePath:
					"https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4",
				duration: 30,
				thumbnailUrl:
					"https://images.unsplash.com/photo-1181406402839-9d4d8ed0b0d8?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
				createdAt: new Date("2024-01-05"),
			},
			{
				id: "6",
				title: "Prelude Music",
				type: "audio",
				filePath: "https://sample-videos.com/zip/10/mp3/SampleAudio_0.4mb.mp3",
				duration: 30,
				createdAt: new Date("2024-01-06"),
			},
			{
				id: "7",
				title: "Church Interior",
				type: "image",
				filePath:
					"https://images.unsplash.com/photo-1516494419754-9c5e9b1f0a9e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
				thumbnailUrl:
					"https://images.unsplash.com/photo-1516494419754-9c5e9b1f0a9e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=400&q=80",
				createdAt: new Date("2024-01-07"),
			},
			{
				id: "8",
				title: "Bible on Table",
				type: "image",
				filePath:
					"https://images.unsplash.com/photo-1504052434568-729c037b6a9d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
				thumbnailUrl:
					"https://images.unsplash.com/photo-1504052434568-729c037b6a9d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=400&q=80",
				createdAt: new Date("2024-01-08"),
			},
		];
	}

	getAllMedia(): MediaItem[] {
		return this.mediaItems;
	}

	addMediaItem(mediaData: Omit<MediaItem, "id" | "createdAt">): MediaItem {
		const newMedia: MediaItem = {
			...mediaData,
			id: Date.now().toString(),
			createdAt: new Date(),
		};

		this.mediaItems.push(newMedia);
		return newMedia;
	}

	deleteMediaItem(id: string): boolean {
		const index = this.mediaItems.findIndex((item) => item.id === id);
		if (index === -1) return false;
		this.mediaItems.splice(index, 1);
		return true;
	}

	searchMedia(query: string, type?: MediaItem["type"]): MediaItem[] {
		const normalizedQuery = query.toLowerCase();
		return this.mediaItems.filter((item) => {
			const matchesQuery = item.title.toLowerCase().includes(normalizedQuery);
			const matchesType = !type || item.type === type;
			return matchesQuery && matchesType;
		});
	}

	getMediaByType(type: MediaItem["type"]): MediaItem[] {
		return this.mediaItems.filter((item) => item.type === type);
	}
}

export const mediaService = new MediaService();
