
'use server';
/**
 * @fileOverview A Genkit flow for high-quality, consistent text-to-speech synthesis.
 * This flow takes text and a voice preference ('gojo' or 'holo') and returns playable audio data.
 * It replaces the unreliable browser-native SpeechSynthesis API.
 *
 * - generateSpeech - A function that handles the TTS process.
 * - GenerateSpeechInput - The input type for this function.
 * - GenerateSpeechOutput - The return type for this function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import wav from 'wav';

// Define Zod schemas for input and output validation
const GenerateSpeechInputSchema = z.object({
  text: z.string().describe('The text to be converted to speech.'),
  voice: z.enum(['gojo', 'holo']).default('holo').describe("The desired voice persona: 'gojo' for a male voice, 'holo' for a female voice."),
});
export type GenerateSpeechInput = z.infer<typeof GenerateSpeechInputSchema>;

const GenerateSpeechOutputSchema = z.object({
  audioDataUri: z.string().describe('The generated audio in WAV format, encoded as a base64 data URI.'),
});
export type GenerateSpeechOutput = z.infer<typeof GenerateSpeechOutputSchema>;


/**
 * Converts raw PCM audio buffer to a base64 encoded WAV string.
 * @param pcmData The raw PCM audio data from the TTS model.
 * @returns A promise that resolves to the base64 encoded WAV string.
 */
async function toWav(pcmData: Buffer): Promise<string> {
  return new Promise((resolve, reject) => {
    const writer = new wav.Writer({
      channels: 1,
      sampleRate: 24000,
      bitDepth: 16,
    });
    const buffers: Buffer[] = [];
    writer.on('data', (chunk) => buffers.push(chunk));
    writer.on('end', () => resolve(Buffer.concat(buffers).toString('base64')));
    writer.on('error', reject);
    writer.write(pcmData);
    writer.end();
  });
}

// Define the main Genkit flow for TTS
const generateSpeechFlow = ai.defineFlow(
  {
    name: 'generateSpeechFlow',
    inputSchema: GenerateSpeechInputSchema,
    outputSchema: GenerateSpeechOutputSchema,
  },
  async (input) => {
    console.log(`[TTS Flow] Generating speech for voice: ${input.voice}`);

    // Select the prebuilt voice model based on the 'gojo' or 'holo' preference.
    // These names correspond to specific high-quality voices from Google's TTS service.
    const voiceName = input.voice === 'gojo' ? 'Achernar' : 'Algenib';

    const { media } = await ai.generate({
      model: 'googleai/gemini-2.5-flash-preview-tts',
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName },
          },
        },
      },
      prompt: input.text,
    });

    if (!media?.url) {
      throw new Error('TTS model did not return any audio media.');
    }
    
    // The model returns a data URI with raw PCM data. We need to convert it to a playable format like WAV.
    const audioBuffer = Buffer.from(media.url.substring(media.url.indexOf(',') + 1), 'base64');
    const wavBase64 = await toWav(audioBuffer);

    return {
      audioDataUri: 'data:audio/wav;base64,' + wavBase64,
    };
  }
);


/**
 * Exported wrapper function to be called by server actions.
 * @param input The text and voice preference.
 * @returns A promise resolving to the generated speech output.
 */
export async function generateSpeech(input: GenerateSpeechInput): Promise<GenerateSpeechOutput> {
  return generateSpeechFlow(input);
}
