import { describe, it, expect, beforeEach, afterEach, beforeAll } from 'bun:test';
import { DatabaseClient } from '../database';
import { getDataSource } from '../data-source';
import { Response } from '../entities/Response';

// Restore real database before tests run
// This test file needs the real database, not mocks
beforeAll(async () => {
  const { restore } = await import('./setup-db-mock');
  if (restore) restore();
});

describe('DatabaseClient', () => {
  let db: DatabaseClient;
  const testSessionId = 'test-session-' + Date.now();

  beforeEach(async () => {
    db = new DatabaseClient();
    // Clean up test data
    await db.clearSessionData(testSessionId);
  });

  afterEach(async () => {
    // Clean up after each test
    await db.clearSessionData(testSessionId);
  });

  describe('getOrCreateSession', () => {
    it('should create a new session if it does not exist', async () => {
      const session = await db.getOrCreateSession(testSessionId);
      
      expect(session).toBeDefined();
      expect(session.session_id).toBe(testSessionId);
      expect(session.current_question).toBeNull();
    });

    it('should return existing session if it exists', async () => {
      const session1 = await db.getOrCreateSession(testSessionId);
      const session2 = await db.getOrCreateSession(testSessionId);
      
      expect(session1.session_id).toBe(session2.session_id);
    });
  });

  describe('saveCurrentQuestion', () => {
    it('should save question to session', async () => {
      await db.getOrCreateSession(testSessionId);
      await db.saveCurrentQuestion(testSessionId, 'Test question?');
      
      const question = await db.getCurrentQuestion(testSessionId);
      expect(question).toBe('Test question?');
    });
  });

  describe('getCurrentQuestion', () => {
    it('should return null if no question set', async () => {
      const freshSessionId = testSessionId + '-fresh';
      await db.clearSessionData(freshSessionId);
      await db.getOrCreateSession(freshSessionId);
      const question = await db.getCurrentQuestion(freshSessionId);
      
      expect(question).toBeNull();
    });

    it('should return saved question', async () => {
      await db.getOrCreateSession(testSessionId);
      await db.saveCurrentQuestion(testSessionId, 'What is your opinion?');
      
      const question = await db.getCurrentQuestion(testSessionId);
      expect(question).toBe('What is your opinion?');
    });
  });

  describe('clearSessionData', () => {
    it('should delete all responses and themes for session', async () => {
      await db.saveResponses(testSessionId, 'Test?', ['Response 1', 'Response 2'], 1);
      await db.saveThemes(testSessionId, [{
        name: 'Test Theme',
        description: 'Test',
        phrases: [],
        response_count: 0
      }]);
      
      await db.clearSessionData(testSessionId);
      
      const stats = await db.getStats(testSessionId);
      expect(stats.total_responses).toBe(0);
      expect(stats.total_themes).toBe(0);
    });
  });

  describe('saveResponses', () => {
    it('should save multiple responses', async () => {
      const result = await db.saveResponses(
        testSessionId,
        'Test question?',
        ['Response 1', 'Response 2', 'Response 3'],
        1
      );
      
      expect(result.success).toBe(true);
      expect(result.count).toBe(3);
      
      const stats = await db.getStats(testSessionId);
      expect(stats.total_responses).toBe(3);
    });

    it('should mark responses as unprocessed', async () => {
      await db.saveResponses(testSessionId, 'Test?', ['Response 1'], 1);
      
      const unprocessed = await db.getUnprocessedResponses(testSessionId);
      expect(unprocessed.responses.length).toBe(1);
      expect(unprocessed.responses[0].processed).toBe(false);
    });
  });

  describe('getUnprocessedResponses', () => {
    it('should return only unprocessed responses', async () => {
      await db.saveResponses(testSessionId, 'Test?', ['Response 1', 'Response 2'], 1);
      
      const dataSource = await getDataSource();
      const responseRepo = dataSource.getRepository(Response);
      const responses = await responseRepo.find({ where: { session_id: testSessionId } });
      
      // Mark one as processed
      await db.markResponsesProcessed([responses[0].id]);
      
      const unprocessed = await db.getUnprocessedResponses(testSessionId);
      expect(unprocessed.responses.length).toBe(1);
      expect(unprocessed.responses[0].id).toBe(responses[1].id);
    });

    it('should return empty array if all responses are processed', async () => {
      await db.saveResponses(testSessionId, 'Test?', ['Response 1'], 1);
      
      const dataSource = await getDataSource();
      const responseRepo = dataSource.getRepository(Response);
      const responses = await responseRepo.find({ where: { session_id: testSessionId } });
      
      await db.markResponsesProcessed([responses[0].id]);
      
      const unprocessed = await db.getUnprocessedResponses(testSessionId);
      expect(unprocessed.responses.length).toBe(0);
    });
  });

  describe('markResponsesProcessed', () => {
    it('should mark responses as processed', async () => {
      await db.saveResponses(testSessionId, 'Test?', ['Response 1'], 1);
      
      const dataSource = await getDataSource();
      const responseRepo = dataSource.getRepository(Response);
      const responses = await responseRepo.find({ where: { session_id: testSessionId } });
      
      await db.markResponsesProcessed([responses[0].id]);
      
      const updated = await responseRepo.findOne({ where: { id: responses[0].id } });
      expect(updated?.processed).toBe(true);
    });

    it('should handle empty array', async () => {
      // Should not throw and return immediately
      await db.markResponsesProcessed([]);
      expect(true).toBe(true); // Test passes if no error thrown
    });
  });

  describe('getResponses', () => {
    it('should return paginated responses', async () => {
      await db.saveResponses(
        testSessionId,
        'Test?',
        ['Response 1', 'Response 2', 'Response 3', 'Response 4', 'Response 5'],
        1
      );
      
      const page1 = await db.getResponses(testSessionId, 1, 2);
      expect(page1.responses.length).toBe(2);
      expect(page1.total).toBe(5);
      expect(page1.page).toBe(1);
      expect(page1.pageSize).toBe(2);
      expect(page1.totalPages).toBe(3);
    });

    it('should filter by batchId if provided', async () => {
      await db.saveResponses(testSessionId, 'Test?', ['Response 1'], 1);
      await db.saveResponses(testSessionId, 'Test?', ['Response 2'], 2);
      
      const batch1 = await db.getResponses(testSessionId, 1, 10, 1);
      expect(batch1.responses.length).toBe(1);
      expect(batch1.responses[0].batch_id).toBe(1);
    });
  });

  describe('saveThemes', () => {
    it('should save themes with phrases', async () => {
      await db.saveThemes(testSessionId, [{
        name: 'Theme 1',
        description: 'Description 1',
        phrases: [
          { text: 'phrase 1', class: 'user_goal' },
          { text: 'phrase 2', class: 'pain_point' }
        ],
        response_count: 5
      }]);
      
      const themes = await db.getThemes(testSessionId);
      expect(themes.length).toBe(1);
      expect(themes[0].name).toBe('Theme 1');
      expect(themes[0].response_count).toBe(5);
      
      const phrases = themes[0].getPhrases();
      expect(phrases.length).toBe(2);
    });
  });

  describe('updateTheme', () => {
    it('should update theme phrases', async () => {
      await db.saveThemes(testSessionId, [{
        name: 'Theme 1',
        description: 'Description',
        phrases: [{ text: 'old phrase', class: 'user_goal' }],
        response_count: 0
      }]);
      
      const themes = await db.getThemes(testSessionId);
      await db.updateTheme(themes[0].id, {
        phrases: [{ text: 'new phrase', class: 'pain_point' }]
      });
      
      const updated = await db.getThemes(testSessionId);
      const phrases = updated[0].getPhrases();
      expect(phrases[0].text).toBe('new phrase');
      expect(phrases[0].class).toBe('pain_point');
    });

    it('should update response count', async () => {
      await db.saveThemes(testSessionId, [{
        name: 'Theme 1',
        description: 'Description',
        phrases: [],
        response_count: 0
      }]);
      
      const themes = await db.getThemes(testSessionId);
      await db.updateTheme(themes[0].id, { response_count: 10 });
      
      const updated = await db.getThemes(testSessionId);
      expect(updated[0].response_count).toBe(10);
    });
  });

  describe('countMatchingResponses', () => {
    it('should count responses matching phrases', async () => {
      await db.saveResponses(testSessionId, 'Test?', [
        'I feel ignored by support',
        'Support team is helpful',
        'I need better support'
      ], 1);
      
      const count = await db.countMatchingResponses(testSessionId, [
        { text: 'support', class: 'pain_point' },
        { text: 'ignored', class: 'emotion' }
      ]);
      
      // Should match responses containing "support" or "ignored"
      expect(count).toBeGreaterThanOrEqual(2);
    });

    it('should return 0 for empty phrases', async () => {
      const count = await db.countMatchingResponses(testSessionId, []);
      expect(count).toBe(0);
    });

    it('should be case-insensitive', async () => {
      await db.saveResponses(testSessionId, 'Test?', ['I need SUPPORT'], 1);
      
      const count = await db.countMatchingResponses(testSessionId, [
        { text: 'support', class: 'request' }
      ]);
      
      expect(count).toBe(1);
    });
  });

  describe('getStats', () => {
    it('should return correct statistics', async () => {
      await db.saveResponses(testSessionId, 'Test?', ['Response 1', 'Response 2'], 1);
      await db.saveResponses(testSessionId, 'Test?', ['Response 3'], 2);
      await db.saveThemes(testSessionId, [{
        name: 'Theme 1',
        description: 'Description',
        phrases: [],
        response_count: 0
      }]);
      
      const stats = await db.getStats(testSessionId);
      
      expect(stats.total_responses).toBe(3);
      expect(stats.total_themes).toBe(1);
      expect(stats.batches_generated).toBe(2);
    });

    it('should count processed batches correctly', async () => {
      await db.saveResponses(testSessionId, 'Test?', ['Response 1'], 1);
      await db.saveResponses(testSessionId, 'Test?', ['Response 2'], 2);
      
      const dataSource = await getDataSource();
      const responseRepo = dataSource.getRepository(Response);
      const responses = await responseRepo.find({ where: { session_id: testSessionId } });
      
      // Mark all responses in batch 1 as processed
      await db.markResponsesProcessed([responses[0].id]);
      
      const stats = await db.getStats(testSessionId);
      expect(stats.batches_processed).toBe(1);
    });
  });
});

