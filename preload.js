import { contextBridge, ipcRenderer } from "electron";

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld("electronAPI", {
	// Display management
	getDisplays: () => ipcRenderer.invoke("get-displays"),

	// Projection window control
	createProjectionWindow: () => ipcRenderer.invoke("create-projection-window"),
	closeProjectionWindow: () => ipcRenderer.invoke("close-projection-window"),
	toggleProjectionWindow: () => ipcRenderer.invoke("toggle-projection-window"),
	updateProjectionContent: (content) =>
		ipcRenderer.invoke("update-projection-content", content),

	// App info
	getAppVersion: () => ipcRenderer.invoke("get-app-version"),

	// Notifications
	showNotification: (title, body) =>
		ipcRenderer.invoke("show-notification", title, body),

	// Menu actions
	onMenuAction: (callback) => {
		ipcRenderer.on("menu-action", (_, ...args) => callback(...args));
	},
	onProjectionControl: (callback) => {
		ipcRenderer.on("projection-control", (_, ...args) => callback(...args));
	},
	onGlobalShortcut: (callback) => {
		ipcRenderer.on("global-shortcut", (_, ...args) => callback(...args));
	},
	openMediaFolder: () => ipcRenderer.invoke("open-media-folder"),

	// Projection updates
	onProjectionUpdate: (callback) => {
		ipcRenderer.on("projection-update", (_, ...args) => callback(...args));
	},

	// Remove listeners
	removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel),

	// File system operations (for importing media, songs, etc.)
	openFileDialog: (options) => ipcRenderer.invoke("open-file-dialog", options),
	saveFileDialog: (options) => ipcRenderer.invoke("save-file-dialog", options),

	// New: Microphone access
	requestMicrophoneAccess: () =>
		ipcRenderer.invoke("request-microphone-access"),

	// Platform info
	platform: process.platform,
	isElectron: true,
});

// Handle window controls
contextBridge.exposeInMainWorld("windowControls", {
	minimize: () => ipcRenderer.invoke("window-minimize"),
	maximize: () => ipcRenderer.invoke("window-maximize"),
	close: () => ipcRenderer.invoke("window-close"),
	isMaximized: () => ipcRenderer.invoke("window-is-maximized"),
});
