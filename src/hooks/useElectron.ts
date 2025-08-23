import { useEffect, useState } from "react";

interface ElectronAPI {
	getDisplays: () => Promise<any[]>;
	createProjectionWindow: (displayId?: number) => Promise<boolean>;
	closeProjectionWindow: () => Promise<boolean>;
	toggleProjectionWindow: () => Promise<boolean>;
	updateProjectionContent: (content: any) => Promise<void>;
	getAppVersion: () => Promise<string>;
	showNotification: (title: string, body: string) => Promise<void>;
	onMenuAction: (callback: (event: any, action: string) => void) => void;
	onProjectionControl: (callback: (event: any, action: string) => void) => void;
	onGlobalShortcut: (callback: (event: any, shortcut: string) => void) => void;
	onProjectionUpdate: (callback: (event: any, content: any) => void) => void;
	removeAllListeners: (channel: string) => void;
	platform: string;
	isElectron: boolean;
	requestMicrophoneAccess: () => Promise<boolean>;
}

declare global {
	interface Window {
		electronAPI?: ElectronAPI;
	}
}

export const useElectron = () => {
	const [isElectron, setIsElectron] = useState(false);
	const [electronAPI, setElectronAPI] = useState<ElectronAPI | null>(null);

	useEffect(() => {
		if (window.electronAPI) {
			setIsElectron(true);
			setElectronAPI(window.electronAPI);
		}
	}, []);

	return {
		isElectron,
		electronAPI,
	};
};

export const useElectronDisplays = () => {
	const [displays, setDisplays] = useState<any[]>([]);
	const { electronAPI } = useElectron();

	useEffect(() => {
		if (electronAPI) {
			electronAPI.getDisplays().then(setDisplays);
		}
	}, [electronAPI]);

	return displays;
};

export const useElectronProjection = () => {
	const { electronAPI } = useElectron();
	const [projectionWindowOpen, setProjectionWindowOpen] = useState(false);

	// New: open projection window on a specific display
	const openProjectionWindowOnDisplay = async (displayId?: number) => {
		if (electronAPI) {
			const isOpen = await electronAPI.createProjectionWindow(displayId);
			setProjectionWindowOpen(isOpen);
			return isOpen;
		}
		return false;
	};

	const toggleProjectionWindow = async () => {
		if (electronAPI) {
			const isOpen = await electronAPI.toggleProjectionWindow();
			setProjectionWindowOpen(isOpen);
			return isOpen;
		}
		return false;
	};

	const updateProjectionContent = async (content: any) => {
		if (electronAPI) {
			await electronAPI.updateProjectionContent(content);
		}
	};

	return {
		projectionWindowOpen,
		toggleProjectionWindow,
		openProjectionWindowOnDisplay,
		updateProjectionContent,
	};
};
