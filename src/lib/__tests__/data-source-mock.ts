/**
 * Data Source Mock for Testing
 * Mocks TypeORM DataSource to prevent actual database connections
 * Integrates with mockDb to provide data
 */

import type { EntityTarget, FindOptionsOrder, FindOptionsWhere } from 'typeorm';
import { mockDb } from './database-mock';
import type { Theme, Response, Session } from '../database';

// Type for order options
type OrderOptions = FindOptionsOrder<Theme> | FindOptionsOrder<Response> | FindOptionsOrder<Session> | Record<string, 'ASC' | 'DESC'> | undefined;

// Type for repository methods
interface MockRepository<T> {
  findOne: (options: { where: FindOptionsWhere<T> }) => Promise<T | null>;
  find: (options?: { where?: FindOptionsWhere<T>; order?: OrderOptions; skip?: number; take?: number; select?: string[] }) => Promise<T[]>;
  findAndCount?: (options: { where: FindOptionsWhere<T>; order?: OrderOptions; skip?: number; take?: number }) => Promise<[T[], number]>;
  create: (data: Partial<T>) => T;
  save: (data: T | T[]) => Promise<T | T[]>;
  update: (criteria: unknown, data: Partial<T>) => Promise<{ affected: number }>;
  delete: (criteria: unknown) => Promise<{ affected: number }>;
  count?: (options: { where: FindOptionsWhere<T> }) => Promise<number>;
  createQueryBuilder?: () => unknown;
}

export class MockDataSource {
  private repositories: Map<string, MockRepository<Theme | Response | Session>> = new Map();

  getRepository<T extends Theme | Response | Session>(entity: EntityTarget<T>): MockRepository<T> {
    const entityName = (typeof entity === 'function' ? entity.name : String(entity)) || 'Entity';
    if (!this.repositories.has(entityName)) {
      // Create repository that uses mockDb
      // Note: Response is exported as alias for ResponseEntity, so entity.name is 'ResponseEntity'
      if (entityName === 'Theme') {
        this.repositories.set(entityName, this.createThemeRepository());
      } else if (entityName === 'Response' || entityName === 'ResponseEntity') {
        this.repositories.set(entityName, this.createResponseRepository());
      } else if (entityName === 'Session') {
        this.repositories.set(entityName, this.createSessionRepository());
      } else {
        this.repositories.set(entityName, this.createDefaultRepository());
      }
    }
    return this.repositories.get(entityName);
  }

  private createThemeRepository() {
    return {
      findOne: async (options: { where: { id: number } | { session_id: string } }) => {
        if ('id' in options.where) {
          return await mockDb.findThemeById(options.where.id);
        }
        if ('session_id' in options.where) {
          const themes = await mockDb.getThemes(options.where.session_id);
          return themes[0] || null;
        }
        return null;
      },
      find: async (options: { where: { session_id?: string; id?: number }, order?: OrderOptions }) => {
        if (options.where.id) {
          const themes = await mockDb.getThemes('any');
          const theme = themes.find(t => t.id === options.where.id);
          return theme ? [theme] : [];
        }
        if (options.where.session_id) {
          return await mockDb.getThemes(options.where.session_id);
        }
        return [];
      },
      create: (data: Partial<Theme>) => data as Theme,
      save: async (data: Theme | Theme[]) => data,
      update: async () => ({ affected: 1 }),
      delete: async () => ({ affected: 1 }),
      count: async (options: { where: { session_id: string } }) => {
        const themes = await mockDb.getThemes(options.where.session_id);
        return themes.length;
      },
      createQueryBuilder: () => ({
        where: () => this,
        andWhere: () => this,
        orderBy: () => this,
        skip: () => this,
        take: () => this,
        getMany: async () => [],
        getOne: async () => null,
        getCount: async () => 0
      })
    };
  }

  private createResponseRepository() {
    return {
      findOne: async () => null,
      find: async (options?: { where?: { session_id?: string; processed?: boolean; batch_id?: number }, order?: OrderOptions, skip?: number, take?: number, select?: string[] }) => {
        // Handle case where options might be undefined or where might be undefined
        if (!options || !options.where || !options.where.session_id) {
          return [];
        }
        
        const sessionId = options.where.session_id;
        
        // Check if we're filtering by processed status
        if ('processed' in options.where && options.where.processed === false) {
          const result = await mockDb.getUnprocessedResponses(sessionId);
          return result.responses;
        }
        // If skip/take not provided, return all responses
        if (options.skip === undefined && options.take === undefined) {
          return await mockDb.getAllResponses(sessionId);
        }
        // Otherwise paginate
        const result = await mockDb.getResponses(sessionId, 
          options.skip ? Math.floor(options.skip / (options.take || 10)) + 1 : 1, 
          options.take || 10);
        return result.responses;
      },
      findAndCount: async (options: { where: { session_id: string; batch_id?: number }, order?: OrderOptions, skip?: number, take?: number }) => {
        const result = await mockDb.getResponses(options.where.session_id,
          options.skip ? Math.floor(options.skip / (options.take || 10)) + 1 : 1,
          options.take || 10,
          options.where.batch_id);
        return [result.responses, result.total];
      },
      create: (data: Partial<Response>) => data as Response,
      save: async (data: Response | Response[]) => data,
      update: async () => ({ affected: 1 }),
      delete: async (options: { session_id: string }) => {
        await mockDb.clearSessionData(options.session_id);
        return { affected: 1 };
      },
      count: async (options: { where: { session_id: string } }) => {
        const result = await mockDb.getResponses(options.where.session_id);
        return result.total;
      },
      createQueryBuilder: () => ({
        update: () => ({
          set: () => ({
            where: () => ({
              execute: async () => ({ affected: 1 })
            })
          })
        }),
        where: () => this,
        andWhere: () => this,
        orderBy: () => this,
        skip: () => this,
        take: () => this,
        getMany: async () => [],
        getOne: async () => null,
        getCount: async () => 0
      })
    };
  }

  private createSessionRepository() {
    return {
      findOne: async (options: { where: { session_id: string } }) => {
        const session = await mockDb.getOrCreateSession(options.where.session_id);
        return session;
      },
      find: async () => [],
      create: (data: Partial<Session>) => data as Session,
      save: async (data: Session | Session[]) => data,
      update: async () => ({ affected: 1 }),
      delete: async () => ({ affected: 1 })
    };
  }

  private createDefaultRepository() {
    return {
      findOne: async () => null,
      find: async () => [],
      create: <T>(data: Partial<T>) => data as T,
      save: async <T>(data: T | T[]) => data,
      update: async () => ({ affected: 1 }),
      delete: async () => ({ affected: 1 }),
      count: async () => 0,
      createQueryBuilder: () => ({
        where: () => this,
        andWhere: () => this,
        orderBy: () => this,
        skip: () => this,
        take: () => this,
        getMany: async () => [],
        getOne: async () => null,
        getCount: async () => 0
      })
    };
  }

  isInitialized = true;
  async initialize() { return this; }
  async destroy() {}
}

let mockDataSourceInstance: MockDataSource | null = null;

export function getMockDataSource(): MockDataSource {
  if (!mockDataSourceInstance) {
    mockDataSourceInstance = new MockDataSource();
  }
  return mockDataSourceInstance;
}

export function resetMockDataSource(): void {
  mockDataSourceInstance = null;
}

