
'use server';
/**
 * @fileOverview A Genkit flow to search for Google Books.
 *
 * - searchGoogleBooks - A function that searches Google Books based on a query.
 * - GoogleBooksSearchInput - The input type for the searchGoogleBooks function.
 * - GoogleBooksSearchOutput - The return type for the searchGoogleBooks function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GoogleBookItemSchema = z.object({
  bookId: z.string().describe('The Google Books volume ID.'),
  title: z.string().describe('The title of the book.'),
  authors: z.array(z.string()).optional().describe('A list of authors for the book.'),
  description: z.string().optional().describe('A short description of the book.'),
  thumbnailUrl: z.string().url().optional().describe('URL of the book cover thumbnail.'),
  publishedDate: z.string().optional().describe('The publication date of the book.'),
  pageCount: z.number().optional().describe('The number of pages in the book.'),
  infoLink: z.string().url().optional().describe('A link to more information about the book on Google Books.'),
});

export const GoogleBooksSearchInputSchema = z.object({
  query: z.string().describe('The search query for Google Books.'),
  maxResults: z.number().min(1).max(40).default(10).describe('Maximum number of results to return (max 40 for Google Books API).'),
});
export type GoogleBooksSearchInput = z.infer<typeof GoogleBooksSearchInputSchema>;

export const GoogleBooksSearchOutputSchema = z.object({
  books: z.array(GoogleBookItemSchema).describe('A list of found Google Books.'),
});
export type GoogleBooksSearchOutput = z.infer<typeof GoogleBooksSearchOutputSchema>;

// Tool to fetch Google Books
const fetchGoogleBooksTool = ai.defineTool(
  {
    name: 'fetchGoogleBooks',
    description: 'Fetches a list of books from Google Books based on a search query.',
    inputSchema: GoogleBooksSearchInputSchema,
    outputSchema: GoogleBooksSearchOutputSchema,
  },
  async (input) => {
    const apiKey = process.env.GOOGLE_BOOKS_API_KEY;
    
    const params = new URLSearchParams({
      q: input.query,
      maxResults: input.maxResults.toString(),
    });
    if (apiKey) {
      params.append('key', apiKey);
    }

    const response = await fetch(`https://www.googleapis.com/books/v1/volumes?${params.toString()}`);
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Google Books API Error:', errorData);
      throw new Error(`Google Books API request failed: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    const books = data.items?.map((item: any) => ({
      bookId: item.id,
      title: item.volumeInfo?.title,
      authors: item.volumeInfo?.authors || [],
      description: item.volumeInfo?.description,
      thumbnailUrl: item.volumeInfo?.imageLinks?.thumbnail || item.volumeInfo?.imageLinks?.smallThumbnail,
      publishedDate: item.volumeInfo?.publishedDate,
      pageCount: item.volumeInfo?.pageCount,
      infoLink: item.volumeInfo?.infoLink,
    })).filter((book: any) => book.title) || []; 

    return { books };
  }
);

// Genkit flow definition
const searchGoogleBooksFlow = ai.defineFlow(
  {
    name: 'searchGoogleBooksFlow',
    inputSchema: GoogleBooksSearchInputSchema,
    outputSchema: GoogleBooksSearchOutputSchema,
    model: 'googleai/gemini-2.0-flash-exp',
  },
  async (input) => {
    const llmResponse = await ai.generate({
      prompt: `The user wants to search for books with the query: "${input.query}". Use the fetchGoogleBooks tool to get ${input.maxResults} results.`,
      tools: [fetchGoogleBooksTool],
      config: {
        temperature: 0.1,
      },
    });

    const toolResponse = llmResponse.toolRequest?.tool?.response as GoogleBooksSearchOutput | undefined;

    if (toolResponse && toolResponse.books) {
      return toolResponse;
    }
    
    if (llmResponse.text) {
        console.warn("LLM did not use the Google Books tool as expected, or returned text instead. Text response:", llmResponse.text);
    }
    return { books: [] };
  }
);

// Exported async wrapper function
export async function searchGoogleBooks(input: GoogleBooksSearchInput): Promise<GoogleBooksSearchOutput> {
   try {
    return await searchGoogleBooksFlow(input);
  } catch (error) {
    console.error("Error in searchGoogleBooks flow:", error);
    return { books: [] };
  }
}
