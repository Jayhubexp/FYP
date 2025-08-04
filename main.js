import {
	app,
	BrowserWindow,
	Menu,
	ipcMain,
	screen,
	globalShortcut,
	Notification,
} from "electron";
import path from "path";
import { fileURLToPath } from "url";

// Fix for ES modules: recreate __dirname and __filename
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isDev = process.env.NODE_ENV === "development";
let mainWindow;
let projectionWindow;

function createMainWindow() {
	// Get primary display dimensions
	const primaryDisplay = screen.getPrimaryDisplay();
	const { width, height } = primaryDisplay.workAreaSize;

	mainWindow = new BrowserWindow({
		width: Math.floor(width * 0.8),
		height: Math.floor(height * 0.9),
		minWidth: 1200,
		minHeight: 800,
		webPreferences: {
			nodeIntegration: false,
			contextIsolation: true,
			// preload path pointing to the root directory
			preload: path.join(__dirname, isDev ? "preload.js" : "dist/preload.js"),
		},
		icon: path.join(__dirname, "assets", "icon.png"),
		title: "Bible Echo - AI-Powered Scripture Projection",
		show: false,
		titleBarStyle: "default",
	});

	// Load the app with error handling
	if (isDev) {
		mainWindow.loadURL("http://localhost:5173").catch((err) => {
			console.error("Failed to load dev server URL:", err);
			// Fallback to loading the built file
			mainWindow
				.loadFile(path.join(__dirname, "dist", "index.html"))
				.catch((fallbackErr) => {
					console.error("Failed to load fallback file:", fallbackErr);
				});
		});
		mainWindow.webContents.openDevTools();
	} else {
		mainWindow
			.loadFile(path.join(__dirname, "dist", "index.html"))
			.catch((err) => {
				console.error("Failed to load main window file:", err);
			});
	}

	mainWindow.once("ready-to-show", () => {
		mainWindow.show();
		if (isDev) {
			mainWindow.focus();
		}
	});

	mainWindow.on("closed", () => {
		mainWindow = null;
		if (projectionWindow) {
			projectionWindow.close();
		}
	});
}

function createProjectionWindow() {
	const displays = screen.getAllDisplays();
	let targetDisplay = displays[0]; // Default to primary display

	// If multiple displays, use the second one for projection
	if (displays.length > 1) {
		targetDisplay = displays[1];
	}

	const { x, y, width, height } = targetDisplay.bounds;

	projectionWindow = new BrowserWindow({
		x: x,
		y: y,
		width: width,
		height: height,
		fullscreen: true,
		frame: false,
		alwaysOnTop: true,
		webPreferences: {
			nodeIntegration: false,
			contextIsolation: true,
			// Updated preload path - now pointing to the root directory
			preload: path.join(__dirname, isDev ? "preload.js" : "dist/preload.js"),
		},
		show: false,
		backgroundColor: "#000000",
	});

	// Load the projection view with error handling
	if (isDev) {
		projectionWindow
			.loadURL("http://localhost:5173#projection")
			.catch((err) => {
				console.error("Failed to load projection dev server URL:", err);
				// Fallback to loading the built file
				projectionWindow
					.loadFile(path.join(__dirname, "dist", "index.html"), {
						hash: "projection",
					})
					.catch((fallbackErr) => {
						console.error(
							"Failed to load projection fallback file:",
							fallbackErr,
						);
					});
			});
	} else {
		projectionWindow
			.loadFile(path.join(__dirname, "dist", "index.html"), {
				hash: "projection",
			})
			.catch((err) => {
				console.error("Failed to load projection window file:", err);
			});
	}

	projectionWindow.once("ready-to-show", () => {
		projectionWindow.show();
	});

	projectionWindow.on("closed", () => {
		projectionWindow = null;
	});

	return projectionWindow;
}

// App event handlers
app.whenReady().then(() => {
	try {
		createMainWindow();

		// Create application menu
		const template = [
			{
				label: "File",
				submenu: [
					{
						label: "New Schedule",
						accelerator: "CmdOrCtrl+N",
						click: () => {
							if (mainWindow) {
								mainWindow.webContents.send("menu-action", "new-schedule");
							}
						},
					},
					{
						label: "Open Schedule",
						accelerator: "CmdOrCtrl+O",
						click: () => {
							if (mainWindow) {
								mainWindow.webContents.send("menu-action", "open-schedule");
							}
						},
					},
					{ type: "separator" },
					{
						label: "Exit",
						accelerator: process.platform === "darwin" ? "Cmd+Q" : "Ctrl+Q",
						click: () => {
							app.quit();
						},
					},
				],
			},
			{
				label: "View",
				submenu: [
					{
						label: "Toggle Projection Window",
						accelerator: "F5",
						click: () => {
							if (projectionWindow) {
								projectionWindow.close();
							} else {
								createProjectionWindow();
							}
						},
					},
					{
						label: "Toggle Fullscreen",
						accelerator: "F11",
						click: () => {
							if (mainWindow) {
								const isFullScreen = mainWindow.isFullScreen();
								mainWindow.setFullScreen(!isFullScreen);
							}
						},
					},
					{ type: "separator" },
					{
						label: "Reload",
						accelerator: "CmdOrCtrl+R",
						click: () => {
							if (mainWindow) {
								mainWindow.reload();
							}
						},
					},
					{
						label: "Toggle Developer Tools",
						accelerator: "F12",
						click: () => {
							if (mainWindow) {
								mainWindow.webContents.toggleDevTools();
							}
						},
					},
				],
			},
			{
				label: "Projection",
				submenu: [
					{
						label: "Go Live",
						accelerator: "Space",
						click: () => {
							if (mainWindow) {
								mainWindow.webContents.send("projection-control", "live");
							}
						},
					},
					{
						label: "Preview Mode",
						accelerator: "Escape",
						click: () => {
							if (mainWindow) {
								mainWindow.webContents.send("projection-control", "preview");
							}
						},
					},
					{
						label: "Black Screen",
						accelerator: "B",
						click: () => {
							if (mainWindow) {
								mainWindow.webContents.send("projection-control", "black");
							}
						},
					},
					{
						label: "Show Logo",
						accelerator: "L",
						click: () => {
							if (mainWindow) {
								mainWindow.webContents.send("projection-control", "logo");
							}
						},
					},
				],
			},
			{
				label: "Help",
				submenu: [
					{
						label: "About Bible Echo",
						click: () => {
							if (mainWindow) {
								mainWindow.webContents.send("menu-action", "about");
							}
						},
					},
					{
						label: "User Guide",
						click: () => {
							if (mainWindow) {
								mainWindow.webContents.send("menu-action", "help");
							}
						},
					},
				],
			},
		];

		const menu = Menu.buildFromTemplate(template);
		Menu.setApplicationMenu(menu);

		// Register global shortcuts with error handling
		try {
			// Use platform-specific key codes for arrow keys
			globalShortcut.register("F1", () => {
				if (mainWindow) {
					mainWindow.webContents.send("global-shortcut", "help");
				}
			});

			// Fixed arrow key shortcuts
			globalShortcut.register("Down", () => {
				if (mainWindow) {
					mainWindow.webContents.send("navigate-verse", "next");
				}
			});

			globalShortcut.register("Up", () => {
				if (mainWindow) {
					mainWindow.webContents.send("navigate-verse", "prev");
				}
			});

			globalShortcut.register("F5", () => {
				if (projectionWindow) {
					projectionWindow.close();
				} else {
					createProjectionWindow();
				}
			});
		} catch (err) {
			console.error("Failed to register global shortcuts:", err);
		}

		app.on("activate", () => {
			if (BrowserWindow.getAllWindows().length === 0) {
				createMainWindow();
			}
		});
	} catch (err) {
		console.error("Error during app initialization:", err);
	}
});

app.on("window-all-closed", () => {
	if (process.platform !== "darwin") {
		app.quit();
	}
});

app.on("will-quit", () => {
	// Unregister all shortcuts
	try {
		globalShortcut.unregisterAll();
	} catch (err) {
		console.error("Error unregistering shortcuts:", err);
	}
});

// IPC handlers with proper error handling
ipcMain.handle("get-displays", () => {
	try {
		return screen.getAllDisplays().map((display) => ({
			id: display.id,
			bounds: display.bounds,
			workArea: display.workArea,
			scaleFactor: display.scaleFactor,
			rotation: display.rotation,
			internal: display.internal,
		}));
	} catch (err) {
		console.error("Error getting displays:", err);
		return [];
	}
});

ipcMain.handle("create-projection-window", () => {
	try {
		if (!projectionWindow) {
			createProjectionWindow();
			return true;
		}
		return false;
	} catch (err) {
		console.error("Error creating projection window:", err);
		return false;
	}
});

ipcMain.handle("close-projection-window", () => {
	try {
		if (projectionWindow) {
			projectionWindow.close();
			return true;
		}
		return false;
	} catch (err) {
		console.error("Error closing projection window:", err);
		return false;
	}
});

ipcMain.handle("toggle-projection-window", () => {
	try {
		if (projectionWindow) {
			projectionWindow.close();
			return false;
		} else {
			createProjectionWindow();
			return true;
		}
	} catch (err) {
		console.error("Error toggling projection window:", err);
		return false;
	}
});

ipcMain.handle("update-projection-content", (event, content) => {
	try {
		if (projectionWindow) {
			projectionWindow.webContents.send("projection-update", content);
			return true;
		}
		return false;
	} catch (err) {
		console.error("Error updating projection content:", err);
		return false;
	}
});

ipcMain.handle("get-app-version", () => {
	try {
		return app.getVersion();
	} catch (err) {
		console.error("Error getting app version:", err);
		return "Unknown";
	}
});

ipcMain.handle("show-notification", (event, title, body) => {
	try {
		if (Notification.isSupported()) {
			const notification = new Notification({
				title: title,
				body: body,
				icon: path.join(__dirname, "assets", "icon.png"),
			});
			notification.show();
			return true;
		}
		return false;
	} catch (err) {
		console.error("Error showing notification:", err);
		return false;
	}
});

// import {
// 	app,
// 	BrowserWindow,
// 	Menu,
// 	ipcMain,
// 	screen,
// 	globalShortcut,
// 	Notification,
// } from "electron";
// import path from "path";
// import { fileURLToPath } from "url";

// // Fix for ES modules: recreate __dirname and __filename
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// const isDev = process.env.NODE_ENV === "development";
// let mainWindow;
// let projectionWindow;

// function createMainWindow() {
// 	// Get primary display dimensions
// 	const primaryDisplay = screen.getPrimaryDisplay();
// 	const { width, height } = primaryDisplay.workAreaSize;

// 	mainWindow = new BrowserWindow({
// 		width: Math.floor(width * 0.8),
// 		height: Math.floor(height * 0.9),
// 		minWidth: 1200,
// 		minHeight: 800,
// 		webPreferences: {
// 			nodeIntegration: false,
// 			contextIsolation: true,
// 			preload: path.join(__dirname, isDev ? "src" : "dist", "preload.js"),
// 		},
// 		icon: path.join(__dirname, "assets", "icon.png"),
// 		title: "Bible Echo - AI-Powered Scripture Projection",
// 		show: false,
// 		titleBarStyle: "default",
// 	});

// 	// Load the app
// 	if (isDev) {
// 		mainWindow.loadURL("http://localhost:5173");
// 		mainWindow.webContents.openDevTools();
// 	} else {
// 		mainWindow.loadFile(path.join(__dirname, "dist", "index.html"));
// 	}

// 	mainWindow.once("ready-to-show", () => {
// 		mainWindow.show();
// 		if (isDev) {
// 			mainWindow.focus();
// 		}
// 	});

// 	mainWindow.on("closed", () => {
// 		mainWindow = null;
// 		if (projectionWindow) {
// 			projectionWindow.close();
// 		}
// 	});
// }

// function createProjectionWindow() {
// 	const displays = screen.getAllDisplays();
// 	let targetDisplay = displays[0]; // Default to primary display

// 	// If multiple displays, use the second one for projection
// 	if (displays.length > 1) {
// 		targetDisplay = displays[1];
// 	}

// 	const { x, y, width, height } = targetDisplay.bounds;

// 	projectionWindow = new BrowserWindow({
// 		x: x,
// 		y: y,
// 		width: width,
// 		height: height,
// 		fullscreen: true,
// 		frame: false,
// 		alwaysOnTop: true,
// 		webPreferences: {
// 			nodeIntegration: false,
// 			contextIsolation: true,
// 			preload: path.join(__dirname, isDev ? "src" : "dist", "preload.js"),
// 		},
// 		show: false,
// 		backgroundColor: "#000000",
// 	});

// 	// Load the projection view
// 	if (isDev) {
// 		projectionWindow.loadURL("http://localhost:5173#projection");
// 	} else {
// 		projectionWindow.loadFile(path.join(__dirname, "dist", "index.html"), {
// 			hash: "projection",
// 		});
// 	}

// 	projectionWindow.once("ready-to-show", () => {
// 		projectionWindow.show();
// 	});

// 	projectionWindow.on("closed", () => {
// 		projectionWindow = null;
// 	});

// 	return projectionWindow;
// }

// // App event handlers
// app.whenReady().then(() => {
// 	createMainWindow();

// 	// Create application menu
// 	const template = [
// 		{
// 			label: "File",
// 			submenu: [
// 				{
// 					label: "New Schedule",
// 					accelerator: "CmdOrCtrl+N",
// 					click: () => {
// 						mainWindow.webContents.send("menu-action", "new-schedule");
// 					},
// 				},
// 				{
// 					label: "Open Schedule",
// 					accelerator: "CmdOrCtrl+O",
// 					click: () => {
// 						mainWindow.webContents.send("menu-action", "open-schedule");
// 					},
// 				},
// 				{ type: "separator" },
// 				{
// 					label: "Exit",
// 					accelerator: process.platform === "darwin" ? "Cmd+Q" : "Ctrl+Q",
// 					click: () => {
// 						app.quit();
// 					},
// 				},
// 			],
// 		},
// 		{
// 			label: "View",
// 			submenu: [
// 				{
// 					label: "Toggle Projection Window",
// 					accelerator: "F5",
// 					click: () => {
// 						if (projectionWindow) {
// 							projectionWindow.close();
// 						} else {
// 							createProjectionWindow();
// 						}
// 					},
// 				},
// 				{
// 					label: "Toggle Fullscreen",
// 					accelerator: "F11",
// 					click: () => {
// 						const isFullScreen = mainWindow.isFullScreen();
// 						mainWindow.setFullScreen(!isFullScreen);
// 					},
// 				},
// 				{ type: "separator" },
// 				{
// 					label: "Reload",
// 					accelerator: "CmdOrCtrl+R",
// 					click: () => {
// 						mainWindow.reload();
// 					},
// 				},
// 				{
// 					label: "Toggle Developer Tools",
// 					accelerator: "F12",
// 					click: () => {
// 						mainWindow.webContents.toggleDevTools();
// 					},
// 				},
// 			],
// 		},
// 		{
// 			label: "Projection",
// 			submenu: [
// 				{
// 					label: "Go Live",
// 					accelerator: "Space",
// 					click: () => {
// 						mainWindow.webContents.send("projection-control", "live");
// 					},
// 				},
// 				{
// 					label: "Preview Mode",
// 					accelerator: "Escape",
// 					click: () => {
// 						mainWindow.webContents.send("projection-control", "preview");
// 					},
// 				},
// 				{
// 					label: "Black Screen",
// 					accelerator: "B",
// 					click: () => {
// 						mainWindow.webContents.send("projection-control", "black");
// 					},
// 				},
// 				{
// 					label: "Show Logo",
// 					accelerator: "L",
// 					click: () => {
// 						mainWindow.webContents.send("projection-control", "logo");
// 					},
// 				},
// 			],
// 		},
// 		{
// 			label: "Help",
// 			submenu: [
// 				{
// 					label: "About Bible Echo",
// 					click: () => {
// 						mainWindow.webContents.send("menu-action", "about");
// 					},
// 				},
// 				{
// 					label: "User Guide",
// 					click: () => {
// 						mainWindow.webContents.send("menu-action", "help");
// 					},
// 				},
// 			],
// 		},
// 	];

// 	const menu = Menu.buildFromTemplate(template);
// 	Menu.setApplicationMenu(menu);

// 	// Register global shortcuts
// 	globalShortcut.register("F1", () => {
// 		if (mainWindow) {
// 			mainWindow.webContents.send("global-shortcut", "help");
// 		}
// 	});

// 	// Verse navigation shortcuts
// 	globalShortcut.register("ArrowDown", () => {
// 		if (mainWindow) {
// 			mainWindow.webContents.send("navigate-verse", "next");
// 		}
// 	});

// 	globalShortcut.register("ArrowUp", () => {
// 		if (mainWindow) {
// 			mainWindow.webContents.send("navigate-verse", "prev");
// 		}
// 	});

// 	globalShortcut.register("F5", () => {
// 		if (projectionWindow) {
// 			projectionWindow.close();
// 		} else {
// 			createProjectionWindow();
// 		}
// 	});

// 	app.on("activate", () => {
// 		if (BrowserWindow.getAllWindows().length === 0) {
// 			createMainWindow();
// 		}
// 	});
// });

// app.on("window-all-closed", () => {
// 	if (process.platform !== "darwin") {
// 		app.quit();
// 	}
// });

// app.on("will-quit", () => {
// 	// Unregister all shortcuts
// 	globalShortcut.unregisterAll();
// });

// // IPC handlers
// ipcMain.handle("get-displays", () => {
// 	return screen.getAllDisplays().map((display) => ({
// 		id: display.id,
// 		bounds: display.bounds,
// 		workArea: display.workArea,
// 		scaleFactor: display.scaleFactor,
// 		rotation: display.rotation,
// 		internal: display.internal,
// 	}));
// });

// ipcMain.handle("create-projection-window", () => {
// 	if (!projectionWindow) {
// 		createProjectionWindow();
// 		return true;
// 	}
// 	return false;
// });

// ipcMain.handle("close-projection-window", () => {
// 	if (projectionWindow) {
// 		projectionWindow.close();
// 		return true;
// 	}
// 	return false;
// });

// ipcMain.handle("toggle-projection-window", () => {
// 	if (projectionWindow) {
// 		projectionWindow.close();
// 		return false;
// 	} else {
// 		createProjectionWindow();
// 		return true;
// 	}
// });

// ipcMain.handle("update-projection-content", (event, content) => {
// 	if (projectionWindow) {
// 		projectionWindow.webContents.send("projection-update", content);
// 	}
// });

// ipcMain.handle("get-app-version", () => {
// 	return app.getVersion();
// });

// ipcMain.handle("show-notification", (event, title, body) => {
// 	if (Notification.isSupported()) {
// 		new Notification({
// 			title: title,
// 			body: body,
// 			icon: path.join(__dirname, "assets", "icon.png"),
// 		}).show();
// 	}
// });
