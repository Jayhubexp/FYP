import React from "react";
import { BibleVerse } from "../types/app";
import { Check } from "lucide-react";

interface VerseListProps {
	verses: BibleVerse[];
	selectedVerse: BibleVerse | null;
	onVerseSelect: (verse: BibleVerse) => void;
}

const VerseList: React.FC<VerseListProps> = ({
	verses,
	selectedVerse,
	onVerseSelect,
}) => {
	return (
		<div className='h-full flex flex-col'>
			<div className='p-6 border-b border-gray-700'>
				<h3 className='text-lg font-semibold text-gray-200'>
					Matched Verses {verses.length > 0 && `(${verses.length})`}
				</h3>
			</div>

			<div className='flex-1 overflow-y-auto'>
				{verses.length === 0 ? (
					<div className='p-6 text-center text-gray-400'>
						<p>No verses found. Try speaking or searching for a Bible verse.</p>
					</div>
				) : (
					<div className='p-4 space-y-3'>
						{verses.map((verse) => (
							<div
								key={verse.id}
								onClick={() => onVerseSelect(verse)}
								className={`p-4 rounded-lg border cursor-pointer transition-all hover:shadow-lg ${
									selectedVerse?.id === verse.id
										? "border-blue-500 bg-blue-900/20 shadow-blue-500/20"
										: "border-gray-600 bg-gray-800 hover:border-gray-500 hover:bg-gray-750"
								}`}>
								<div className='flex items-start justify-between'>
									<div className='flex-1'>
										<div className='flex items-center space-x-2 mb-2'>
											{/* THIS IS THE MODIFIED PART */}
											<span className='font-semibold text-blue-400'>
												{verse.book} {verse.chapter}:{verse.verse} (
												{verse.version})
											</span>
											{/* END OF MODIFIED PART */}
											{verse.confidence && (
												<span className='text-xs px-2 py-1 rounded bg-gray-700 text-gray-300'>
													{Math.round(verse.confidence * 100)}% match
												</span>
											)}
											{selectedVerse?.id === verse.id && (
												<Check size={16} className='text-green-400' />
											)}
										</div>
										<p className='text-gray-300 text-sm leading-relaxed'>
											"{verse.text}"
										</p>
									</div>
								</div>
							</div>
						))}
					</div>
				)}
			</div>
		</div>
	);
};

export default VerseList;
