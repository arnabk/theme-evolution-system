# System Architecture

This document describes the architecture and design of the Theme Evolution System.

## Overview

The Theme Evolution System processes survey responses in batches, maintains theme consistency across batches, and evolves themes over time using LLM-based analysis and semantic similarity.

## Technology Stack

- **Runtime**: Bun (fast JavaScript runtime)
- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript (100% type-safe)
- **Database**: SQLite with TypeORM (auto-schema sync)
- **LLM**: Multi-provider support (OpenAI, Gemini for production; Ollama for local development)
- **Frontend**: React 19 with Server Components
- **Styling**: Tailwind CSS

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    Next.js Application                           │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │              React Frontend (page.tsx)                      │ │
│  │  ┌────────────┐ ┌────────────┐ ┌────────────┐            │ │
│  │  │  Question   │ │  Themes    │ │ Responses  │            │ │
│  │  │  Display    │ │    Tab     │ │    Tab     │            │ │
│  │  └────────────┘ └────────────┘ └────────────┘            │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                           ↓ API calls                            │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │           Next.js API Routes (app/api/*)                    │ │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐        │ │
│  │  │Question │ │Response │ │ Themes  │ │  Stats  │        │ │
│  │  │  /gen   │ │  /gen   │ │/process │ │  /get   │        │ │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘        │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                           ↓                                      │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │              Business Logic Layer (lib/)                    │ │
│  │  ┌───────────────────────────────────────────────────────┐ │ │
│  │  │    Theme Evolution (theme-evolution/)                 │ │ │
│  │  │  • span-extractor.ts      - Extract semantic spans    │ │ │
│  │  │  • span-clusterer.ts      - Cluster spans into themes │ │ │
│  │  │  • theme-builder.ts       - Build theme objects       │ │ │
│  │  │  • batch-theme-merger.ts  - Merge within batch        │ │ │
│  │  │  • theme-deduplicator.ts  - Remove duplicate spans    │ │ │
│  │  │  • theme-merger.ts        - Merge with existing themes│ │ │
│  │  │  • utils.ts               - Shared utilities          │ │ │
│  │  └───────────────────────────────────────────────────────┘ │ │
│  │  ┌────────────────────┐  ┌────────────────────┐          │ │
│  │  │    LLM Client      │  │  Database Client   │          │ │
│  │  │  (llm.ts)          │  │  (database.ts)     │          │ │
│  │  │  • Ollama          │  │  • TypeORM         │          │ │
│  │  │  • OpenAI          │  │  • SQLite          │          │ │
│  │  │  • Gemini          │  │  • Entities        │          │ │
│  │  └────────────────────┘  └────────────────────┘          │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                           ↓                                      │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                   Data Layer                                │ │
│  │  ┌────────────┐  ┌────────────────────┐                    │ │
│  │  │  SQLite    │  │  TypeORM Entities  │                    │ │
│  │  │    DB      │  │  • Theme           │                    │ │
│  │  │            │  │  • Response        │                    │ │
│  │  │            │  │  • Session         │                    │ │
│  │  └────────────┘  └────────────────────┘                    │ │
│  └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

## Core Components

### 1. Frontend Layer (React)

**Location**: `src/app/page.tsx`, `src/components/`

Main application interface with two tabs:
- **Themes**: Theme list with assigned responses
- **Responses**: All responses with theme assignments
- **Statistics**: Real-time metrics in sidebar

**Key Files**:
- `page.tsx` - Main application page (~165 lines)
- `components/ThemesTab.tsx` - Theme orchestrator
- `components/ResponsesTab.tsx` - Response listing
- `components/themes/ThemesList.tsx` - Theme sidebar
- `components/themes/ResponsesList.tsx` - Response panel with infinite scroll

### 2. API Routes Layer

**Location**: `src/app/api/`

RESTful API endpoints for all operations:

```
/api/health              - Health check
/api/questions/generate  - Generate random question
/api/questions/current   - Get/set current question
/api/questions/clear     - Clear all session data
/api/responses/generate  - Generate synthetic responses
/api/responses          - List all responses
/api/themes             - List all themes
/api/themes/process     - Process batch & extract themes
/api/themes/[id]/responses - Get responses for theme
/api/stats              - Get statistics
```

### 3. Business Logic Layer

**Location**: `src/lib/`

#### Theme Evolution Module (`theme-evolution/`)

- **`span-extractor.ts`** (~192 lines)
  - Extracts semantic spans (user goals, pain points, emotions, requests, etc.) using direct LLM calls
  - Validates extracted phrases exist in original text
  - Returns spans with character positions and semantic classes

- **`span-clusterer.ts`** (~210 lines)
  - Clusters spans semantically into themes using LLM
  - Assigns spans to themes based on semantic similarity
  - Generates human-readable theme names and descriptions

- **`theme-builder.ts`** (~50 lines)
  - Builds theme objects with associated response data
  - Filters spans to only those relevant to each theme

- **`batch-theme-merger.ts`** (~120 lines)
  - Merges similar themes within a single batch
  - Uses LLM to identify semantically similar themes

- **`theme-deduplicator.ts`** (~50 lines)
  - Removes duplicate spans across themes
  - Ensures each span belongs to only one theme

- **`theme-merger.ts`** (~175 lines)
  - Merges new themes with existing themes across batches
  - Uses LLM-based semantic comparison with 80% similarity threshold
  - Updates phrase lists (removes duplicates) and response counts

#### LLM Client (`llm.ts`)

Multi-provider LLM client supporting:
- **OpenAI** (default for production, cloud, API key required)
- **Gemini** (cloud, API key required)
- **Ollama** (for local development, optional)

Key methods:
- `generate()` - Generate text with specified model
- `generateQuestion()` - Generate survey questions
- `generateResponse()` - Generate synthetic responses

#### Database Client (`database.ts`)

TypeORM-based database operations:
- Session management
- Theme CRUD operations (with phrase storage)
- Response storage (with processed flag)
- Dynamic phrase matching for response-theme associations
- Statistics queries

### 4. Data Layer

#### TypeORM Entities (`lib/entities/`)

- **`Theme.ts`** - Theme entity with phrases (JSON) and response counts
- **`Response.ts`** - Survey response entity with processed flag
- **`Session.ts`** - Session state management

#### SQLite Database

- **Auto-sync schema** - TypeORM creates tables automatically
- **File-based** - `theme-evolution.db` location configurable via `DATA_DIR` env var
- **Default location** - `./data/theme-evolution.db` (or project root if `DATA_DIR` not set)
- **Docker location** - `/app/data/theme-evolution.db` (via `DATA_DIR` volume)
- **No migrations** - Schema syncs on startup
- **Lightweight** - Perfect for development and testing

## Data Flow

### 1. Question Generation Flow

```
User clicks "Generate Question" 
  → /api/questions/generate 
  → LLMClient.generateQuestion() 
  → Ollama API 
  → Save to session 
  → Return question
```

### 2. Response Generation Flow

```
User clicks "Generate Responses" 
  → /api/responses/generate 
  → LLMClient.generateMultipleResponses() 
  → Parallel batches of 5 
  → Save to database 
  → Return count
```

### 3. Theme Processing Flow

```
User clicks "Extract Themes" 
  → /api/themes/process 
  → Load unprocessed responses (processed: false)
  → Extract semantic spans (span-extractor.ts)
    • Uses LLM to extract phrases with semantic classes
    • Validates phrases exist in original text
    • Returns spans with character positions
  → Cluster spans into themes (span-clusterer.ts)
    • Uses LLM to group semantically similar spans
    • Generates theme names and descriptions
  → Build theme objects (theme-builder.ts)
    • Associates spans with themes
  → Merge similar themes within batch (batch-theme-merger.ts)
    • Uses LLM to identify duplicate themes
  → Deduplicate spans (theme-deduplicator.ts)
    • Ensures each span belongs to only one theme
  → Merge with existing themes (theme-merger.ts)
    • Compares new themes with existing (80% similarity threshold)
    • Merges phrases and updates response counts
  → Save themes to database (with phrases JSON)
  → Mark responses as processed (processed: true)
  → Return results
```

### 4. Theme Evolution Across Batches

```
Batch 1 → Extract initial themes → Store in DB
Batch 2 → Compare with existing themes → Merge similar ones → Update
Batch 3 → Continue evolution → Maintain consistency
```

## Database Schema

### Core Tables

1. **themes** - Extracted themes with semantic phrases (JSON)
2. **responses** - Survey responses with processed flag
3. **sessions** - Session state

**Note:** Response-to-theme matching is dynamic. Themes store semantic phrases, and responses are matched by searching for those phrases at query time. No separate assignments table exists.

See [Database Schema](database_schema.md) for detailed schema.

## Configuration

See [Setup Guide](setup.md) for detailed environment configuration and LLM provider setup.

## Performance Considerations

### 1. Parallel Processing

- Responses generated in parallel batches of 5
- Non-blocking UI with individual button states
- Streaming API responses (future)

### 2. Database Optimization

- SQLite with auto-sync schema
- Indexed queries for fast lookups
- Efficient TypeORM queries

### 3. LLM Optimization

- Cloud providers (OpenAI/Gemini) for production
- Local Ollama for development (optional)
- Configurable models per use case
- Multi-provider support for flexibility

### 4. Memory Management

- Server-side rendering for initial load
- Client-side state management with hooks
- Efficient React re-rendering

## Scalability

### Current Limitations

- SQLite is file-based (single-writer)
- No vector similarity search
- No embedding caching

### Future Enhancements

- PostgreSQL + pgvector for production
- Embedding cache for repeated text
- Distributed processing
- Real-time streaming

## Security Considerations

### 1. Data Privacy

- Cloud LLM providers (OpenAI/Gemini) for production
- Local Ollama available for development (optional)
- API keys stored securely in environment variables
- Data stored locally in SQLite database

### 2. API Security

- Session-based isolation
- Server-side validation
- Type-safe operations

### 3. Environment Variables

- Sensitive keys in `.env` (not committed)
- Optional cloud providers
- Secure defaults

## Development Workflow

### 1. File Organization

- **Modular design**: No file over 250 lines
- **Separation of concerns**: API, business logic, data
- **Type safety**: 100% TypeScript
- **Component composition**: Reusable UI components

### 2. Code Standards

- TypeScript strict mode
- ESLint for code quality
- Tailwind for styling
- React best practices

### 3. Hot Reloading

- Next.js Fast Refresh
- Instant feedback
- No manual restarts

## Monitoring and Observability

### 1. Logging

- Console logging in development
- Server-side error tracking
- Client-side error boundaries

### 2. Metrics

- Response count
- Theme count
- Batch processing status
- Assignment statistics

### 3. Health Checks

- `/api/health` endpoint
- Database connectivity
- LLM service status

## Error Handling

### 1. Graceful Degradation

- User-friendly error messages
- Fallback UI states
- Retry mechanisms

### 2. Error Recovery

- Transaction rollbacks
- State consistency
- Data integrity

### 3. Monitoring

- Error rate tracking
- Performance metrics
- User feedback
