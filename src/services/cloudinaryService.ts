import axios from "axios";
import { Cloudinary } from "@cloudinary/url-gen";
import { fill } from "@cloudinary/url-gen/actions/resize";
import { quality } from "@cloudinary/url-gen/actions/delivery";
import { auto } from "@cloudinary/url-gen/qualifiers/format";

// Define a type for upload response
interface UploadResponse {
	success: boolean;
	url?: string;
	thumbnailUrl?: string;
	publicId?: string;
	error?: string;
}

export class CloudinaryService {
	private cloudinary: Cloudinary;
	private cloudName: string;
	private uploadPreset: string;

	constructor(cloudName: string, uploadPreset: string) {
		this.cloudinary = new Cloudinary({
			cloud: {
				cloudName: cloudName,
			},
		});
		this.cloudName = cloudName;
		this.uploadPreset = uploadPreset;
	}

	/**
	 * Upload a file to Cloudinary
	 */
	async uploadFile(
		file: File,
		folder: string = "media",
	): Promise<UploadResponse> {
		try {
			const formData = new FormData();
			formData.append("file", file);
			formData.append("upload_preset", this.uploadPreset);
			formData.append("folder", folder);

			// Add tags based on file type
			if (file.type.startsWith("image/")) {
				formData.append("tags", "bible-echo,image");
			} else if (file.type.startsWith("video/")) {
				formData.append("tags", "bible-echo,video");
			}

			const response = await axios.post(
				`https://api.cloudinary.com/v1_1/${this.cloudName}/upload`,
				formData,
				{
					headers: {
						"Content-Type": "multipart/form-data",
					},
				},
			);

			const { data } = response;

			// Generate thumbnail URL for videos
			let thumbnailUrl = data.secure_url;
			if (data.resource_type === "video") {
				thumbnailUrl = this.generateVideoThumbnail(data.public_id);
			}

			return {
				success: true,
				url: data.secure_url,
				thumbnailUrl,
				publicId: data.public_id,
			};
		} catch (error) {
			console.error("Error uploading to Cloudinary:", error);
			return {
				success: false,
				error:
					error instanceof Error ? error.message : "Unknown error occurred",
			};
		}
	}

	/**
	 * Delete a file from Cloudinary
	 * (Must be implemented securely on server-side using API secret)
	 */
	async deleteFile(publicId: string): Promise<boolean> {
		try {
			console.log(`Would delete file with public ID: ${publicId}`);
			return true;
		} catch (error) {
			console.error("Error deleting from Cloudinary:", error);
			return false;
		}
	}

	/**
	 * Generate optimized image URL
	 */
	getOptimizedImageUrl(
		publicId: string,
		options?: {
			width?: number;
			height?: number;
			quality?: number;
			crop?: string;
		},
	): string {
		const image = this.cloudinary.image(publicId);

		// Apply transformations
		if (options?.width || options?.height) {
			image.resize(
				fill()
					.width(options.width || 800)
					.height(options.height || 600),
			);
		}

		image.format(auto());
		image.delivery(quality(options?.quality || "auto"));

		return image.toURL();
	}

	/**
	 * Generate video thumbnail URL
	 */
	generateVideoThumbnail(publicId: string): string {
		const video = this.cloudinary.video(publicId);
		video.resize(fill().width(400).height(300));
		return video.toURL();
	}

	/**
	 * Generate video streaming URL
	 */
	getVideoStreamUrl(publicId: string): string {
		const video = this.cloudinary.video(publicId);
		video.format("mp4");
		video.delivery(quality("auto"));
		return video.toURL();
	}
}

// Create a default instance
export const cloudinaryService = new CloudinaryService(
	"dgjz5ycfr",
	"bible-echo",
);
