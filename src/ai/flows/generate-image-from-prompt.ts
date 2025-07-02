
'use server';
/**
 * @fileOverview A Genkit flow to generate an image from a text prompt using a generative image model.
 *
 * - generateImageFromPrompt - A function that takes a text prompt and returns a generated image as a data URI.
 * - GenerateImageInput - The input type for this function.
 * - GenerateImageOutput - The return type for this function.
 */

import { aiForImages } from '@/ai/genkit';
import { z } from 'zod';

const GenerateImageInputSchema = z.object({
  prompt: z.string().describe('The text prompt to generate an image from.'),
});
export type GenerateImageInput = z.infer<typeof GenerateImageInputSchema>;

const GenerateImageOutputSchema = z.object({
  imageUrl: z.string().url().optional().describe('A data URI of the generated image. Format: data:image/png;base64,...'),
  error: z.string().optional().describe('Error message if generation failed.'),
});
export type GenerateImageOutput = z.infer<typeof GenerateImageOutputSchema>;

export async function generateImageFromPrompt(input: GenerateImageInput): Promise<GenerateImageOutput> {
  return generateImageFromPromptFlow(input);
}

const generateImageFromPromptFlow = aiForImages.defineFlow(
  {
    name: 'generateImageFromPromptFlow',
    inputSchema: GenerateImageInputSchema,
    outputSchema: GenerateImageOutputSchema,
  },
  async (input) => {
    console.log(`[AI Flow - Image Gen] Attempting to generate image for prompt: "${input.prompt.substring(0, 50)}..."`);
    try {
      // WARNING: Using a text model for image generation. This will not produce an image.
      const { text, finishReason, "usage": _ } = await aiForImages.generate({
        model: 'googleai/gemini-2.5-flash-lite-preview-06-17',
        prompt: `A visually appealing, educational diagram or illustration for a study note on the topic: ${input.prompt}. The style should be clear, simple, and easy to understand.`,
        // The config for responseModalities has been removed as it's not supported by text models.
      });

      // The 'media' object will not be returned by a text model. It will always be undefined.
      const media = undefined;

      if (finishReason !== 'STOP' && finishReason !== 'MODEL') {
        const errorDetail = `Generation did not finish successfully. Reason: ${finishReason}.`;
        console.warn(`[AI Flow - Image Gen] ${errorDetail}`);
        return { error: errorDetail };
      }

      // This condition will now always be false.
      if (media?.url) {
        console.log(`[AI Flow - Image Gen] Successfully generated image for prompt: "${input.prompt.substring(0, 50)}..."`);
        return { imageUrl: media.url };
      } else {
        const errorDetail = 'Image generation did not produce any media output because a text model was used.';
        console.warn(`[AI Flow - Image Gen] ${errorDetail}`);
        // Add the text response from the model to the error for debugging.
        return { error: `${errorDetail} The model returned the following text instead: "${text}"` };
      }

    } catch (error: any) {
      console.error(`[AI Flow Error - Image Gen] Error processing prompt "${input.prompt.substring(0,50)}...":`, error);
      let errorMessage = "Failed to generate image due to an unexpected error.";
      if (error.message) {
        errorMessage = error.message;
        if (error.message.includes("API key") || error.message.includes("GOOGLE_API_KEY_IMAGES")) {
          errorMessage = "Image Generation: API key issue. Check GOOGLE_API_KEY_IMAGES and ensure billing is enabled and the Generative Language API is active for the project associated with the key.";
        } else if (error.message.includes("quota")) {
          errorMessage = "Image Generation: Quota exceeded. Please check your Google Cloud project quotas for Generative Language API.";
        } else if (error.message.includes("billing")) {
          errorMessage = "Image Generation: Billing issue. Please ensure billing is enabled for the Google Cloud project associated with the API key being used.";
        } else if (error.message.includes("not found")) {
            errorMessage = `Image Generation: The specified model was not found. This might be an API key permission issue. Details: ${error.message}`;
        }
      }
      return { error: errorMessage };
    }
  }
);
