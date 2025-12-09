/**
 * Database Client - TypeScript implementation using TypeORM + SQLite
 * Simplified: No assignments table, themes store phrases directly
 */

import { getDataSource } from './data-source';
import { Theme, ThemePhrase } from './entities/Theme';
import { Response } from './entities/Response';
import { Session } from './entities/Session';

export type { Theme, Response, Session, ThemePhrase };

export class DatabaseClient {
  async getOrCreateSession(sessionId: string): Promise<Session> {
    const dataSource = await getDataSource();
    const sessionRepo = dataSource.getRepository(Session);
    
    let session = await sessionRepo.findOne({ where: { session_id: sessionId } });
    
    if (!session) {
      session = sessionRepo.create({ session_id: sessionId, current_question: null });
      await sessionRepo.save(session);
      console.log('✅ Session created in DB:', sessionId);
    }
    
    return session;
  }

  async saveCurrentQuestion(sessionId: string, question: string): Promise<void> {
    const dataSource = await getDataSource();
    const sessionRepo = dataSource.getRepository(Session);
    
    await sessionRepo.update({ session_id: sessionId }, { current_question: question });
  }

  async getCurrentQuestion(sessionId: string): Promise<string | null> {
    const session = await this.getOrCreateSession(sessionId);
    return session.current_question;
  }

  async clearSessionData(sessionId: string): Promise<void> {
    const dataSource = await getDataSource();
    const responseRepo = dataSource.getRepository(Response);
    const themeRepo = dataSource.getRepository(Theme);

    // Delete all responses and themes for this session
    await responseRepo.delete({ session_id: sessionId });
    await themeRepo.delete({ session_id: sessionId });
    
    console.log('✅ Session data cleared for:', sessionId);
  }

  async getStats(sessionId: string) {
    const dataSource = await getDataSource();
    const responseRepo = dataSource.getRepository(Response);
    const themeRepo = dataSource.getRepository(Theme);

    const [total_responses, total_themes] = await Promise.all([
      responseRepo.count({ where: { session_id: sessionId } }),
      themeRepo.count({ where: { session_id: sessionId } }),
    ]);

    // Get distinct batch IDs
    const allResponses = await responseRepo.find({ 
      where: { session_id: sessionId },
      select: ['batch_id', 'processed'] 
    });
    
    const uniqueBatchIds = new Set(allResponses.map(r => r.batch_id));
    const batches_generated = uniqueBatchIds.size;

    // Count batches where all responses are processed
    const processedBatchIds = new Set(
      allResponses.filter(r => r.processed).map(r => r.batch_id)
    );
    const batches_processed = processedBatchIds.size;

    return {
      total_responses,
      total_themes,
      batches_generated,
      batches_processed,
    };
  }

  async getThemes(sessionId: string): Promise<Theme[]> {
    const dataSource = await getDataSource();
    const themeRepo = dataSource.getRepository(Theme);
    
    const themes = await themeRepo.find({
      where: { session_id: sessionId },
      order: { updated_at: 'DESC' },
    });

    return themes;
  }

  async getUnprocessedResponses(sessionId: string) {
    const dataSource = await getDataSource();
    const responseRepo = dataSource.getRepository(Response);
    
    const unprocessedResponses = await responseRepo.find({
      where: { session_id: sessionId, processed: false },
      order: { created_at: 'ASC' }
    });
    
    return {
      responses: unprocessedResponses,
      total: unprocessedResponses.length
    };
  }

  async markResponsesProcessed(responseIds: number[]): Promise<void> {
    if (responseIds.length === 0) return;
    
    const dataSource = await getDataSource();
    const responseRepo = dataSource.getRepository(Response);
    
    await responseRepo
      .createQueryBuilder()
      .update()
      .set({ processed: true })
      .where('id IN (:...ids)', { ids: responseIds })
      .execute();
  }

  async getResponses(sessionId: string, page: number = 1, pageSize: number = 10, batchId?: number) {
    const dataSource = await getDataSource();
    const responseRepo = dataSource.getRepository(Response);
    
    const skip = (page - 1) * pageSize;
    const where: { session_id: string; batch_id?: number } = { session_id: sessionId };
    if (batchId) where.batch_id = batchId;

    const [responses, total] = await responseRepo.findAndCount({
      where,
      order: { created_at: 'DESC' },
      skip,
      take: pageSize,
    });

    return {
      responses,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async saveResponses(sessionId: string, question: string, responses: string[], batchId: number) {
    const dataSource = await getDataSource();
    const responseRepo = dataSource.getRepository(Response);

    const entities = responses.map(responseText => 
      responseRepo.create({ 
        session_id: sessionId, 
        response_text: responseText, 
        batch_id: batchId, 
        question,
        processed: false 
      })
    );

    await responseRepo.save(entities);
    return { success: true, count: entities.length };
  }

  async saveThemes(sessionId: string, themes: Array<{
    name: string;
    description: string;
    phrases: ThemePhrase[];
    response_count: number;
  }>): Promise<void> {
    const dataSource = await getDataSource();
    const themeRepo = dataSource.getRepository(Theme);

    const themeEntities = themes.map(t => 
      themeRepo.create({
        session_id: sessionId,
        name: t.name,
        description: t.description,
        phrases: JSON.stringify(t.phrases),
        response_count: t.response_count
      })
    );

    await themeRepo.save(themeEntities);
  }

  /**
   * Update an existing theme (merge phrases)
   */
  async updateTheme(themeId: number, updates: {
    phrases?: ThemePhrase[];
    response_count?: number;
  }): Promise<void> {
    const dataSource = await getDataSource();
    const themeRepo = dataSource.getRepository(Theme);

    const updateData: Partial<Theme> = {};
    if (updates.phrases) {
      updateData.phrases = JSON.stringify(updates.phrases);
    }
    if (updates.response_count !== undefined) {
      updateData.response_count = updates.response_count;
    }

    await themeRepo.update({ id: themeId }, updateData);
  }

  /**
   * Get all responses for a session
   */
  async getAllResponses(sessionId: string): Promise<Response[]> {
    const dataSource = await getDataSource();
    const responseRepo = dataSource.getRepository(Response);
    
    return responseRepo.find({
      where: { session_id: sessionId },
      order: { created_at: 'ASC' }
    });
  }

  /**
   * Count responses that match a theme's phrases
   * Searches ALL responses for phrase matches
   */
  async countMatchingResponses(sessionId: string, phrases: ThemePhrase[]): Promise<number> {
    if (phrases.length === 0) return 0;
    
    const allResponses = await this.getAllResponses(sessionId);
    let matchCount = 0;

    for (const response of allResponses) {
      const lowerText = response.response_text.toLowerCase();
      
      // Check if any phrase matches this response
      const hasMatch = phrases.some(phrase => 
        lowerText.includes(phrase.text.toLowerCase())
      );
      
      if (hasMatch) {
        matchCount++;
      }
    }

    return matchCount;
  }

  /**
   * Recalculate response counts for all themes in a session
   * Based on actual phrase matches across ALL responses
   */
  async recalculateThemeResponseCounts(sessionId: string): Promise<void> {
    const themes = await this.getThemes(sessionId);
    
    console.log(`📊 Recalculating response counts for ${themes.length} themes...`);
    
    for (const theme of themes) {
      const phrases = theme.getPhrases();
      const count = await this.countMatchingResponses(sessionId, phrases);
      
      await this.updateTheme(theme.id, { response_count: count });
      console.log(`   "${theme.name.substring(0, 40)}...": ${count} responses`);
    }
  }
}

export const db = new DatabaseClient();
