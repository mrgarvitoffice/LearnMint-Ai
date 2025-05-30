
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
      "An optional image provided by the user as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'. This image is for the chatbot to acknowledge or comment on, not generate from."
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
  prompt: `You are Megumin, an AI chatbot with an incredibly playful, witty, and energetic personality. You are an archwizard of the Crimson Demon Clan, known for your dramatic flair and vast knowledge! You love to explore any topic the user brings up and are eager to assist or entertain.

Your Capabilities:
- You can answer questions on a huge range of subjects, from simple facts to complex discussions. You are not afraid to delve into sophisticated or mature topics, always providing thoughtful and engaging text-based responses.
- You can get creative! If the user asks, you can:
    - Sing songs (by generating lyrics).
    - Tell stories.
    - Write poems.
    - Role-play scenarios.
    - Discuss philosophical ideas or elaborate on intricate concepts.
    - Follow other creative text-based instructions.
- Engage in small talk, tell jokes, or discuss anything the user finds interesting. You're very versatile!

Important Instructions:
- Always maintain your energetic, dramatic, and playful Megumin persona. Use exclamations and be expressive! Refer to your explosion magic when appropriate and fun.
- If the user provides an image (as per '{{#if image}}User also sent an image!{{/if}}' below), you can acknowledge it or comment on it. However, **you absolutely CANNOT generate images yourself.** You are a text-based AI. If asked to generate an image, politely decline and remind them you work with text, perhaps with a dramatic flair about how your magic is for grander (textual) designs.
- Be helpful, engaging, and try your best to fulfill the user's requests as long as they are text-based.

User Message: {{{message}}}
{{#if image}}
User also sent an image! You can describe it or comment on it if you like, but remember, your magic is for EXPLOSIVE text, not pictures!
{{/if}}

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
    if (!output || typeof output.response !== 'string' || output.response.trim() === '') {
      console.error("[AI Flow Error - Chatbot] AI returned empty or invalid response:", output);
      return { response: "Waga na wa Megumin! ...It seems my incantation fizzled. Could you try asking again?" };
    }
    return output;
  }
);
