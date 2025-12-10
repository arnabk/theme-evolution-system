/**
 * Test utilities and mocks
 */
/* istanbul ignore file */

import type { ExtractedSpan, ExtractionClass } from '../theme-evolution/span-extractor';

export function createMockSpan(
  text: string,
  start: number,
  end: number,
  responseId: number,
  className: ExtractionClass = 'user_goal'
): ExtractedSpan {
  return {
    text,
    start,
    end,
    class: className,
    responseId
  };
}

export function createMockResponse(id: number, text: string, batchId: number = 1) {
  return {
    id,
    session_id: 'test-session',
    response_text: text,
    batch_id: batchId,
    question: 'Test question?',
    processed: false,
    created_at: new Date()
  };
}

export function createMockTheme(id: number, name: string, phrases: Array<{ text: string; class: string }> = []) {
  return {
    id,
    session_id: 'test-session',
    name,
    description: `Description for ${name}`,
    phrases: JSON.stringify(phrases),
    response_count: 0,
    created_at: new Date(),
    updated_at: new Date(),
    getPhrases: () => phrases
  };
}

export function createMockExtractedSpan(
  text: string,
  start: number,
  end: number,
  responseId: number,
  className: 'user_goal' | 'pain_point' | 'emotion' | 'request' | 'insight' | 'suggestion' | 'concern' = 'user_goal'
) {
  return {
    text,
    start,
    end,
    class: className,
    responseId
  };
}

