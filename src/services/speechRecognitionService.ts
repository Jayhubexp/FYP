import { transcriptionService } from "./transcriptionService";
import type { TranscriptionResult } from "../types/app";

class SpeechRecognitionService {
    private isListening = false;
    private mediaStream: MediaStream | null = null;
    private mediaRecorder: MediaRecorder | null = null;
    private callback: ((result: TranscriptionResult) => void) | null = null;

    async startListening(
        callback: (result: TranscriptionResult) => void,
    ): Promise<void> {
        if (this.isListening) {
            console.warn("Already listening. Stop first.");
            return;
        }

        this.isListening = true;
        this.callback = callback;

        try {
            await this.startMediaRecorder();
        } catch (err) {
            console.error("Could not start listening:", err);
            this.stopListening();
            throw err;
        }
    }

    private async startMediaRecorder(): Promise<void> {
        this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });

        const mimeType = "audio/webm";
        this.mediaRecorder = new MediaRecorder(this.mediaStream, { mimeType });

        this.mediaRecorder.ondataavailable = async (event) => {
            // **THE FIX IS HERE:**
            // We ensure we are still in a "listening" state and that the data blob
            // is valid and has a size greater than zero before processing it.
            if (event.data && event.data.size > 0 && this.isListening) {
                const audioBlob = new Blob([event.data], { type: mimeType });

                try {
                    const result = await transcriptionService.transcribe(audioBlob);
                    if (result && result.text.trim() && this.callback) {
                        this.callback(result);
                    }
                } catch (err) {
                    console.error("Transcription failed for audio chunk:", err);
                }
            }
        };

        // This event ensures that any final audio in the buffer is processed
        // when the recorder is explicitly stopped.
        this.mediaRecorder.onstop = () => {
            console.log("MediaRecorder stopped cleanly.");
        };

        // Record audio in 5-second intervals.
        this.mediaRecorder.start(5000);
        console.log("MediaRecorder started successfully.");
    }

    stopListening(): void {
        if (!this.isListening) {
            return;
        }

        this.isListening = false;
        this.callback = null;

        if (this.mediaRecorder && this.mediaRecorder.state === "recording") {
            // This will trigger the ondataavailable event one last time for any buffered audio
            this.mediaRecorder.stop();
        }

        if (this.mediaStream) {
            this.mediaStream.getTracks().forEach((track) => track.stop());
        }

        this.mediaRecorder = null;
        this.mediaStream = null;
    }

    isCurrentlyListening(): boolean {
        return this.isListening;
    }
}

export const speechRecognitionService = new SpeechRecognitionService();