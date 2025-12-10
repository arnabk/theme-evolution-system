/**
 * Database Mock for Testing
 * Provides mock implementations of all database methods
 */

import type { Theme, Response, Session, ThemePhrase } from '../database';

// Add getPhrases method to mock Theme objects
function addGetPhrasesMethod(theme: Theme): Theme & { getPhrases: () => ThemePhrase[] } {
  return {
    ...theme,
    getPhrases: function() {
      try {
        return JSON.parse(this.phrases || '[]') as ThemePhrase[];
      } catch {
        return [];
      }
    }
  };
}

export class MockDatabaseClient {
  private sessions: Map<string, Session> = new Map();
  private responses: Map<number, Response> = new Map();
  private themes: Map<number, Theme> = new Map();
  private nextResponseId = 1;
  private nextThemeId = 1;
  private isResetting = false;

  async getOrCreateSession(sessionId: string): Promise<Session> {
    if (!this.sessions.has(sessionId)) {
      const session: Session = {
        id: this.sessions.size + 1,
        session_id: sessionId,
        current_question: null,
        created_at: new Date().toISOString()
      };
      this.sessions.set(sessionId, session);
    }
    return this.sessions.get(sessionId)!;
  }

  async saveCurrentQuestion(sessionId: string, question: string): Promise<void> {
    const session = await this.getOrCreateSession(sessionId);
    session.current_question = question;
  }

  async getCurrentQuestion(sessionId: string): Promise<string | null> {
    const session = await this.getOrCreateSession(sessionId);
    return session.current_question;
  }

  async clearSessionData(sessionId: string): Promise<void> {
    // Remove all responses for this session
    for (const [id, response] of Array.from(this.responses.entries())) {
      if (response.session_id === sessionId) {
        this.responses.delete(id);
      }
    }
    // Remove all themes for this session
    for (const [id, theme] of Array.from(this.themes.entries())) {
      if (theme.session_id === sessionId) {
        this.themes.delete(id);
      }
    }
    // Also clear the session's current question if it exists
    const session = this.sessions.get(sessionId);
    if (session) {
      session.current_question = null;
    }
  }

  async saveResponses(sessionId: string, question: string, responses: string[], batchId: number): Promise<{ success: boolean; count: number }> {
    if (this.isResetting) {
      throw new Error('Cannot save responses while database is being reset');
    }
    
    await this.getOrCreateSession(sessionId);
    
    const responsesBefore = Array.from(this.responses.values()).filter(r => r.session_id === sessionId).length;
    
    for (const text of responses) {
      const response: Response = {
        id: this.nextResponseId++,
        session_id: sessionId,
        response_text: text,
        question,
        batch_id: batchId,
        processed: false,
        created_at: new Date().toISOString()
      };
      this.responses.set(response.id, response);
    }
    
    // Verify responses were saved - check that we added the expected number
    const responsesAfter = Array.from(this.responses.values()).filter(r => r.session_id === sessionId).length;
    const actuallyAdded = responsesAfter - responsesBefore;
    if (actuallyAdded !== responses.length) {
      console.error(`[MOCK DB] saveResponses: Expected to save ${responses.length} responses, but actually added ${actuallyAdded} for session ${sessionId} (before: ${responsesBefore}, after: ${responsesAfter}, total in DB: ${this.responses.size})`);
    }
    
    return { success: true, count: responses.length };
  }

  async getResponses(sessionId: string, page: number = 1, pageSize: number = 10, batchId?: number): Promise<{ responses: Response[]; total: number; totalPages: number; page: number; pageSize: number }> {
    if (this.isResetting) {
      // If reset is in progress, return empty results
      return { responses: [], total: 0, totalPages: 0, page, pageSize };
    }
    
    const allResponses = Array.from(this.responses.values());
    let filtered = allResponses.filter(r => r.session_id === sessionId);
    
    // Debug logging for test isolation issues
    if (filtered.length === 0 && allResponses.length > 0 && sessionId.includes('test-session')) {
      const otherSessions = new Set(allResponses.map(r => r.session_id));
      console.error(`[MOCK DB] getResponses: Found 0 responses for session ${sessionId}, but DB has ${allResponses.length} total responses from ${otherSessions.size} other sessions`);
    }
    
    if (batchId !== undefined) {
      filtered = filtered.filter(r => r.batch_id === batchId);
    }
    
    // Sort by created_at DESC (newest first)
    filtered.sort((a, b) => b.created_at.localeCompare(a.created_at));
    
    const total = filtered.length;
    const totalPages = Math.ceil(total / pageSize);
    const startIdx = (page - 1) * pageSize;
    const responses = filtered.slice(startIdx, startIdx + pageSize);
    
    return { responses, total, totalPages, page, pageSize };
  }

  async getUnprocessedResponses(sessionId: string): Promise<{ responses: Response[]; total: number }> {
    const responses = Array.from(this.responses.values())
      .filter(r => r.session_id === sessionId && !r.processed)
      .sort((a, b) => a.created_at.localeCompare(b.created_at));
    return { responses, total: responses.length };
  }

  async markResponsesProcessed(responseIds: number[]): Promise<void> {
    for (const id of responseIds) {
      const response = this.responses.get(id);
      if (response) {
        response.processed = true;
      }
    }
  }

  async saveThemes(sessionId: string, themes: Array<{ name: string; description: string; phrases: ThemePhrase[]; response_count: number }>): Promise<void> {
    await this.getOrCreateSession(sessionId);
    
    for (const themeData of themes) {
      const theme: Theme = {
        id: this.nextThemeId++,
        session_id: sessionId,
        name: themeData.name,
        description: themeData.description,
        phrases: JSON.stringify(themeData.phrases),
        response_count: themeData.response_count,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      this.themes.set(theme.id, theme);
    }
  }

  async getThemes(sessionId: string): Promise<Theme[]> {
    const themes = Array.from(this.themes.values())
      .filter(t => t.session_id === sessionId)
      .sort((a, b) => (b.updated_at || b.created_at || '').localeCompare(a.updated_at || a.created_at || ''));
    // Add getPhrases method to each theme
    return themes.map(addGetPhrasesMethod);
  }

  async updateTheme(themeId: number, updates: { phrases?: ThemePhrase[]; response_count?: number }): Promise<void> {
    const theme = this.themes.get(themeId);
    if (theme) {
      if (updates.phrases !== undefined) theme.phrases = JSON.stringify(updates.phrases);
      if (updates.response_count !== undefined) theme.response_count = updates.response_count;
      theme.updated_at = new Date().toISOString();
    }
  }

  async countMatchingResponses(sessionId: string, phrases: ThemePhrase[]): Promise<number> {
    const responses = Array.from(this.responses.values())
      .filter(r => r.session_id === sessionId);
    
    if (phrases.length === 0) return 0;
    
    let count = 0;
    for (const response of responses) {
      const lowerText = response.response_text.toLowerCase();
      for (const phrase of phrases) {
        if (lowerText.includes(phrase.text.toLowerCase())) {
          count++;
          break; // Count each response only once
        }
      }
    }
    
    return count;
  }

  async recalculateThemeResponseCounts(sessionId: string): Promise<void> {
    const themes = await this.getThemes(sessionId);
    
    for (const theme of themes) {
      const phrases: ThemePhrase[] = JSON.parse(theme.phrases || '[]');
      const count = await this.countMatchingResponses(sessionId, phrases);
      await this.updateTheme(theme.id, { response_count: count });
    }
  }

  async getStats(sessionId: string): Promise<{ total_responses: number; total_themes: number; batches_generated: number; batches_processed: number }> {
    const responses = Array.from(this.responses.values())
      .filter(r => r.session_id === sessionId);
    const themes = Array.from(this.themes.values())
      .filter(t => t.session_id === sessionId);
    
    const batches = new Set(responses.map(r => r.batch_id));
    const processedBatches = new Set(
      responses.filter(r => r.processed).map(r => r.batch_id)
    );
    
    return {
      total_responses: responses.length,
      total_themes: themes.length,
      batches_generated: batches.size,
      batches_processed: processedBatches.size
    };
  }

  // Helper method to reset all data
  reset(): void {
    if (this.isResetting) {
      // Prevent recursive resets
      return;
    }
    this.isResetting = true;
    try {
      this.sessions.clear();
      this.responses.clear();
      this.themes.clear();
      this.nextResponseId = 1;
      this.nextThemeId = 1;
    } finally {
      this.isResetting = false;
    }
  }

  // Additional methods to match DatabaseClient interface
  async getAllResponses(sessionId: string): Promise<Response[]> {
    const allResponses = Array.from(this.responses.values());
    const filtered = allResponses.filter(r => r.session_id === sessionId);
    if (filtered.length === 0 && allResponses.length > 0) {
      console.error(`[MOCK DB] getAllResponses: No responses found for session ${sessionId}. Total responses: ${allResponses.length}, Session IDs: ${[...new Set(allResponses.map(r => r.session_id))].join(', ')}`);
    }
    return filtered.sort((a, b) => b.created_at.localeCompare(a.created_at)); // DESC order
  }

  // Helper to find theme by ID across all sessions
  async findThemeById(themeId: number): Promise<Theme | null> {
    for (const theme of this.themes.values()) {
      if (theme.id === themeId) {
        // Add getPhrases method if not present
        return addGetPhrasesMethod(theme);
      }
    }
    return null;
  }
}

export const mockDb = new MockDatabaseClient();

