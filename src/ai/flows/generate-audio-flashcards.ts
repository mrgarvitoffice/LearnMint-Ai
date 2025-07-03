
'use server';
/**
 * @fileOverview A flashcard generation AI agent that creates flashcards with accompanying audio.
 *
 * - generateAudioFlashcards - A function that handles the audio flashcard generation process.
 * - GenerateAudioFlashcardsInput - The input type for this function.
 * - GenerateAudioFlashcardsOutput - The return type for this function.
 */

import { aiForTTS } from '@/ai/genkit';
import { googleAI } from '@genkit-ai/googleai';
import { z } from 'zod';
import wav from 'wav';

import { generateFlashcards, type GenerateFlashcardsInput } from './generate-flashcards';
import type { Flashcard } from '@/lib/types';

const GenerateAudioFlashcardsInputSchema = z.object({
  topic: z.string().describe('The academic topic for which to generate flashcards.'),
  numFlashcards: z.number().min(1).max(25).describe('The number of flashcards to generate (max 25 for audio generation).'),
});
export type GenerateAudioFlashcardsInput = z.infer<typeof GenerateAudioFlashcardsInputSchema>;

const GenerateAudioFlashcardsOutputSchema = z.object({
  flashcards: z.array(
    z.object({
      term: z.string(),
      definition: z.string(),
    })
  ).describe('An array of generated text-based flashcards.'),
  audioDataUri: z.string().optional().describe('A single data URI for a WAV audio file containing all flashcards read aloud.'),
});
export type GenerateAudioFlashcardsOutput = z.infer<typeof GenerateAudioFlashcardsOutputSchema>;

// This function is exported and called from a server action.
export async function generateAudioFlashcards(input: GenerateAudioFlashcardsInput): Promise<GenerateAudioFlashcardsOutput> {
  return generateAudioFlashcardsFlow(input);
}

// Helper to convert raw PCM audio buffer to a Base64 encoded WAV string.
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
const generateAudioFlashcardsFlow = aiForTTS.defineFlow(
  {
    name: 'generateAudioFlashcardsFlow',
    inputSchema: GenerateAudioFlashcardsInputSchema,
    outputSchema: GenerateAudioFlashcardsOutputSchema,
  },
  async (input) => {
    // Step 1: Generate the text content for the flashcards.
    const textFlashcardsInput: GenerateFlashcardsInput = {
      topic: input.topic,
      numFlashcards: input.numFlashcards,
    };
    const textFlashcardsResult = await generateFlashcards(textFlashcardsInput);

    if (!textFlashcardsResult.flashcards || textFlashcardsResult.flashcards.length === 0) {
      throw new Error("Failed to generate the text for the flashcards. Cannot proceed with audio generation.");
    }
    
    // Step 2: Format the text for multi-speaker TTS.
    const ttsPrompt = textFlashcardsResult.flashcards
      .map(fc => `Speaker1: ${fc.term}\nSpeaker2: ${fc.definition}`)
      .join('\n');
      
    console.log(`[AI Flow - Audio Flashcards] Generating audio for ${textFlashcardsResult.flashcards.length} flashcards.`);

    try {
      // Step 3: Generate the multi-speaker audio.
      const { media } = await aiForTTS.generate({
        model: googleAI.model('gemini-2.5-flash-preview-tts'),
        prompt: ttsPrompt,
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            multiSpeakerVoiceConfig: {
              speakerVoiceConfigs: [
                { speaker: 'Speaker1', voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Algenib' } } }, // Male voice for term
                { speaker: 'Speaker2', voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Achernar' } } }, // Female voice for definition
              ],
            },
          },
          safetySettings: [
            { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
          ],
        },
      });

      if (!media?.url) {
        throw new Error('No audio media was returned from the AI model.');
      }

      // Step 4: Convert the PCM audio to WAV format.
      const pcmData = Buffer.from(media.url.substring(media.url.indexOf(',') + 1), 'base64');
      const wavBase64 = await toWav(pcmData);

      // Step 5: Return both the text and the audio data.
      return {
        flashcards: textFlashcardsResult.flashcards,
        audioDataUri: 'data:audio/wav;base64,' + wavBase64,
      };

    } catch (error: any) {
      console.error(`[AI Flow Error - Audio Flashcards TTS] Failed to generate audio. Returning text flashcards only. Error:`, error);
      // If audio generation fails, we can still return the text flashcards.
      // This makes the feature more resilient.
      return {
        flashcards: textFlashcardsResult.flashcards,
        audioDataUri: undefined,
      };
    }
  }
);
