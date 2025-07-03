import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import * as pdfjsLib from 'pdfjs-dist';

// Set workerSrc to point to the version hosted on a CDN.
// This is a reliable way to ensure the worker is found, especially in complex bundler environments like Next.js.
pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Extracts text content from a PDF file.
 * @param file The PDF file object to process.
 * @returns A promise that resolves to the extracted text as a single string.
 */
export async function extractTextFromPdf(file: File): Promise<string> {
  // Load the file into an ArrayBuffer
  const arrayBuffer = await file.arrayBuffer();
  
  // Load the PDF document from the ArrayBuffer
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const numPages = pdf.numPages;
  let fullText = '';

  // Iterate through each page of the PDF
  for (let i = 1; i <= numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    
    // Extract text items and join them
    const pageText = textContent.items.map((item: any) => item.str).join(' ');
    fullText += pageText + '\n'; // Add a newline between pages
  }

  return fullText;
}
