
"use server";

import type { NewsApiResponse, NewsArticle } from './types';

const NEWS_API_URL = "https://newsdata.io/api/1/news";

interface FetchNewsParams {
  query?: string;
  country?: string;
  stateOrRegion?: string;
  city?: string;
  category?: string;
  page?: string; // For pagination, newsdata.io uses a 'page' token
  language?: string; // Added language parameter
}

export async function fetchNews(params: FetchNewsParams): Promise<NewsApiResponse> {
  const apiKey = process.env.NEWSDATA_API_KEY;

  if (!apiKey) {
    console.error("NEWSDATA_API_KEY is not set.");
    return { status: "error", totalResults: 0, results: [{
      article_id: "error-no-apikey",
      title: "API Key Missing",
      link: "#",
      description: "Newsdata.io API key is not configured. Please set it in your environment variables.",
      pubDate: new Date().toISOString(), category: ["error"], country: [], language: params.language || "en", source_id: "learnflow-error", source_priority: 0, keywords: null, creator: null, video_url: null, image_url: null,
    }], nextPage: undefined };
  }

  let combinedQuery = params.query || "";
  if (params.country) { 
    if (params.stateOrRegion) {
      combinedQuery = combinedQuery ? `${combinedQuery} AND ${params.stateOrRegion}` : params.stateOrRegion;
    }
    if (params.city) {
      combinedQuery = combinedQuery ? `${combinedQuery} AND ${params.city}` : params.city;
    }
  }
  
  const queryParams = new URLSearchParams({
    apikey: apiKey,
    language: params.language || "en", // Use provided language or default to 'en'
  });

  if (combinedQuery.trim()) {
    queryParams.append("q", combinedQuery.trim());
  }
  
  if (params.category) { 
    queryParams.append("category", params.category);
  }
  
  if (!combinedQuery.trim() && !params.category) {
    queryParams.set("category", "top"); 
  }

  if (params.page) queryParams.append("page", params.page);
  
  try {
    const response = await fetch(`${NEWS_API_URL}?${queryParams.toString()}`);
    if (!response.ok) {
      const errorData = await response.json();
      console.error(`News API Error (${response.status}):`, errorData);
      const message = errorData?.results?.message || `HTTP error! status: ${response.status}`;
      throw new Error(message);
    }
    const data: NewsApiResponse = await response.json();
    
    const cleanedResults = data.results.filter(article => article.title && article.link);
    
    return { ...data, results: cleanedResults };

  } catch (error) {
    console.error("Failed to fetch news:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred while fetching news.";
    return { 
        status: "error", 
        totalResults: 0, 
        results: [{ 
            article_id: "error-" + Date.now(),
            title: "Failed to Load News",
            link: "#",
            description: errorMessage,
            pubDate: new Date().toISOString(),
            category: ["error"],
            country: [],
            language: params.language || "en",
            source_id: "learnflow-error",
            source_priority: 0,
            keywords: null,
            creator: null,
            video_url: null,
            image_url: null,
        } as NewsArticle], 
        nextPage: undefined 
    };
  }
}

    
