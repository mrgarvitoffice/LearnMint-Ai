
'use server';
/**
 * @fileOverview An AI agent that converts text into a multi-speaker audio discussion.
 *
 * - generateDiscussionAudio - A function that handles the discussion generation process.
 * - GenerateDiscussionAudioInput - The input type for this function.
 * - GenerateDiscussionAudioOutput - The return type for this function.
 */

import { aiForTTS } from '@/ai/genkit';
import { z } from 'zod';
import wav from 'wav';

const GenerateDiscussionAudioInputSchema = z.object({
  content: z.string().describe('The content to be turned into a discussion.'),
});
export type GenerateDiscussionAudioInput = z.infer<typeof GenerateDiscussionAudioInputSchema>;

const GenerateDiscussionAudioOutputSchema = z.object({
  audioDataUri: z.string().describe('The generated audio discussion as a data URI.'),
});
export type GenerateDiscussionAudioOutput = z.infer<typeof GenerateDiscussionAudioOutputSchema>;

export async function generateDiscussionAudio(input: GenerateDiscussionAudioInput): Promise<GenerateDiscussionAudioOutput> {
  return generateDiscussionAudioFlow(input);
}

// Helper to convert PCM data to WAV Base64
async function toWav(pcmData: Buffer, channels = 1, rate = 24000, sampleWidth = 2): Promise<string> {
  return new Promise((resolve, reject) => {
    const writer = new wav.Writer({ channels, sampleRate: rate, bitDepth: sampleWidth * 8 });
    const bufs: any[] = [];
    writer.on('error', reject);
    writer.on('data', (d) => bufs.push(d));
    writer.on('end', () => resolve(Buffer.concat(bufs).toString('base64')));
    writer.write(pcmData);
    writer.end();
  });
}

// Prompt to generate the dialogue script
const dialoguePrompt = aiForTTS.definePrompt({
    name: 'generateDialogueForTtsPrompt',
    model: 'googleai/gemini-1.5-flash-latest',
    input: { schema: z.object({ content: z.string() }) },
    output: { schema: z.object({ dialogue: z.string() }) },
    prompt: `You are a scriptwriter. Your task is to convert the following text content into a natural-sounding, two-person dialogue script between "Speaker1" (a knowledgeable and slightly formal expert) and "Speaker2" (an inquisitive and friendly learner).

The dialogue should discuss and explain the key points from the provided content. Speaker1 should present the information, and Speaker2 should ask clarifying questions or make comments to guide the conversation.

IMPORTANT: The output MUST be a script formatted *exactly* like this, with each line starting with "Speaker1:" or "Speaker2:":
Speaker1: [First line of dialogue]
Speaker2: [Second line of dialogue]
...and so on.

Do not add any other text, introductions, or summaries. The entire output should be just the dialogue script.

Content to convert:
---
{{{content}}}
---

Please provide the dialogue script below.`
});

// The main Genkit flow
const generateDiscussionAudioFlow = aiForTTS.defineFlow(
  {
    name: 'generateDiscussionAudioFlow',
    inputSchema: GenerateDiscussionAudioInputSchema,
    outputSchema: GenerateDiscussionAudioOutputSchema,
  },
  async (input) => {
    // 1. Generate the dialogue script from the input content
    console.log('[AI Flow - Discussion Audio] Generating dialogue script...');
    const { output: dialogueOutput } = await dialoguePrompt({ content: input.content });
    const dialogueScript = dialogueOutput?.dialogue;

    if (!dialogueScript) {
      throw new Error("Failed to generate a dialogue script from the content.");
    }
    console.log('[AI Flow - Discussion Audio] Dialogue script generated successfully.');

    // 2. Generate multi-speaker audio from the script
    console.log('[AI Flow - Discussion Audio] Generating multi-speaker TTS...');
    const { media } = await aiForTTS.generate({
      model: 'googleai/gemini-2.5-flash-preview-tts',
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          multiSpeakerVoiceConfig: {
            speakerVoiceConfigs: [
              { speaker: 'Speaker1', voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Algenib' } } }, // Male
              { speaker: 'Speaker2', voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Achernar' } } }, // Female
            ],
          },
        },
      },
      prompt: dialogueScript,
    });

    if (!media) {
      throw new Error('TTS model did not return any media.');
    }
    console.log('[AI Flow - Discussion Audio] TTS audio data received.');

    // 3. Convert PCM audio to WAV format
    const audioBuffer = Buffer.from(media.url.substring(media.url.indexOf(',') + 1), 'base64');
    const wavBase64 = await toWav(audioBuffer);
    console.log('[AI Flow - Discussion Audio] Audio converted to WAV successfully.');

    return {
      audioDataUri: 'data:audio/wav;base64,' + wavBase64,
    };
  }
);
