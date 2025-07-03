
'use server';
/**
 * @fileOverview A server-side Text-to-Speech (TTS) flow using Genkit and Gemini.
 * This flow generates high-quality, consistent audio for the application's voice features.
 *
 * - textToSpeech - A function that handles the TTS process.
 * - TextToSpeechInput - The input type for the textToSpeech function.
 * - TextToSpeechOutput - The return type for the textToSpeech function.
 */

import { aiForTTS } from '@/ai/genkit';
import { z } from 'zod';
import wav from 'wav';

const TextToSpeechInputSchema = z.object({
  text: z.string().describe("The text to convert to speech."),
  voice: z.enum(['gojo', 'holo']).describe("The selected voice persona ('gojo' for male, 'holo' for female)."),
});
export type TextToSpeechInput = z.infer<typeof TextToSpeechInputSchema>;

const TextToSpeechOutputSchema = z.object({
  audioDataUri: z.string().describe("The generated audio as a data URI in WAV format."),
});
export type TextToSpeechOutput = z.infer<typeof TextToSpeechOutputSchema>;

// This function is exported and called from the client-side `useTTS` hook.
export async function textToSpeech(input: TextToSpeechInput): Promise<TextToSpeechOutput> {
  return textToSpeechFlow(input);
}

// Converts raw PCM audio buffer to a Base64 encoded WAV string.
async function toWav(pcmData: Buffer): Promise<string> {
  return new Promise((resolve, reject) => {
    const writer = new wav.Writer({
      channels: 1,
      sampleRate: 24000,
      bitDepth: 16,
    });

    const buffers: Buffer[] = [];
    writer.on('data', (chunk: Buffer) => buffers.push(chunk));
    writer.on('end', () => resolve(Buffer.concat(buffers).toString('base64')));
    writer.on('error', reject);

    writer.write(pcmData);
    writer.end();
  });
}

// The main Genkit flow definition.
const textToSpeechFlow = aiForTTS.defineFlow(
  {
    name: 'textToSpeechFlow',
    inputSchema: TextToSpeechInputSchema,
    outputSchema: TextToSpeechOutputSchema,
  },
  async (input) => {
    const { text, voice } = input;
    
    // Choose the voice based on the input preference.
    // 'Algenib' is a male voice for Gojo, 'Achernar' is a female voice for Holo.
    const voiceName = voice === 'gojo' ? 'Algenib' : 'Achernar';

    try {
      const { media } = await aiForTTS.generate({
        model: 'googleai/gemini-2.5-flash-preview-tts',
        prompt: text,
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: voiceName },
            },
          },
        },
      });

      if (!media?.url) {
        throw new Error('No audio media was returned from the AI model.');
      }

      // The returned audio is raw PCM data in a data URI. We need to extract and convert it.
      const pcmData = Buffer.from(media.url.substring(media.url.indexOf(',') + 1), 'base64');
      const wavBase64 = await toWav(pcmData);

      return {
        audioDataUri: 'data:audio/wav;base64,' + wavBase64,
      };

    } catch (error: any) {
        console.error(`[AI Flow Error - TTS] Failed to generate audio for voice "${voice}":`, error);
        let errorMessage = "Failed to generate audio due to an unexpected error.";
        if (error.message.includes("API key") || error.message.includes("GOOGLE_API_KEY_TTS")) {
            errorMessage = "TTS: API key issue. Check GOOGLE_API_KEY_TTS and ensure billing is enabled for the project.";
        } else if (error.message.toLowerCase().includes("quota")) {
            errorMessage = "TTS: Quota exceeded. Please check your Google Cloud project quotas.";
        }
        throw new Error(errorMessage);
    }
  }
);
