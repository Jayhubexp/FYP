# Chapter 3: System Design

## 3.1 System Architecture Overview

The Bible Echo system follows a multi-tier architecture pattern with clear separation of concerns:

### 3.1.1 Architecture Pattern
- **Client-Server Architecture**: Frontend React application communicates with Python Flask backend
- **Desktop Application Framework**: Electron wrapper for cross-platform desktop deployment
- **Microservices Approach**: Modular service layer with specialized components
- **Event-Driven Communication**: IPC (Inter-Process Communication) for Electron integration

### 3.1.2 System Components
1. **Frontend Layer**: React-based user interface with TypeScript
2. **Backend Layer**: Python Flask server with AI processing capabilities
3. **Desktop Framework**: Electron main and renderer processes
4. **Data Layer**: SQLite database for Bible verses and local storage for application data
5. **AI Processing Layer**: Local OpenAI Whisper model for speech recognition

## 3.2 Frontend Architecture

### 3.2.1 Technology Stack
- **Framework**: React 18 with TypeScript for type safety
- **Styling**: Tailwind CSS for utility-first styling
- **Icons**: Lucide React for consistent iconography
- **Build Tool**: Vite for fast development and optimized builds

### 3.2.2 Component Architecture
```
src/
├── components/           # Reusable UI components
│   ├── ControlPanel.tsx     # Main control interface
│   ├── ProjectionDisplay.tsx # Projection output component
│   ├── VerseList.tsx        # Bible verse display
│   ├── SongManager.tsx      # Song library management
│   ├── MediaManager.tsx     # Media file management
│   ├── ScheduleManager.tsx  # Service planning
│   ├── ThemeManager.tsx     # Visual theme management
│   ├── LiveControls.tsx     # Live projection controls
│   ├── StatusIndicator.tsx  # System status display
│   ├── ManualSearch.tsx     # Manual verse search
│   ├── ProjectionSettings.tsx # Display configuration
│   └── ActivityLog.tsx      # System activity logging
├── services/            # Business logic layer
├── hooks/              # Custom React hooks
└── types/              # TypeScript type definitions
```

### 3.2.3 State Management
- **Local State**: React useState for component-level state
- **Global State**: Centralized AppState interface in App.tsx
- **Service Layer**: Singleton services for data management
- **Event Handling**: Custom hooks for Electron integration

### 3.2.4 Service Layer Design
```typescript
// Core Services Architecture
├── bibleSearchService.ts    # Bible verse search and retrieval
├── speechRecognitionService.ts # Audio recording and processing
├── transcriptionService.ts  # Backend communication for AI
├── songService.ts          # Song library management
├── mediaService.ts         # Media file handling
├── scheduleService.ts      # Service planning
├── themeService.ts         # Visual theme management
└── cloudinaryService.ts    # Cloud media storage
```

## 3.3 Backend Architecture

### 3.3.1 Technology Stack
- **Framework**: Flask (Python) for RESTful API
- **AI Engine**: OpenAI Whisper (whisper-tiny.en model) for speech recognition
- **Database**: SQLite for Bible verse storage
- **CORS**: Flask-CORS for cross-origin requests
- **Audio Processing**: Native Whisper audio handling

### 3.3.2 API Endpoints Design
```python
# Core API Endpoints
POST /api/transcribe        # Audio transcription with verse detection
GET  /api/bible-search     # Manual verse search
GET  /health               # System health check
```

### 3.3.3 AI Processing Pipeline
1. **Audio Reception**: Receive WebM audio from frontend
2. **Format Validation**: Check file size and format
3. **Whisper Processing**: Local transcription using whisper-tiny.en
4. **Text Analysis**: Rule-based Bible reference detection
5. **Database Query**: Verse lookup in SQLite database
6. **Response Formation**: Structured JSON response with verses

### 3.3.4 Bible Reference Detection Algorithm
```python
# Rule-based parsing system
1. Text preprocessing and normalization
2. Book name recognition (66 Bible books + abbreviations)
3. Chapter and verse extraction using regex patterns
4. Confidence scoring based on context
5. Database lookup for exact verse text
```

## 3.4 Desktop Framework Architecture

### 3.4.1 Electron Process Model
- **Main Process**: Application lifecycle, window management, system integration
- **Renderer Process**: React application running in Chromium
- **Preload Script**: Secure IPC bridge between main and renderer

### 3.4.2 Window Management
```javascript
// Multi-window architecture
├── Main Window (Control Interface)
│   ├── Primary display targeting
│   ├── Full application interface
│   └── Development tools access
└── Projection Window (Output Display)
    ├── Secondary display targeting
    ├── Fullscreen presentation mode
    └── Content-only display
```

### 3.4.3 IPC Communication Design
```typescript
// Secure IPC handlers
├── Display Management
│   ├── get-displays
│   ├── create-projection-window
│   └── toggle-projection-window
├── Content Control
│   ├── update-projection-content
│   └── projection-control
├── Media Operations
│   ├── save-media-file
│   ├── delete-media-file
│   └── open-media-folder
└── System Integration
    ├── request-microphone-access
    ├── upload-audio
    └── show-notification
```

## 3.5 Database Design

### 3.5.1 Bible Database Schema
```sql
-- Unified Bible storage
CREATE TABLE bible (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    version TEXT NOT NULL,        -- Bible translation (KJV, NIV, etc.)
    book TEXT NOT NULL,           -- Book name (Genesis, Matthew, etc.)
    chapter INTEGER NOT NULL,     -- Chapter number
    verse INTEGER NOT NULL,       -- Verse number
    text TEXT NOT NULL            -- Verse content
);
```

### 3.5.2 Data Sources
- **Primary Source**: KJV.db with tables KJV_verses and KJV_books
- **Processing**: setup_bible_db.py for data migration and normalization
- **Access Pattern**: Read-only access for verse retrieval

## 3.6 User Interface Design

### 3.6.1 Design Principles
- **Dark Theme**: Professional appearance suitable for worship environments
- **Responsive Layout**: Adaptive design for different screen sizes
- **Accessibility**: Keyboard shortcuts and clear visual hierarchy
- **Real-time Feedback**: Live status indicators and activity logging

### 3.6.2 Interface Layout
```
┌─────────────────────────────────────────────────────────┐
│ Header: App Title | Status | Live Controls | Projection  │
├─────────────────────────────────────────────────────────┤
│ Tabs: Main | Songs | Media | Schedule | Themes | Logs   │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ Tab Content Area:                                       │
│ - Main Control: Speech recognition and verse search     │
│ - Songs: Library management and lyric editing           │
│ - Media: Cloud storage and file management              │
│ - Schedule: Service planning and playlist creation      │
│ - Themes: Visual customization and presets             │
│ - Settings: Projection configuration                    │
│ - Logs: System activity and debugging                  │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 3.6.3 Projection Display Design
- **Fullscreen Output**: Dedicated projection window for secondary displays
- **Content Types**: Bible verses, song lyrics, images, videos
- **Live Controls**: Preview/Live modes, black screen, logo display
- **Visual Customization**: Fonts, colors, backgrounds, effects

## 3.7 Security and Performance Considerations

### 3.7.1 Security Measures
- **Local Processing**: Speech recognition runs entirely offline
- **Secure IPC**: Context isolation and preload script security
- **File Validation**: Media upload size and type restrictions
- **No External APIs**: Bible data stored locally for privacy

### 3.7.2 Performance Optimizations
- **Lazy Loading**: Components loaded on demand
- **Efficient Rendering**: React optimization patterns
- **Audio Chunking**: 7-second audio segments for real-time processing
- **GPU Acceleration**: Optional CUDA support for faster transcription
- **Memory Management**: Proper cleanup of audio streams and resources

## 3.8 Integration Points

### 3.8.1 External Services
- **Cloudinary**: Cloud media storage and optimization
- **Bible API**: Fallback for additional verse translations
- **System Integration**: Native OS features through Electron

### 3.8.2 Data Flow Architecture
```
User Speech → Microphone → MediaRecorder → Audio Chunks → 
Python Backend → Whisper AI → Text Analysis → Bible Database → 
Verse Results → Frontend → UI Update → Projection Display
```

## 3.9 Scalability and Extensibility

### 3.9.1 Modular Design
- **Service-Oriented**: Each feature implemented as independent service
- **Plugin Architecture**: Easy addition of new content types
- **Theme System**: Customizable visual presentations
- **Configuration Management**: Flexible settings system

### 3.9.2 Future Enhancement Points
- **Multiple Bible Translations**: Support for additional versions
- **Cloud Synchronization**: Multi-device schedule sharing
- **Advanced AI**: Improved verse detection algorithms
- **Presentation Import**: PowerPoint and PDF support
- **Network Projection**: Remote display capabilities