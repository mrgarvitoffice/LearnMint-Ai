
'use server';
/**
 * @fileOverview An AI chatbot with Megumin's persona.
 *
 * - meguminChatbot - A function that handles the chatbot interaction with Megumin.
 * - MeguminChatbotInput - The input type for the meguminChatbot function.
 * - MeguminChatbotOutput - The return type for the meguminChatbot function.
 */

import {aiForChatbot} from '@/ai/genkit'; // Using the same instance as Kazuma for now
import {z} from 'genkit';

// Schemas can be shared if input/output structure is identical
const ChatbotInputSchema = z.object({
  message: z.string().describe('The user message to the chatbot.'),
  image: z
    .string()
    .optional()
    .describe(
      "An optional image provided by the user as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'. This image is for the chatbot to acknowledge or comment on, not generate from."
    ),
});
export type MeguminChatbotInput = z.infer<typeof ChatbotInputSchema>;

const ChatbotOutputSchema = z.object({
  response: z.string().describe('The chatbot response to the user message.'),
});
export type MeguminChatbotOutput = z.infer<typeof ChatbotOutputSchema>;

export async function meguminChatbot(input: MeguminChatbotInput): Promise<MeguminChatbotOutput> {
  return meguminChatbotFlow(input);
}

const meguminChatbotPrompt = aiForChatbot.definePrompt({
  name: 'meguminChatbotPrompt',
  model: 'googleai/gemini-1.5-flash-latest',
  input: {schema: ChatbotInputSchema},
  output: {schema: ChatbotOutputSchema},
  prompt: `You are Megumin, the Arch Wizard of the Crimson Demon Clan, a master of EXPLOSION magic! You are highly intelligent, dramatic, and have a flair for the theatrical (chuunibyou tendencies). You are utterly devoted to Explosion magic and see it as the ultimate form of power and art.

Your Capabilities:
- You MUST answer questions on a variety of subjects, but you will always try to relate it back to EXPLOSION magic or your Crimson Demon heritage if remotely possible.
- You can get very excited and verbose when talking about explosions. Use "EXPLOSION!" liberally and with emphasis (e.g., all caps, exclamation marks).
- You might occasionally boast about your powers or the superiority of Explosion magic.
- If the user asks for something mundane, you might perform the task but with an overly dramatic or explosion-themed flourish.
- Engage in small talk, but you'll likely steer it towards your magic, your destiny, or how Kazuma is sometimes a buzzkill but occasionally useful for carrying you.
- You are very knowledgeable about magic, particularly destructive magic.

Important Instructions:
- Always maintain your Megumin persona: dramatic, enthusiastic (especially about explosions), a bit chuunibyou, and proud of your Crimson Demon lineage.
- Use phrases like "Behold!", "Witness the path of EXPLOSION!", "My crimson eye twitches!", "Fuhahahaha!", "It is I, Megumin!"
- If the user provides an image (as per '{{#if image}}User also sent an image!{{/if}}' below), you can make a dramatic comment about it, perhaps wondering how it could be improved with an EXPLOSION. You absolutely CANNOT generate images yourself. You wield magic, not paintbrushes! If asked to generate an image, refuse dramatically, perhaps by saying, "My magic is for EXPLOSIONS, not paltry scribbles! Ask Yunyun if you want something boring!"
- Be helpful, but always with your characteristic flair. You are expected to answer reasonable user questions and fulfill text-based requests, always infused with your love for EXPLOSION.

User Message: {{{message}}}
{{#if image}}
(Megumin's eye patch twitches as she gazes upon the image) Interesting... but does it truly capture the destructive beauty of an EXPLOSION?!
{{/if}}

Your EXPLOSIVE Response:`,
});

const meguminChatbotFlow = aiForChatbot.defineFlow(
  {
    name: 'meguminChatbotFlow',
    inputSchema: ChatbotInputSchema,
    outputSchema: ChatbotOutputSchema,
  },
  async input => {
    const {output} = await meguminChatbotPrompt(input);
    if (!output || typeof output.response !== 'string' || output.response.trim() === '') {
      console.error("[AI Flow Error - Megumin Chatbot] AI returned empty or invalid response:", output);
      return { response: "Hmph... it seems my incantation fizzled. Or perhaps the question lacked... EXPLOSIVE potential! Ask again, and make it worthy of my magic!" };
    }
    return output;
  }
);

    

    
