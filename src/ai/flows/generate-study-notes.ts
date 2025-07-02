
'use server';
/**
 * @fileOverview A study note generation AI agent.
 *
 * - generateStudyNotes - A function that handles the study note generation process.
 * - GenerateStudyNotesInput - The input type for the generateStudyNotes function.
 * - GenerateStudyNotesOutput - The return type for the generateStudyNotes function.
 */

import {aiForNotes} from '@/ai/genkit'; 
import {z} from 'zod';
import { generateImageFromPrompt } from './generate-image-from-prompt';

const GenerateStudyNotesInputSchema = z.object({
  topic: z.string().describe('The academic topic for which to generate study notes.'),
  image: z.string().optional().describe(
    "An optional image provided by the user as a data URI for context. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
  ),
});
export type GenerateStudyNotesInput = z.infer<typeof GenerateStudyNotesInputSchema>;

const GenerateStudyNotesOutputSchema = z.object({
  notes: z.string().describe("Comprehensive, well-structured study notes in Markdown format. Include headings (H1, H2, H3), subheadings, bullet points, bold text for key terms. Where a diagram or visual would be helpful, insert a placeholder like '[VISUAL_PROMPT: A diagram illustrating...]'. The notes should be engaging, like topper notes, with good spacing and visual hierarchy (big text, small text), and relevant emojis.")
});
export type GenerateStudyNotesOutput = z.infer<typeof GenerateStudyNotesOutputSchema>;

const generateStudyNotesPrompt = aiForNotes.definePrompt({
  name: 'generateStudyNotesPrompt',
  model: 'googleai/gemini-1.5-flash-latest',
  input: { schema: GenerateStudyNotesInputSchema },
  output: { schema: GenerateStudyNotesOutputSchema },
  prompt: `You are an expert educator tasked with creating exceptionally engaging and visually appealing study notes, in the style of a top student's "topper notes." The notes must be well-formatted using Markdown to be both informative and a pleasure to study from. Your goal is to make learning fun and effective!

Topic: {{{topic}}}

{{#if image}}
The user has also provided an image for additional context. Use it to enhance the notes where relevant, especially if it helps clarify a concept mentioned in the topic.
User's Image: {{media url=image}}
{{/if}}

Please generate study notes on this topic with the following characteristics:

1.  **Tone & Engagement:**
    *   Write in an **enthusiastic, conversational, and highly engaging tone**, as if you're an excited teacher explaining the concepts.
    *   Use **relevant emojis** (like 🚀, ✨, 🤔, 🧠, 💪, ⚡, 🕰️, 🌟, 🌱, 🐾, 🥳, etc.) to add visual appeal and thematic cues next to headings or key points where appropriate. Make it fun!
    *   Use catchy or question-based phrases for section introductions or summaries.
    *   Make key enthusiastic statements really **pop** and stand out using bolding or other Markdown emphasis! For example:
        > **A cell is the smallest structural and functional unit of an organism. Think of it as the tiny, self-contained powerhouse of life! It's amazing what these little guys can do!** 🤩

2.  **Structure & Formatting (Markdown):**
    *   Start with a brief, **exciting introductory paragraph** that hooks the reader.
    *   Employ a clear hierarchy of headings:
        *   A **main, attention-grabbing title** for the overall topic (using '# Main Topic Title 🚀✨'). This should be the largest and most prominent.
        *   **Prominent major section headings** (using '## Key Concept Unveiled! 🤔' or '## Another Big Section! 💡'). Make these visually distinct and larger than major section headings.
        *   **Clearly distinct sub-headings** for sub-topics (using '### Diving Deeper: ...' or '#### Specific Examples:'). These should be smaller than major section headings, creating a "big text, small text" visual flow.
    *   Provide detailed information in a **point-wise manner** using bullet points ('- ') or numbered lists ('1. ').
    *   Pay meticulous attention to **spacing and layout** throughout the document. Use blank lines effectively between paragraphs, headings, and list items to ensure the notes are scannable and easy on the eyes. Make the notes look good and visually appealing through excellent Markdown formatting.

3.  **Content & Emphasis:**
    *   Ensure the information is accurate, comprehensive, and clearly explained.
    *   Emphasize **key terms, definitions, and crucial concepts by making them bold**.
    *   Use *italics* for important nuances, examples, or foreign terms.
    *   Use \`blockquotes\` for highlighting critical pieces of information, direct definitions, important summaries, or memorable facts.
    *   If comparing concepts (e.g., Prokaryotic vs. Eukaryotic cells), format this information in a **clear Markdown table**.

4.  **MANDATORY: Visual Placeholders:**
    *   You **MUST** insert visual aid placeholders where a diagram or image would enhance understanding. This is a critical requirement.
    *   Use the exact format: \`[VISUAL_PROMPT: A descriptive prompt for an educational image]\`.
    *   **Examples:** \`[VISUAL_PROMPT: A colorful diagram of the Krebs cycle]\` or \`[VISUAL_PROMPT: A simple chart showing the process of photosynthesis]\`.
    *   Aim for 2-3 visual prompts per document.
    *   **DO NOT** generate image URLs yourself. Only use the specified placeholder format. Failure to include these placeholders will result in an incomplete output.

5.  **Conclusion:**
    *   End with a **concluding summary or a section to remember key facts**, perhaps with a fun, thematic title (e.g., "Remember These CELL-ebrated Facts! 🥳").

Your goal is to produce notes that are not only informative but exceptionally well-organized, visually engaging, and a genuine pleasure to study from – the kind of notes a top student would create to ace their exams. Ensure there's good visual separation (space) between headings and the text that follows them.
The entire output, including all Markdown formatting, emojis, and image placeholders, should be a single JSON object with a key "notes" containing the complete Markdown string.
Example of a desired style snippet for a section:
\`\`\`markdown
## MEET THE CELL SUPERSTARS: Prokaryotic vs. Eukaryotic 🌟🕰️

Not all cells are the same! There are two major types you must know!

### PROKARYOTIC CELLS (Think SIMPLE & ANCIENT! 🕰️)

- These are the original life forms!
- **No nucleus!** Their genetic material (DNA) is just chillin' in the cytoplasm.
- *Examples:* All Bacteria and Archaea.
\`\`\`
`,
  config: { 
    safetySettings: [
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
    ],
  }
});

const generateStudyNotesFlow = aiForNotes.defineFlow( 
  {
    name: 'generateStudyNotesFlow',
    inputSchema: GenerateStudyNotesInputSchema,
    outputSchema: GenerateStudyNotesOutputSchema,
  },
  async (input) => {
    console.log(`[AI Flow - Notes Text] Generating notes text for topic: ${input.topic}`);
    const textGenerationResult = await generateStudyNotesPrompt(input);
    
    if (!textGenerationResult.output || typeof textGenerationResult.output.notes !== 'string' || textGenerationResult.output.notes.trim() === '') {
      console.error("[AI Flow Error - Notes Text] AI returned empty or invalid notes data:", textGenerationResult.output);
      throw new Error("AI failed to generate notes text in the expected style. The returned data was empty or invalid.");
    }
    
    let notesWithPlaceholders = textGenerationResult.output.notes;
    console.log(`[AI Flow - Notes Text] Successfully generated notes text for topic: ${input.topic}. Length: ${notesWithPlaceholders.length}`);

    // Real Image generation step
    const visualPromptRegex = /\[VISUAL_PROMPT:\s*([^\]]+)\]/g;
    let match;
    const visualPrompts: { fullMatch: string, promptText: string }[] = [];

    // First, collect all visual prompts
    while ((match = visualPromptRegex.exec(notesWithPlaceholders)) !== null) {
      visualPrompts.push({ fullMatch: match[0], promptText: match[1].trim() });
    }
    
    console.log(`[AI Flow - Notes Images] Found ${visualPrompts.length} visual prompts to process for image generation:`, visualPrompts.map(vp => vp.promptText));

    if (visualPrompts.length > 0) {
        // Use Promise.allSettled to handle individual image generation failures without crashing the entire flow.
        const imageGenerationPromises = visualPrompts.map(vp => 
            generateImageFromPrompt({ prompt: vp.promptText })
        );
        const settledResults = await Promise.allSettled(imageGenerationPromises);

        let finalNotes = notesWithPlaceholders;
        settledResults.forEach((result, index) => {
            const originalPrompt = visualPrompts[index];
            if (result.status === 'fulfilled' && result.value.imageUrl) {
                console.log(`[AI Flow - Notes Images] Got image URL for: "${originalPrompt.promptText.substring(0,30)}...". Replacing placeholder with image link.`);
                const markdownImage = `![${originalPrompt.promptText.replace(/"/g, "'")}](${result.value.imageUrl})`;
                finalNotes = finalNotes.replace(originalPrompt.fullMatch, markdownImage);
            } else if (result.status === 'rejected') {
                // If a promise was rejected, log the reason and leave the placeholder.
                console.warn(`[AI Flow - Notes Images] Failed to generate image for prompt: "${originalPrompt.promptText}". Reason: ${result.reason}. Placeholder will remain.`);
            } else {
                // This covers cases where the promise fulfilled but didn't return a valid imageUrl.
                console.warn(`[AI Flow - Notes Images] Image generation fulfilled but returned no valid URL for prompt: "${originalPrompt.promptText}". Placeholder will remain.`);
            }
        });
        
        console.log(`[AI Flow - Notes Images] Finished processing all visual prompts. Final notes length: ${finalNotes.length}`);
        return { notes: finalNotes };
    } else {
         console.log(`[AI Flow - Notes Images] No visual prompts found. Returning original notes.`);
         return { notes: notesWithPlaceholders };
    }
  }
);

export async function generateStudyNotes(input: GenerateStudyNotesInput): Promise<GenerateStudyNotesOutput> {
  console.log(`[AI Wrapper] generateStudyNotes called for topic: ${input.topic}. Using notes-specific AI configuration if GOOGLE_API_KEY_NOTES is set.`);
  try {
    return await generateStudyNotesFlow(input);
  } catch (error: any) {
    console.error("[AI Wrapper Error - generateStudyNotes] Error in flow execution:", error.message, error.stack);
    let clientErrorMessage = "Failed to generate study notes. Please try again.";
    const lowerCaseError = error.message?.toLowerCase() || "";

    if (lowerCaseError.includes("model not found") || lowerCaseError.includes("permission denied") || lowerCaseError.includes("api key not valid")) {
      clientErrorMessage = "Study Notes: Generation failed due to an API key or project configuration issue. Please check that the GOOGLE_API_KEY_NOTES (or its fallback) is correct and that the 'Generative Language API' is enabled with billing in its Google Cloud project.";
    } else if (lowerCaseError.includes("api key") || lowerCaseError.includes("google_api_key")) {
       clientErrorMessage = "Study Notes: Generation failed due to an API key issue. Please check server configuration (GOOGLE_API_KEY or GOOGLE_API_KEY_NOTES or GOOGLE_API_KEY_IMAGES) and ensure billing is enabled for the Google Cloud project.";
    } else if (error.message) {
      clientErrorMessage = `Study Notes: Generation failed. Error: ${error.message.substring(0, 150)}. Check server logs for full details.`;
    }
    throw new Error(clientErrorMessage);
  }
}
