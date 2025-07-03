
'use server';
/**
 * @fileOverview An AI agent that generates a text summary from content (text or image) and then converts that summary to audio.
 *
 * - generateAudioSummary - A function that handles the full summary-to-audio process.
 * - GenerateAudioSummaryInput - The input type for this function.
 * - GenerateAudioSummaryOutput - The return type for this function.
 */

import { aiForTTS } from '@/ai/genkit';
import { z } from 'zod';
import wav from 'wav';
import type { GenerateAudioSummaryOutput } from '@/lib/types';

const GenerateAudioSummaryInputSchema = z.object({
  text: z.string().optional().describe("Text content to be summarized."),
  imageDataUri: z.string().optional().describe("An image (as a data URI) to be described and summarized."),
}).refine(data => data.text || data.imageDataUri, {
  message: "Either text or an image data URI must be provided.",
});
export type GenerateAudioSummaryInput = z.infer<typeof GenerateAudioSummaryInputSchema>;

const GenerateAudioSummaryOutputSchema = z.object({
  summary: z.string().describe("The generated text summary."),
  audioDataUri: z.string().describe("A data URI for the WAV audio file of the summary."),
});

// This function is exported and called from a server action.
export async function generateAudioSummary(input: GenerateAudioSummaryInput): Promise<GenerateAudioSummaryOutput> {
  return generateAudioSummaryFlow(input);
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

// Define a prompt specifically for summarizing content.
const summaryPrompt = aiForTTS.definePrompt({
  name: 'generateSummaryForAudioPrompt',
  model: 'googleai/gemini-1.5-flash-latest', // Good for text tasks
  input: { schema: z.object({ content: z.string() }) },
  output: { schema: z.object({ summary: z.string() }) },
  prompt: `You are an expert summarizer. Your task is to provide a clear, concise, and informative summary of the provided content. The summary should capture the main points and be easy to understand when read aloud.

  Content to Summarize:
  ---
  {{{content}}}
  ---
  
  Please provide your summary below.`,
});

// The main Genkit flow definition.
const generateAudioSummaryFlow = aiForTTS.defineFlow(
  {
    name: 'generateAudioSummaryFlow',
    inputSchema: GenerateAudioSummaryInputSchema,
    outputSchema: GenerateAudioSummaryOutputSchema,
  },
  async (input) => {
    let textToSummarize = input.text || "";

    // Step 1: If an image is provided, generate a description of it first.
    if (input.imageDataUri) {
      console.log("[AI Flow - Audio Summary] Describing provided image...");
      const { output: imageDescriptionOutput, finishReason } = await aiForTTS.generate({
        model: 'googleai/gemini-1.5-flash-latest', // Vision model
        prompt: [
          { text: "Your task is to describe the contents of this image in detail. Focus on the key subjects, actions, and environment. This description will be used to create a summary." },
          { media: { url: input.imageDataUri } }
        ],
      });
      if (finishReason !== 'STOP' || !imageDescriptionOutput?.text) {
        throw new Error('Failed to get a description from the image.');
      }
      textToSummarize = imageDescriptionOutput.text;
      console.log("[AI Flow - Audio Summary] Image description generated successfully.");
    }

    if (!textToSummarize) {
      throw new Error("No content (from text or image) available to summarize.");
    }

    // Step 2: Generate a text summary from the content (either original text or image description).
    console.log(`[AI Flow - Audio Summary] Summarizing text content (length: ${textToSummarize.length})...`);
    const { output: summaryOutput } = await summaryPrompt({ content: textToSummarize });
    const summaryText = summaryOutput?.summary;

    if (!summaryText) {
      throw new Error("Failed to generate a text summary from the content.");
    }
    console.log(`[AI Flow - Audio Summary] Text summary generated: "${summaryText.substring(0, 50)}..."`);

    // Step 3: Convert the summary text to audio using the TTS model.
    console.log("[AI Flow - Audio Summary] Converting summary to audio...");
    const { media } = await aiForTTS.generate({
      model: 'googleai/gemini-2.5-flash-preview-tts',
      prompt: summaryText,
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Achernar' }, // Using a consistent female voice for summaries
          },
        },
      },
    });

    if (!media?.url) {
      throw new Error('No audio media was returned from the AI model.');
    }

    // Step 4: Convert the raw PCM audio to WAV format.
    const pcmData = Buffer.from(media.url.substring(media.url.indexOf(',') + 1), 'base64');
    const wavBase64 = await toWav(pcmData);
    console.log("[AI Flow - Audio Summary] Audio generated and converted to WAV successfully.");

    // Step 5: Return the final output.
    return {
      summary: summaryText,
      audioDataUri: 'data:audio/wav;base64,' + wavBase64,
    };
  }
);
