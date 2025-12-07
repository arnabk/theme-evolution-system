/**
 * Database Client - TypeScript implementation using TypeORM + SQLite
 */

import { getDataSource } from './data-source';
import { Theme } from './entities/Theme';
import { Response } from './entities/Response';
import { ThemeAssignment } from './entities/ThemeAssignment';
import { Session } from './entities/Session';

export type { Theme, Response, ThemeAssignment, Session };

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
    const assignmentRepo = dataSource.getRepository(ThemeAssignment);

    // Get all response IDs for this session
    const responses = await responseRepo.find({ 
      where: { session_id: sessionId },
      select: ['id']
    });
    const responseIds = responses.map(r => r.id);

    // Delete all responses for this session
    if (responseIds.length > 0) {
      await responseRepo.delete({ session_id: sessionId });
    }
    
    // Delete all themes for this session
    const themes = await themeRepo.find({ 
      where: { session_id: sessionId },
      select: ['id']
    });
    if (themes.length > 0) {
      await themeRepo.delete({ session_id: sessionId });
    }
    
    // Delete all assignments for these responses
    if (responseIds.length > 0) {
      await assignmentRepo
        .createQueryBuilder()
        .delete()
        .where('response_id IN (:...ids)', { ids: responseIds })
        .execute();
    }
    
    console.log('✅ Session data cleared for:', sessionId);
  }

  async getStats(sessionId: string) {
    const dataSource = await getDataSource();
    const responseRepo = dataSource.getRepository(Response);
    const themeRepo = dataSource.getRepository(Theme);
    const assignmentRepo = dataSource.getRepository(ThemeAssignment);

    const [total_responses, total_themes] = await Promise.all([
      responseRepo.count({ where: { session_id: sessionId } }),
      themeRepo.count({ where: { is_active: true, session_id: sessionId } }),
    ]);

    // Get distinct batch IDs for this session
    const allResponses = await responseRepo.find({ 
      where: { session_id: sessionId },
      select: ['batch_id', 'id'] 
    });
    const uniqueBatchIds = new Set(allResponses.map(r => r.batch_id));
    const batches_generated = uniqueBatchIds.size;

    // Get batches with assignments
    const assignments = await assignmentRepo.find();
    const processedBatchIds = new Set(
      allResponses
        .filter(r => assignments.some(a => a.response_id === r.id))
        .map(r => r.batch_id)
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
    const assignmentRepo = dataSource.getRepository(ThemeAssignment);
    
    const themes = await themeRepo.find({
      where: { is_active: true, session_id: sessionId },
      order: { updated_at: 'DESC' },
    });

    // Get contributing response counts for each theme
    const themesWithCounts = await Promise.all(
      themes.map(async (theme) => {
        const assignments = await assignmentRepo.find({
          where: { theme_id: theme.id },
        });
        
        // Extract keywords from description if available
        const keywordsMatch = theme.description?.match(/Keywords:\s*([^.]+)/);
        const keywords = keywordsMatch 
          ? keywordsMatch[1].split(',').map(k => k.trim()).filter(k => k)
          : [];

        return {
          ...theme,
          contributing_responses: assignments.length,
          keywords,
        };
      })
    );

    return themesWithCounts as any;
  }

  async getResponses(sessionId: string, page: number = 1, pageSize: number = 10, batchId?: number) {
    const dataSource = await getDataSource();
    const responseRepo = dataSource.getRepository(Response);
    
    const skip = (page - 1) * pageSize;
    const where: any = { session_id: sessionId };
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
      responseRepo.create({ session_id: sessionId, response_text: responseText, batch_id: batchId, question })
    );

    await responseRepo.save(entities);
    return { success: true, count: entities.length };
  }

  async saveThemes(sessionId: string, themes: Partial<Theme>[], assignments: Partial<ThemeAssignment>[]) {
    const dataSource = await getDataSource();
    const themeRepo = dataSource.getRepository(Theme);
    const assignmentRepo = dataSource.getRepository(ThemeAssignment);

    // Convert embedding arrays to JSON strings and add session_id
    const themesWithStringEmbeddings = themes.map(t => ({
      ...t,
      session_id: sessionId,
      centroid_embedding: t.centroid_embedding ? JSON.stringify(t.centroid_embedding) : null,
    }));

    const savedThemes = await themeRepo.save(themesWithStringEmbeddings as Theme[]);
    
    // Map theme IDs for assignments
    const assignmentsWithIds = assignments.map((a, i) => ({
      ...a,
      theme_id: savedThemes[i % savedThemes.length].id,
    }));

    await assignmentRepo.save(assignmentsWithIds as ThemeAssignment[]);
    return { success: true };
  }
}

export const db = new DatabaseClient();
