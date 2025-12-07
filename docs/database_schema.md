# Database Schema

This document describes the database schema for the Theme Evolution System.

## Overview

The system uses **SQLite** with **TypeORM** for database operations. The schema is automatically created and synchronized on application startup - no manual migrations required.

**Database File**: `theme-evolution.db` (SQLite file in project root)

## TypeORM Entities

All entities are defined in `src/lib/entities/` and use TypeORM decorators for auto-schema generation.

## Core Tables

### 1. themes

Stores themes extracted from survey responses.

```typescript
@Entity('themes')
export class Theme {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text' })
  session_id: string;

  @Column({ type: 'text' })
  name: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'real' })
  confidence: number;

  @Column({ type: 'text', nullable: true })
  centroid_embedding: string | null;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
```

**Fields:**
- `id` - Auto-incrementing primary key
- `session_id` - Session identifier for data isolation
- `name` - Theme name (e.g., "Remote Work Challenges")
- `description` - Detailed theme description
- `confidence` - Confidence score (0.0 to 1.0)
- `centroid_embedding` - JSON string of centroid embedding vector
- `is_active` - Whether theme is currently active
- `created_at` - Timestamp when theme was created
- `updated_at` - Timestamp when theme was last updated

### 2. responses

Stores individual survey responses.

```typescript
@Entity('responses')
export class Response {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text' })
  session_id: string;

  @Column({ type: 'text' })
  response_text: string;

  @Column({ type: 'integer' })
  batch_id: number;

  @Column({ type: 'text' })
  question: string;

  @CreateDateColumn()
  created_at: Date;
}
```

**Fields:**
- `id` - Auto-incrementing primary key
- `session_id` - Session identifier
- `response_text` - The actual response text
- `batch_id` - Batch number this response belongs to
- `question` - The survey question being answered
- `created_at` - Timestamp when response was created

### 3. response_theme_assignments

Maps responses to themes with confidence scores and highlighted keywords.

```typescript
@Entity('response_theme_assignments')
export class ThemeAssignment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'integer' })
  response_id: number;

  @Column({ type: 'integer' })
  theme_id: number;

  @Column({ type: 'real' })
  confidence: number;

  @Column({ type: 'text', nullable: true })
  highlighted_keywords: string | null;

  @Column({ type: 'text', nullable: true })
  contributing_text: string | null;

  @CreateDateColumn()
  created_at: Date;
}
```

**Fields:**
- `id` - Auto-incrementing primary key
- `response_id` - Foreign key to responses table
- `theme_id` - Foreign key to themes table
- `confidence` - Similarity score (0.0 to 1.0)
- `highlighted_keywords` - JSON array: `[{ text: string, start: number, end: number }]`
- `contributing_text` - The specific text that matched the theme
- `created_at` - Timestamp when assignment was created

### 4. sessions

Stores session state for multi-user support.

```typescript
@Entity('sessions')
export class Session {
  @PrimaryColumn({ type: 'text' })
  session_id: string;

  @Column({ type: 'text', nullable: true })
  current_question: string | null;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
```

**Fields:**
- `session_id` - Session identifier (primary key)
- `current_question` - Current active question
- `created_at` - Timestamp when session was created
- `updated_at` - Timestamp when session was last updated

## Relationships

### Entity Relationship Diagram

```
sessions (1) ←→ (M) responses
sessions (1) ←→ (M) themes

responses (1) ←→ (M) response_theme_assignments (M) ←→ (1) themes
```

### Key Relationships

1. **Session → Responses**: One-to-many (session has many responses)
2. **Session → Themes**: One-to-many (session has many themes)
3. **Response → Theme**: Many-to-many through `response_theme_assignments`
4. **Response → ThemeAssignment**: One-to-many
5. **Theme → ThemeAssignment**: One-to-many

## Data Types

### SQLite Type Mapping

TypeORM automatically maps TypeScript types to SQLite types:

| TypeScript Type | SQLite Type | Example |
|----------------|-------------|---------|
| `number` (int) | `INTEGER` | `id`, `batch_id` |
| `number` (float) | `REAL` | `confidence` |
| `string` | `TEXT` | `name`, `description` |
| `boolean` | `BOOLEAN` (0/1) | `is_active` |
| `Date` | `DATETIME` | `created_at` |
| `string \| null` | `TEXT` (nullable) | `centroid_embedding` |

### JSON Fields

Several fields store JSON as text strings:

- **`centroid_embedding`**: Array of numbers (embedding vector)
  ```json
  "[0.1, 0.2, 0.3, ...]"
  ```

- **`highlighted_keywords`**: Array of keyword objects
  ```json
  "[{\"text\": \"remote\", \"start\": 0, \"end\": 6}, ...]"
  ```

## Indexes

TypeORM automatically creates indexes for:
- Primary keys (`id`, `session_id`)
- Foreign keys (implicit through relationships)

No manual index creation required for current scale.

## Schema Management

### Auto-Sync on Startup

The database schema is automatically created/updated when the application starts:

```typescript
// src/lib/data-source.ts
const AppDataSource = new DataSource({
  type: 'sqlite',
  database: 'theme-evolution.db',
  synchronize: true,  // Auto-sync schema
  logging: false,
  entities: [Theme, Response, ThemeAssignment, Session]
});
```

**Benefits:**
- No manual migrations
- Schema always matches entities
- Fast development iteration
- Type-safe operations

**Caution:**
- Not recommended for production
- Can cause data loss if schema changes significantly
- Use migrations for production deployments

## Database Operations

### Query Examples

**Get all themes for a session:**
```typescript
const themes = await dataSource.getRepository(Theme).find({
  where: { session_id: 'session-123', is_active: true },
  order: { confidence: 'DESC' }
});
```

**Get responses with theme assignments:**
```typescript
const assignments = await dataSource.getRepository(ThemeAssignment)
  .createQueryBuilder('assignment')
  .leftJoinAndSelect('responses', 'r', 'r.id = assignment.response_id')
  .leftJoinAndSelect('themes', 't', 't.id = assignment.theme_id')
  .where('t.session_id = :sessionId', { sessionId })
  .getMany();
```

**Count statistics:**
```typescript
const stats = {
  totalResponses: await responseRepo.count({ where: { session_id } }),
  totalThemes: await themeRepo.count({ where: { session_id, is_active: true } }),
  totalAssignments: await assignmentRepo.count()
};
```

## Performance Considerations

### Current Setup

- **SQLite** is single-writer (file-based)
- **No connection pooling** needed
- **Fast for read-heavy workloads**
- **Good for development** and small-to-medium datasets

### Optimization Tips

1. **Indexes**: Add custom indexes for frequent queries
2. **Batch Operations**: Use `save([])` for bulk inserts
3. **Query Builder**: Use for complex queries
4. **Transactions**: Wrap multi-table operations

### Scaling Considerations

For production or large-scale use:
- Consider PostgreSQL for concurrent writes
- Add vector extension (pgvector) for similarity search
- Implement connection pooling
- Add read replicas for scaling

## Backup and Recovery

### Manual Backup

```bash
# Backup database file
cp theme-evolution.db theme-evolution.backup.db

# Restore from backup
cp theme-evolution.backup.db theme-evolution.db
```

### Automated Backup

```typescript
import { copyFileSync } from 'fs';
import { format } from 'date-fns';

const timestamp = format(new Date(), 'yyyy-MM-dd-HHmmss');
copyFileSync('theme-evolution.db', `backups/theme-evolution-${timestamp}.db`);
```

## Migration to Production Database

When migrating to PostgreSQL:

1. Update `data-source.ts` configuration
2. Install `pg` driver: `bun add pg`
3. Update type mappings if needed
4. Add pgvector extension for similarity search
5. Implement proper migrations with TypeORM
6. Test thoroughly before deployment

## Monitoring

### Database Health Checks

```typescript
// Check database connectivity
export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    const dataSource = await getDataSource();
    await dataSource.query('SELECT 1');
    return true;
  } catch (error) {
    console.error('Database health check failed:', error);
    return false;
  }
}
```

### Schema Inspection

```bash
# Using sqlite3 CLI
sqlite3 theme-evolution.db ".schema"

# List tables
sqlite3 theme-evolution.db ".tables"

# Inspect table structure
sqlite3 theme-evolution.db ".schema themes"
```

## Best Practices

1. **Use TypeORM repositories** for all database operations
2. **Leverage type safety** - let TypeScript catch errors
3. **Wrap multi-table operations** in transactions
4. **Handle nullable fields** appropriately
5. **Validate data** before saving to database
6. **Use query builder** for complex queries
7. **Monitor database file size** and plan for growth
8. **Regular backups** for important data
9. **Test schema changes** before deployment
10. **Consider migrations** for production use
