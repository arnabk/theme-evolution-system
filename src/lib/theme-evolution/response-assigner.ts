/**
 * Response Assigner - Assign responses to themes
 */

import { llm } from '../llm';

export interface ThemeAssignmentResult {
  response_id: number;
  theme_id: number;
  confidence: number;
  contributing_text: string;
  highlighted_keywords: string | null;
}

export async function assignResponseToThemes(
  response: { id: number; response_text: string },
  themes: any[]
): Promise<ThemeAssignmentResult[]> {
  const assignmentPrompt = `Given this response and list of themes, identify which themes (1-3) best apply to the response.

Response: "${response.response_text}"

Themes:
${themes.map((t, idx) => `${idx + 1}. ${t.name}: ${t.description}`).join('\n')}

Respond with ONLY a JSON array of theme numbers that apply (e.g., [1, 3]):`;

  try {
    const assignmentResponse = await llm.generate({
      model: 'llama3.2:3b',
      prompt: assignmentPrompt,
      temperature: 0.2,
    });

    // Parse the response
    const numberMatch = assignmentResponse.match(/\[[\d,\s]+\]/);
    if (!numberMatch) {
      return [];
    }

    const themeIndices = JSON.parse(numberMatch[0]);
    const assignments: ThemeAssignmentResult[] = [];
    
    for (const themeIdx of themeIndices) {
      if (themeIdx >= 1 && themeIdx <= themes.length) {
        assignments.push({
          response_id: response.id,
          theme_id: themeIdx,
          confidence: 0.85,
          contributing_text: themes[themeIdx - 1].keywords || '',
          highlighted_keywords: null,
        });
      }
    }
    
    return assignments;
  } catch (error) {
    console.error(`Failed to assign response ${response.id}:`, error);
    return [];
  }
}

export async function assignAllResponses(
  responses: any[],
  themes: any[],
  onProgress?: (current: number, total: number) => void
): Promise<ThemeAssignmentResult[]> {
  const allAssignments: ThemeAssignmentResult[] = [];
  
  for (let i = 0; i < responses.length; i++) {
    if (onProgress) {
      onProgress(i + 1, responses.length);
    }
    
    const assignments = await assignResponseToThemes(responses[i], themes);
    allAssignments.push(...assignments);
  }
  
  return allAssignments;
}

