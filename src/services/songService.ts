import { Song, SongSection } from "../types/app";

class SongService {
	private songs: Song[] = [];

	initialize() {
		// Load sample songs
		this.songs = [
			{
				id: "1",
				title: "Amazing Grace",
				artist: "John Newton",
				lyrics: [
					{
						id: "1",
						type: "verse",
						number: 1,
						text: "Amazing grace how sweet the sound\nThat saved a wretch like me\nI once was lost, but now am found\nWas blind, but now I see",
					},
					{
						id: "2",
						type: "verse",
						number: 2,
						text: "Twas grace that taught my heart to fear\nAnd grace my fears relieved\nHow precious did that grace appear\nThe hour I first believed",
					},
					{
						id: "3",
						type: "verse",
						number: 3,
						text: "Through many dangers, toils and snares\nI have already come\nTis grace hath brought me safe thus far\nAnd grace will lead me home",
					},
				],
				themes: ["grace", "salvation", "traditional"],
				createdAt: new Date("2024-01-01"),
				updatedAt: new Date("2024-01-01"),
			},
			{
				id: "2",
				title: "How Great Thou Art",
				artist: "Carl Boberg",
				lyrics: [
					{
						id: "1",
						type: "verse",
						number: 1,
						text: "O Lord my God, when I in awesome wonder\nConsider all the worlds Thy hands have made\nI see the stars, I hear the rolling thunder\nThy power throughout the universe displayed",
					},
					{
						id: "2",
						type: "chorus",
						text: "Then sings my soul, my Savior God, to Thee\nHow great Thou art, how great Thou art\nThen sings my soul, my Savior God, to Thee\nHow great Thou art, how great Thou art",
					},
					{
						id: "3",
						type: "verse",
						number: 2,
						text: "When through the woods and forest glades I wander\nAnd hear the birds sing sweetly in the trees\nWhen I look down from lofty mountain grandeur\nAnd hear the brook and feel the gentle breeze",
					},
				],
				themes: ["worship", "nature", "praise"],
				createdAt: new Date("2024-01-02"),
				updatedAt: new Date("2024-01-02"),
			},
			{
				id: "3",
				title: "Blessed Be Your Name",
				artist: "Matt Redman",
				lyrics: [
					{
						id: "1",
						type: "verse",
						number: 1,
						text: "Blessed be Your name\nIn the land that is plentiful\nWhere Your streams of abundance flow\nBlessed be Your name",
					},
					{
						id: "2",
						type: "verse",
						number: 2,
						text: "Blessed be Your name\nWhen I'm found in the desert place\nThough I walk through the wilderness\nBlessed be Your name",
					},
					{
						id: "3",
						type: "chorus",
						text: "Every blessing You pour out I'll\nTurn back to praise\nWhen the darkness closes in, Lord\nStill I will say\nBlessed be the name of the Lord\nBlessed be Your name\nBlessed be the name of the Lord\nBlessed be Your glorious name",
					},
				],
				themes: ["praise", "worship", "contemporary"],
				createdAt: new Date("2024-01-03"),
				updatedAt: new Date("2024-01-03"),
			},
		];
	}

	getAllSongs(): Song[] {
		return this.songs;
	}

	createSong(songData: Omit<Song, "id" | "createdAt" | "updatedAt">): Song {
		const newSong: Song = {
			...songData,
			id: Date.now().toString(),
			createdAt: new Date(),
			updatedAt: new Date(),
		};

		this.songs.push(newSong);
		return newSong;
	}

	updateSong(id: string, updates: Partial<Song>): Song | null {
		const index = this.songs.findIndex((song) => song.id === id);
		if (index === -1) return null;

		this.songs[index] = {
			...this.songs[index],
			...updates,
			updatedAt: new Date(),
		};

		return this.songs[index];
	}

	deleteSong(id: string): boolean {
		const index = this.songs.findIndex((song) => song.id === id);
		if (index === -1) return false;

		this.songs.splice(index, 1);
		return true;
	}

	searchSongs(query: string): Song[] {
		const normalizedQuery = query.toLowerCase();
		return this.songs.filter(
			(song) =>
				song.title.toLowerCase().includes(normalizedQuery) ||
				song.artist?.toLowerCase().includes(normalizedQuery) ||
				song.themes.some((theme) =>
					theme.toLowerCase().includes(normalizedQuery),
				) ||
				song.lyrics.some((section) =>
					section.text.toLowerCase().includes(normalizedQuery),
				),
		);
	}

	// Verse management methods
	addVerse(songId: string, verse: Omit<SongSection, "id">): SongSection | null {
		const songIndex = this.songs.findIndex((song) => song.id === songId);
		if (songIndex === -1) return null;

		const newVerse: SongSection = {
			...verse,
			id: Date.now().toString(),
		};

		this.songs[songIndex].lyrics.push(newVerse);
		this.songs[songIndex].updatedAt = new Date();

		return newVerse;
	}

	updateVerse(
		songId: string,
		verseId: string,
		updates: Partial<SongSection>,
	): SongSection | null {
		const songIndex = this.songs.findIndex((song) => song.id === songId);
		if (songIndex === -1) return null;

		const verseIndex = this.songs[songIndex].lyrics.findIndex(
			(verse) => verse.id === verseId,
		);
		if (verseIndex === -1) return null;

		this.songs[songIndex].lyrics[verseIndex] = {
			...this.songs[songIndex].lyrics[verseIndex],
			...updates,
		};

		this.songs[songIndex].updatedAt = new Date();

		return this.songs[songIndex].lyrics[verseIndex];
	}

	deleteVerse(songId: string, verseId: string): boolean {
		const songIndex = this.songs.findIndex((song) => song.id === songId);
		if (songIndex === -1) return false;

		const verseIndex = this.songs[songIndex].lyrics.findIndex(
			(verse) => verse.id === verseId,
		);
		if (verseIndex === -1) return false;

		this.songs[songIndex].lyrics.splice(verseIndex, 1);
		this.songs[songIndex].updatedAt = new Date();

		return true;
	}

	// Reorder verses (for when verses are deleted and numbers need to be updated)
	reorderVerses(songId: string): boolean {
		const songIndex = this.songs.findIndex((song) => song.id === songId);
		if (songIndex === -1) return false;

		const verses = this.songs[songIndex].lyrics.filter(
			(verse) => verse.type === "verse",
		);

		// Renumber verses
		verses.forEach((verse, index) => {
			verse.number = index + 1;
		});

		this.songs[songIndex].updatedAt = new Date();

		return true;
	}

	getSongById(id: string): Song | null {
		return this.songs.find((song) => song.id === id) || null;
	}
}

export const songService = new SongService();
