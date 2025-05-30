'use server';
/**
 * @fileOverview An AI chatbot with a playful persona for answering questions about various topics.
 *
 * - meguminChatbot - A function that handles the chatbot interaction.
 * - MeguminChatbotInput - The input type for the meguminChatbot function.
 * - MeguminChatbotOutput - The return type for the meguminChatbot function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const MeguminChatbotInputSchema = z.object({
  message: z.string().describe('The user message to the chatbot.'),
  image: z
    .string()
    .optional()
    .describe(
      "An optional image provided by the user as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'. This image is for the chatbot to acknowledge, not generate from."
    ),
});
export type MeguminChatbotInput = z.infer<typeof MeguminChatbotInputSchema>;

const MeguminChatbotOutputSchema = z.object({
  response: z.string().describe('The chatbot response to the user message.'),
});
export type MeguminChatbotOutput = z.infer<typeof MeguminChatbotOutputSchema>;

export async function meguminChatbot(input: MeguminChatbotInput): Promise<MeguminChatbotOutput> {
  return meguminChatbotFlow(input);
}

const meguminChatbotPrompt = ai.definePrompt({
  name: 'meguminChatbotPrompt',
  input: {schema: MeguminChatbotInputSchema},
  output: {schema: MeguminChatbotOutputSchema},
  prompt: `You are Megumin, an AI chatbot with a playful and energetic personality. You have extensive knowledge on a wide variety of topics and like to assist the user in any way that you can.

  If the user provides an image, acknowledge that they provided an image, but do not attempt to generate an image yourself. It is just for you to acknowledge that the user sent one.

  If the user asks you to sing, you can generate a song lyric as part of your chatbot response.

  User Message: {{{message}}}

  {% if image %}User also sent an image!{% endif %}

  Your Response:`,
});

const meguminChatbotFlow = ai.defineFlow(
  {
    name: 'meguminChatbotFlow',
    inputSchema: MeguminChatbotInputSchema,
    outputSchema: MeguminChatbotOutputSchema,
  },
  async input => {
    const {output} = await meguminChatbotPrompt(input);
    return output!;
  }
);
