# Bible Echo - AI-Powered Scripture Projection

A comprehensive desktop application for worship presentation with AI-powered Bible verse recognition, built with Electron and React.

## Features

### 🧠 AI-Powered Core
- **Real-time Speech Recognition**: Transcribes live sermon speech using advanced AI
- **Intelligent Verse Matching**: Uses NLP and fuzzy matching to identify Bible verses from partial quotes
- **Semantic Understanding**: Recognizes paraphrased and incomplete verse references
- **Offline Functionality**: Works without internet connection using local Bible database

### 🎵 Song & Media Management
- **Song Library**: Create, import, and manage worship songs with verse/chorus tagging
- **Media Support**: Handle videos, audio, images, and PowerPoint presentations
- **Theme System**: Custom backgrounds, fonts, and styling templates
- **Search & Organization**: Find content by title, keywords, or themes

### 📅 Service Planning
- **Schedule Builder**: Drag-and-drop worship service planning
- **Playlist Management**: Organize songs, verses, media, and slides
- **Quick Navigation**: Instant switching between service items
- **Live Control**: Preview/Live modes with black screen and logo options

### 🖥️ Professional Projection
- **Dual-Screen Support**: Separate operator and audience displays
- **Multi-Monitor**: Automatic detection and configuration of displays
- **Live Output Control**: Safe preview before going live
- **Custom Formatting**: Adjustable fonts, colors, and layouts

## Installation

### Prerequisites
- Node.js 16 or higher
- npm or yarn package manager

### Development Setup
```bash
# Clone the repository
git clone <repository-url>
cd bible-echo

# Install dependencies
npm install

# Run in development mode
npm run electron-dev
```

### Building for Production

#### Windows
```bash
# Build for Windows
npm run electron-build

# Create installer
npm run dist
```

#### Cross-platform
```bash
# Build for current platform
npm run electron-build

# Build for all platforms (requires additional setup)
npm run dist
```

## Usage

### Getting Started
1. Launch Bible Echo
2. Use F5 to toggle the projection window
3. Start with the "Main Control" tab for AI speech recognition
4. Build your service in the "Schedule" tab
5. Use Live Controls to manage projection output

### Keyboard Shortcuts
- **F5**: Toggle projection window
- **F11**: Toggle fullscreen
- **Space**: Go live
- **Escape**: Preview mode
- **B**: Black screen
- **L**: Show logo
- **Ctrl+N**: New schedule
- **Ctrl+O**: Open schedule
- **F12**: Developer tools

### AI Speech Recognition
1. Click "Start Listening" in the Main Control tab
2. Speak Bible verses during your sermon
3. The AI will automatically match and display verses
4. Use manual override if needed

### Song Management
1. Go to the "Songs" tab
2. Click "New Song" to create lyrics
3. Add verses, choruses, and other sections
4. Search and select songs for projection

### Media & Presentations
1. Use the "Media" tab to upload content
2. Support for images, videos, audio, and presentations
3. Drag media into your service schedule
4. Control playback during service

## Technical Architecture

### Frontend
- **React 18**: Modern UI framework
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first styling
- **Lucide React**: Icon system

### Desktop Framework
- **Electron**: Cross-platform desktop apps
- **Multi-window**: Separate control and projection windows
- **Native Integration**: File system, notifications, global shortcuts

### AI & Search
- **Fuzzy Matching**: Handles partial and misspelled quotes
- **Semantic Search**: Understands context and meaning
- **Local Database**: KJV Bible for offline operation
- **Confidence Scoring**: Ranks verse matches by relevance

### Data Management
- **Local Storage**: Persistent settings and content
- **JSON Database**: Lightweight Bible and song storage
- **Import/Export**: Backup and share configurations

## Configuration

### Display Setup
The app automatically detects multiple displays:
- Primary display: Control interface
- Secondary display: Projection output
- Configure in View menu or F5 shortcut

### Audio Settings
For speech recognition:
- Ensure microphone permissions
- Test audio levels in system settings
- Use quality microphone for best results

### Themes & Styling
- Built-in professional themes
- Custom color schemes
- Font and size adjustments
- Background image support

## Development

### Project Structure
```
bible-echo/
├── src/                    # React application source
│   ├── components/         # UI components
│   ├── services/          # Business logic
│   ├── hooks/             # React hooks
│   ├── types/             # TypeScript definitions
│   └── data/              # Static data
├── main.js                # Electron main process
├── preload.js             # Electron preload script
├── assets/                # Application assets
└── dist/                  # Built application
```

### Adding Features
1. Create React components in `src/components/`
2. Add business logic to `src/services/`
3. Update types in `src/types/app.ts`
4. Test in development mode
5. Build and test desktop version

### Electron Integration
- Use `electronAPI` for native features
- Handle IPC communication in preload script
- Manage windows in main process
- Follow security best practices

## Troubleshooting

### Common Issues
- **Projection not showing**: Check display configuration and F5 toggle
- **Audio not working**: Verify microphone permissions and system audio
- **Performance issues**: Close unnecessary applications, check system resources
- **Build errors**: Ensure Node.js version compatibility and clean install

### Support
- Check the built-in help system (F1)
- Review application logs in the Activity Log tab
- Ensure all dependencies are properly installed

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## Acknowledgments

- Built with modern web technologies
- Inspired by EasyWorship and similar presentation software
- Designed for churches and worship teams worldwide