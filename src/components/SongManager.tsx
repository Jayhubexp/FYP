import React, { useState } from "react";
import { Song, SongSection } from "../types/app";
import {
	Plus,
	Search,
	Music,
	Edit,
	Trash2,
	Play,
	ChevronLeft,
	ChevronRight,
} from "lucide-react";

interface SongManagerProps {
	songs: Song[];
	onSongCreate: (song: Omit<Song, "id" | "createdAt" | "updatedAt">) => void;
	onSongSelect: (song: Song) => void;
	currentVerseIndex?: number; // Add this prop
	goToNextVerse?: () => void; // Add this prop
	goToPrevVerse?: () => void; // Add this prop
	selectedSong?: Song | null; // Add this prop
}

const SongManager: React.FC<SongManagerProps> = ({
	songs,
	onSongCreate,
	onSongSelect,
	currentVerseIndex = 0,
	goToNextVerse,
	goToPrevVerse,
	selectedSong = null,
}) => {
	const [showCreateForm, setShowCreateForm] = useState(false);
	const [searchQuery, setSearchQuery] = useState("");
	const [newSong, setNewSong] = useState({
		title: "",
		artist: "",
		lyrics: [{ id: "1", type: "verse" as const, number: 1, text: "" }],
		themes: [] as string[],
	});

	const filteredSongs = songs.filter(
		(song) =>
			song.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
			song.artist?.toLowerCase().includes(searchQuery.toLowerCase()) ||
			song.themes.some((theme) =>
				theme.toLowerCase().includes(searchQuery.toLowerCase()),
			),
	);

	const handleCreateSong = () => {
		if (newSong.title.trim()) {
			onSongCreate({
				title: newSong.title,
				artist: newSong.artist || undefined,
				lyrics: newSong.lyrics.filter((section) => section.text.trim()),
				themes: newSong.themes,
			});
			setNewSong({
				title: "",
				artist: "",
				lyrics: [{ id: "1", type: "verse", number: 1, text: "" }],
				themes: [],
			});
			setShowCreateForm(false);
		}
	};

	const addLyricsSection = () => {
		const newSection: SongSection = {
			id: Date.now().toString(),
			type: "verse",
			number: newSong.lyrics.filter((s) => s.type === "verse").length + 1,
			text: "",
		};
		setNewSong((prev) => ({ ...prev, lyrics: [...prev.lyrics, newSection] }));
	};

	const updateLyricsSection = (id: string, updates: Partial<SongSection>) => {
		setNewSong((prev) => ({
			...prev,
			lyrics: prev.lyrics.map((section) =>
				section.id === id ? { ...section, ...updates } : section,
			),
		}));
	};

	const removeLyricsSection = (id: string) => {
		setNewSong((prev) => ({
			...prev,
			lyrics: prev.lyrics.filter((section) => section.id !== id),
		}));
	};

	return (
		<div className='h-full flex flex-col'>
			<div className='p-6 border-b border-gray-700'>
				<div className='flex items-center justify-between mb-4'>
					<h3 className='text-lg font-semibold text-gray-200'>Song Library</h3>
					<button
						onClick={() => setShowCreateForm(!showCreateForm)}
						className='flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors'>
						<Plus size={18} />
						<span>New Song</span>
					</button>
				</div>

				{/* Search */}
				<div className='relative'>
					<Search
						size={20}
						className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400'
					/>
					<input
						type='text'
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						placeholder='Search songs by title, artist, or theme...'
						className='w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500'
					/>
				</div>
			</div>

			<div className='flex-1 overflow-y-auto'>
				{/* Song Verse Navigation - Show when a song is selected */}
				{selectedSong && (
					<div className='p-4 border-b border-gray-700 bg-gray-800'>
						<div className='flex items-center justify-between mb-2'>
							<h4 className='font-medium text-gray-200'>
								{selectedSong.title}
							</h4>
							<div className='flex items-center space-x-2'>
								<button
									onClick={goToPrevVerse}
									disabled={currentVerseIndex === 0}
									className={`p-1 rounded ${
										currentVerseIndex === 0
											? "text-gray-600"
											: "text-blue-400 hover:text-blue-300"
									}`}>
									<ChevronLeft size={18} />
								</button>
								<span className='text-sm text-gray-400'>
									{currentVerseIndex + 1} of {selectedSong.lyrics.length}
								</span>
								<button
									onClick={goToNextVerse}
									disabled={
										currentVerseIndex === selectedSong.lyrics.length - 1
									}
									className={`p-1 rounded ${
										currentVerseIndex === selectedSong.lyrics.length - 1
											? "text-gray-600"
											: "text-blue-400 hover:text-blue-300"
									}`}>
									<ChevronRight size={18} />
								</button>
							</div>
						</div>

						<div className='text-gray-300 text-sm p-3 bg-gray-700 rounded'>
							{selectedSong.lyrics[currentVerseIndex]?.text}
						</div>
					</div>
				)}

				{/* Create Song Form */}
				{showCreateForm && (
					<div className='p-6 border-b border-gray-700 bg-gray-800'>
						<h4 className='text-md font-semibold text-gray-200 mb-4'>
							Create New Song
						</h4>

						<div className='space-y-4'>
							<div className='grid grid-cols-2 gap-4'>
								<input
									type='text'
									value={newSong.title}
									onChange={(e) =>
										setNewSong((prev) => ({ ...prev, title: e.target.value }))
									}
									placeholder='Song Title'
									className='p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500'
								/>
								<input
									type='text'
									value={newSong.artist}
									onChange={(e) =>
										setNewSong((prev) => ({ ...prev, artist: e.target.value }))
									}
									placeholder='Artist (optional)'
									className='p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500'
								/>
							</div>

							<div>
								<div className='flex items-center justify-between mb-2'>
									<label className='text-sm font-medium text-gray-300'>
										Lyrics Sections
									</label>
									<button
										onClick={addLyricsSection}
										className='text-blue-400 hover:text-blue-300 text-sm'>
										+ Add Section
									</button>
								</div>

								<div className='space-y-3'>
									{newSong.lyrics.map((section, index) => (
										<div
											key={section.id}
											className='border border-gray-600 rounded-lg p-3'>
											<div className='flex items-center justify-between mb-2'>
												<div className='flex items-center space-x-2'>
													<select
														value={section.type}
														onChange={(e) =>
															updateLyricsSection(section.id, {
																type: e.target.value as any,
															})
														}
														className='text-sm bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white'>
														<option value='verse'>Verse</option>
														<option value='chorus'>Chorus</option>
														<option value='bridge'>Bridge</option>
														<option value='intro'>Intro</option>
														<option value='outro'>Outro</option>
														<option value='tag'>Tag</option>
													</select>
													{section.type === "verse" && (
														<input
															type='number'
															value={section.number || 1}
															onChange={(e) =>
																updateLyricsSection(section.id, {
																	number: parseInt(e.target.value),
																})
															}
															className='w-16 text-sm bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white'
															min='1'
														/>
													)}
												</div>
												{newSong.lyrics.length > 1 && (
													<button
														onClick={() => removeLyricsSection(section.id)}
														className='text-red-400 hover:text-red-300'>
														<Trash2 size={16} />
													</button>
												)}
											</div>
											<textarea
												value={section.text}
												onChange={(e) =>
													updateLyricsSection(section.id, {
														text: e.target.value,
													})
												}
												placeholder='Enter lyrics...'
												rows={4}
												className='w-full p-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 resize-none'
											/>
										</div>
									))}
								</div>
							</div>

							<div className='flex justify-end space-x-3'>
								<button
									onClick={() => setShowCreateForm(false)}
									className='px-4 py-2 text-gray-400 hover:text-white transition-colors'>
									Cancel
								</button>
								<button
									onClick={handleCreateSong}
									className='px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors'>
									Create Song
								</button>
							</div>
						</div>
					</div>
				)}

				{/* Songs List */}
				<div className='p-4'>
					{filteredSongs.length === 0 ? (
						<div className='text-center text-gray-400 mt-8'>
							<Music size={48} className='mx-auto mb-4 opacity-50' />
							<p>No songs found.</p>
							<p className='text-sm mt-2'>
								Create your first song to get started.
							</p>
						</div>
					) : (
						<div className='space-y-3'>
							{filteredSongs.map((song) => (
								<div
									key={song.id}
									className={`p-4 bg-gray-800 border rounded-lg transition-colors ${
										selectedSong?.id === song.id
											? "border-blue-500"
											: "border-gray-700 hover:border-gray-600"
									}`}>
									<div className='flex items-start justify-between'>
										<div className='flex-1'>
											<div className='flex items-center space-x-2 mb-2'>
												<h4 className='font-semibold text-blue-400'>
													{song.title}
												</h4>
												{song.artist && (
													<span className='text-sm text-gray-400'>
														by {song.artist}
													</span>
												)}
											</div>

											<div className='text-sm text-gray-300 mb-2'>
												{song.lyrics.length} section
												{song.lyrics.length !== 1 ? "s" : ""}
											</div>

											{song.themes.length > 0 && (
												<div className='flex flex-wrap gap-1'>
													{song.themes.map((theme, index) => (
														<span
															key={index}
															className='text-xs px-2 py-1 bg-gray-700 text-gray-300 rounded'>
															{theme}
														</span>
													))}
												</div>
											)}
										</div>

										<div className='flex items-center space-x-2'>
											<button
												onClick={() => onSongSelect(song)}
												className='p-2 text-green-400 hover:text-green-300 transition-colors'
												title='Select for projection'>
												<Play size={18} />
											</button>
											<button
												className='p-2 text-gray-400 hover:text-white transition-colors'
												title='Edit song'>
												<Edit size={18} />
											</button>
										</div>
									</div>
								</div>
							))}
						</div>
					)}
				</div>
			</div>
		</div>
	);
};

export default SongManager;
