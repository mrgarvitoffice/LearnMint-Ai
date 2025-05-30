'use server';
/**
 * @fileOverview A study note generation AI agent.
 *
 * - generateStudyNotes - A function that handles the study note generation process.
 * - GenerateStudyNotesInput - The input type for the generateStudyNotes function.
 * - GenerateStudyNotesOutput - The return type for the generateStudyNotes function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';

const GenerateStudyNotesInputSchema = z.object({
  topic: z.string().describe('The topic for which to generate study notes.'),
});
export type GenerateStudyNotesInput = z.infer<typeof GenerateStudyNotesInputSchema>;

const GenerateStudyNotesOutputSchema = z.object({
  notes: z
    .string()
    .describe(
      'The generated study notes in markdown format, including a summary, headings, point-wise details, and image placeholders.'
    ),
});
export type GenerateStudyNotesOutput = z.infer<typeof GenerateStudyNotesOutputSchema>;

const prompt = ai.definePrompt({
  name: 'generateStudyNotesPrompt',
  input: {schema: GenerateStudyNotesInputSchema},
  output: {schema: GenerateStudyNotesOutputSchema},
  prompt: `You are an expert educator tasked with creating exceptionally engaging and visually appealing study notes, in the style of a top student's "topper notes." The notes must be well-formatted using Markdown to be both informative and a pleasure to study from. Your goal is to make learning fun and effective!

Topic: {{{topic}}}

Please generate study notes on this topic with the following characteristics:

1.  **Tone & Engagement:**
    *   Write in an **enthusiastic, conversational, and highly engaging tone**, as if you're an excited teacher explaining the concepts.
    *   Use **relevant emojis** (like 🚀, ✨, 🤔, 🧠, 💪, ⚡, 🕰️, 🌟, 🌱, 🐾, 🥳, etc.) to add visual appeal and thematic cues next to headings or key points where appropriate. Make it fun!
    *   Use catchy or question-based phrases for section introductions or summaries.

2.  **Structure & Formatting (Markdown):**
    *   Start with a brief, **exciting introductory paragraph** that hooks the reader.
    *   Employ a clear hierarchy of headings:
        *   A **main, attention-grabbing title** for the overall topic, perhaps with emojis (e.g., using '# Main Topic Title 🚀✨').
        *   **Prominent major section headings** (e.g., using '## Key Concept Unveiled! 🤔' or '# Another Big Section! 💡'). Make these visually distinct from sub-headings.
        *   **Clearly distinct sub-headings** for sub-topics, making them smaller but still clear (e.g., '### Diving Deeper: ...' or '#### Specific Examples:'). Create a "big text, small text" visual flow.
    *   Provide detailed information in a **point-wise manner** using bullet points ('- ') or numbered lists ('1. ').
    *   Pay meticulous attention to **spacing and layout** throughout the document. Use line breaks effectively to separate ideas and make the notes scannable and easy on the eyes. Make the notes look good and visually appealing through excellent Markdown formatting.

3.  **Content & Emphasis:**
    *   Ensure the information is accurate, comprehensive, and clearly explained.
    *   Emphasize **key terms, definitions, and crucial concepts by making them bold**.
    *   Use *italics* for important nuances, examples, or foreign terms.
    *   Use \`blockquotes\` for highlighting critical pieces of information, direct definitions, important summaries, or memorable facts.
    *   If comparing concepts (e.g., Prokaryotic vs. Eukaryotic cells), format this information in a **clear Markdown table**.

4.  **Visuals (Placeholders ONLY):**
    *   Where a diagram, chart, or image would significantly enhance understanding, insert a placeholder in the exact format: \`[VISUAL_PROMPT: descriptive query for the image]\`. For example: \`[VISUAL_PROMPT: diagram of a plant cell's organelles]\` or \`[VISUAL_PROMPT: timeline of World War 2 major European events]\`.
    *   **Do NOT generate actual images or image URLs yourself.** Only use the textual placeholder format described above.

5.  **Conclusion:**
    *   End with a **concluding summary or a section to remember key facts**, perhaps with a fun, thematic title (e.g., "Remember These CELL-ebrated Facts! 🥳").

Your goal is to produce notes that are not only informative but exceptionally well-organized, visually engaging, and a genuine pleasure to study from – the kind of notes a top student would create to ace their exams.
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
});

const generateStudyNotesFlow = ai.defineFlow(
  {
    name: 'generateStudyNotesFlow',
    inputSchema: GenerateStudyNotesInputSchema,
    outputSchema: GenerateStudyNotesOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    // Add basic validation for the output structure
    if (!output || typeof output.notes !== 'string' || output.notes.trim() === '') {
        console.error("[AI Flow Error - Notes] AI returned empty or invalid notes data:", output);
        // Fallback or more specific error handling can be added here
        // For now, returning a structured error or a default note
        throw new Error("AI failed to generate notes in the expected style. The returned data was empty or invalid.");
    }
    return output;
  }
);

export async function generateStudyNotes(input: GenerateStudyNotesInput): Promise<GenerateStudyNotesOutput> {
  console.log(`[Server Action] generateStudyNotes called for topic: ${input.topic}`);
  try {
    const result = await generateStudyNotesFlow(input);
    return result;
  } catch (error: any) {
    console.error("[Server Action Error - generateStudyNotes] Error in flow execution:", error.message, error.stack);
    let clientErrorMessage = "Failed to generate study notes. Please try again.";
    if (error.message && (error.message.includes("API key") || error.message.includes("GOOGLE_API_KEY"))) {
      clientErrorMessage = "Study Notes: Generation failed due to an API key issue. Please check server configuration.";
    } else if (error.message) {
      clientErrorMessage = `Study Notes: Generation failed. Error: ${error.message.substring(0, 150)}. Check server logs for details.`;
    }
    throw new Error(clientErrorMessage);
  }
}
