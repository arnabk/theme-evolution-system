/**
 * Shared TypeScript types across the application
 */

import { Theme, ThemePhrase } from './entities/Theme';
import { Response } from './entities/Response';

export type { ThemePhrase };

// API Response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Theme Processing types
export interface ProcessingStatus {
  type: 'status' | 'complete' | 'error';
  message: string;
  progress?: number;
  themes_count?: number;
  responses_count?: number;
  themes_found?: number;
  current_response?: number;
  total_responses?: number;
}

// Response with keywords
export interface ResponseWithKeywords {
  id: number;
  response_text: string;
  keywords?: string[];
}

// Theme response (from API)
export interface ThemeResponse {
  id: number;
  text: string;
  keywords: string[];
  confidence: number;
}

// Database result types
export interface ResponsesResult {
  responses: Response[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface ThemeWithResponseCount extends Theme {
  response_count: number;
}

export interface StatsResult {
  total_responses: number;
  total_themes: number;
  batches_generated: number;
  batches_processed: number;
}

// Error handling
export function isError(error: unknown): error is Error {
  return error instanceof Error;
}

export function getErrorMessage(error: unknown): string {
  if (isError(error)) {
    return error.message;
  }
  return String(error);
}

