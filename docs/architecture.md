# System Architecture

This document describes the architecture and design of the Theme Evolution System.

## Overview

The Theme Evolution System processes survey responses in batches, maintains theme consistency across batches, and evolves themes over time using LLM-based analysis and semantic similarity.

## Technology Stack

- **Runtime**: Bun (fast JavaScript runtime, ~3x faster than Node.js)
- **Framework**: Next.js 15 with App Router (React Server Components)
- **Language**: TypeScript (100% type-safe, strict mode enabled)
- **Database**: SQLite with TypeORM (auto-schema sync, no migrations)
- **LLM**: Multi-provider support (OpenAI, Gemini for production; Ollama for local development)
- **Frontend**: React 19 with Server Components and modern hooks
- **Styling**: Tailwind CSS (utility-first CSS framework)
- **Testing**: Bun's built-in test runner (117+ tests, ~73% coverage)
- **CI/CD**: GitHub Actions with Codecov integration

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

**Architecture Pattern**: Pipeline-based processing with LLM-based semantic analysis at each stage.

- **`span-extractor.ts`** (~192 lines)
  - **Algorithm**: Direct LLM extraction with validation
  - **Complexity**: O(n) where n = number of responses
  - **Semantic Classes**: 7 extraction classes (user_goal, pain_point, emotion, request, insight, suggestion, concern)
  - **Validation**: Exact substring matching to ensure extracted phrases exist in original text
  - **Output**: `ExtractedSpan[]` with character positions (start, end) for precise highlighting
  - **LLM Temperature**: 0.2 (low for consistency)
  - **Prompt Strategy**: Structured JSON output with explicit rules for phrase extraction

- **`span-clusterer.ts`** (~210 lines)
  - **Algorithm**: LLM-based semantic clustering (no traditional clustering algorithms)
  - **Complexity**: O(1) LLM call regardless of span count (batched analysis)
  - **Grouping Strategy**: Spans grouped by extraction class before clustering for better semantic understanding
  - **Theme Generation**: LLM generates 3-7 distinct themes with human-readable names and descriptions
  - **Output**: `SemanticTheme[]` with contributing spans and response IDs
  - **Design Rationale**: Uses LLM understanding rather than vector similarity for better semantic coherence

- **`theme-builder.ts`** (~50 lines)
  - **Algorithm**: Filtering and association (O(n*m) where n=themes, m=spans)
  - **Purpose**: Associates spans with themes and filters to relevant spans only
  - **Data Structure**: Builds `ThemeWithResponses` objects for database persistence

- **`batch-theme-merger.ts`** (~120 lines)
  - **Algorithm**: Pairwise LLM comparison within batch
  - **Complexity**: O(n²) LLM calls where n = number of themes in batch
  - **Strategy**: Compares each new theme with all existing themes in batch
  - **Merge Threshold**: 80% similarity (configurable)
  - **Optimization**: Early termination if similarity is too low

- **`theme-deduplicator.ts`** (~50 lines)
  - **Algorithm**: Set-based deduplication (O(n) where n = total spans)
  - **Data Structure**: Uses `Set<string>` for O(1) lookup
  - **Purpose**: Ensures each span belongs to exactly one theme (prevents overlap)
  - **Key Strategy**: Case-insensitive phrase matching

- **`theme-merger.ts`** (~175 lines)
  - **Algorithm**: Pairwise LLM similarity scoring with threshold-based merging
  - **Complexity**: O(n*m) where n = new themes, m = existing themes
  - **Similarity Scoring**: LLM returns 0-100 score based on semantic equivalence
  - **Merge Threshold**: 80% (MERGE_THRESHOLD constant)
  - **Phrase Merging**: Deduplicates phrases using case-insensitive Set lookup
  - **Response Count**: Aggregates response counts from merged themes
  - **Design Trade-off**: Higher threshold (80%) encourages new theme creation vs. aggressive merging

#### LLM Client (`llm.ts`)

**Design Pattern**: Strategy pattern with provider abstraction

**Multi-provider LLM client** supporting:
- **OpenAI** (default for production, cloud, API key required)
  - Uses Chat Completions API (`/v1/chat/completions`)
  - Supports temperature, top_p parameters
  - Default model: `gpt-4o-mini`
- **Gemini** (cloud, API key required)
  - Uses Generative Language API (`/v1beta/models/:model:generateContent`)
  - Default model: `gemini-1.5-flash`
- **Ollama** (for local development, optional)
  - Uses local HTTP API (`/api/generate`)
  - Default model: `llama3.2:3b`
  - No API key required

**Key Methods**:
- `generate(options: GenerateOptions)` - Generic text generation with provider abstraction
- `generateQuestion()` - Specialized prompt for survey question generation
- `generateResponse()` - Specialized prompt for synthetic response generation with persona diversity

**Configuration**: Environment-based provider selection (`LLM_PROVIDER` env var)

**Error Handling**: Provider-specific error messages with fallback behavior

#### Database Client (`database.ts`)

**Design Pattern**: Repository pattern via TypeORM

**TypeORM-based database operations**:
- **Session Management**: `getOrCreateSession()`, `saveCurrentQuestion()`, `clearSessionData()`
- **Theme CRUD**: `saveThemes()`, `getThemes()`, `updateTheme()`
- **Response Operations**: `saveResponses()`, `getUnprocessedResponses()`, `markResponsesAsProcessed()`
- **Dynamic Matching**: `findResponsesForTheme()` - phrase-based search (no separate assignments table)
- **Statistics**: `getStats()` - aggregated counts with batch tracking

**Key Design Decisions**:
- **No Assignments Table**: Response-theme matching is dynamic via phrase search
- **Phrase Storage**: Themes store phrases as JSON array (`ThemePhrase[]`)
- **Processed Flag**: Responses have `processed: boolean` to track processing state
- **Batch Tracking**: `batch_id` field for grouping responses by generation batch
- **Session Isolation**: All queries filtered by `session_id` for multi-user support

**Query Optimization**:
- Indexed lookups on `session_id`, `batch_id`, `processed`
- Efficient TypeORM queries with proper select statements
- Transaction support for atomic operations

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
   - `id` (PRIMARY KEY, INTEGER)
   - `session_id` (TEXT, indexed)
   - `name` (TEXT) - Human-readable theme name
   - `description` (TEXT) - Theme description
   - `phrases` (TEXT, JSON) - Array of `ThemePhrase` objects with text and class
   - `response_count` (INTEGER) - Number of responses associated
   - `created_at`, `updated_at` (DATETIME) - Timestamps

2. **responses** - Survey responses with processed flag
   - `id` (PRIMARY KEY, INTEGER)
   - `session_id` (TEXT, indexed)
   - `batch_id` (TEXT, indexed) - Groups responses by generation batch
   - `response_text` (TEXT) - The actual response text
   - `processed` (BOOLEAN, indexed) - Whether themes have been extracted
   - `created_at` (DATETIME) - Timestamp

3. **sessions** - Session state
   - `id` (PRIMARY KEY, INTEGER)
   - `session_id` (TEXT, UNIQUE, indexed)
   - `current_question` (TEXT, nullable) - Current survey question
   - `created_at`, `updated_at` (DATETIME) - Timestamps

**Design Rationale**:
- **No Assignments Table**: Response-to-theme matching is dynamic. Themes store semantic phrases, and responses are matched by searching for those phrases at query time using `findResponsesForTheme()`. This design:
  - Reduces database complexity
  - Allows flexible phrase-based matching
  - Supports phrase evolution (themes can gain/lose phrases over time)
  - Enables real-time matching without pre-computed assignments

- **JSON Storage**: Phrases stored as JSON for flexibility (TypeORM handles serialization)
- **Indexed Fields**: `session_id`, `batch_id`, `processed` indexed for fast queries
- **Auto-timestamps**: TypeORM decorators handle `created_at`/`updated_at` automatically

See [Database Schema](database_schema.md) for detailed schema and entity definitions.

## Configuration

See [Setup Guide](setup.md) for detailed environment configuration and LLM provider setup.

## Algorithm Design & Complexity Analysis

### Theme Extraction Pipeline

**Overall Complexity**: O(n + m² + k) where:
- n = number of responses
- m = number of themes per batch
- k = number of existing themes

**Stage-by-Stage Analysis**:

1. **Span Extraction** (O(n))
   - One LLM call per response
   - Validation: O(1) per span (substring search)
   - Total: O(n) where n = responses

2. **Span Clustering** (O(1))
   - Single batched LLM call regardless of span count
   - LLM analyzes all spans together
   - Output: 3-7 themes (constant)

3. **Within-Batch Merging** (O(m²))
   - Pairwise comparison of themes in batch
   - Each comparison: 1 LLM call
   - Worst case: m(m-1)/2 comparisons
   - Typical: Much fewer due to early termination

4. **Cross-Batch Merging** (O(m*k))
   - Compare each new theme (m) with existing themes (k)
   - Each comparison: 1 LLM call
   - Optimized: Can skip if similarity clearly too low

### Data Structures

**Key Data Structures**:
- `ExtractedSpan[]`: Array of spans with character positions
- `Map<ExtractionClass, ExtractedSpan[]>`: Spans grouped by semantic class
- `Set<string>`: For O(1) phrase deduplication
- `ThemePhrase[]`: JSON-serializable phrase objects

**Design Rationale**:
- Arrays for ordered collections (spans, themes)
- Maps for O(1) class-based grouping
- Sets for efficient deduplication
- JSON-compatible structures for database storage

## LLM Prompt Engineering Strategy

### Prompt Design Principles

1. **Structured Output**: All prompts request JSON arrays/objects for reliable parsing
2. **Explicit Rules**: Clear constraints (e.g., "MUST be exact substring")
3. **Examples**: Include example outputs in prompts when helpful
4. **Temperature Control**: 
   - Low (0.1-0.2) for extraction and similarity scoring (consistency)
   - Medium (0.7) for generation tasks (creativity)

### Key Prompts

**Span Extraction**:
- Classifies phrases into 7 semantic classes
- Validates exact substring matching
- Returns 3-6 phrases per response

**Theme Clustering**:
- Groups spans by semantic class first
- Generates 3-7 distinct themes
- Focuses on "inner message" not surface words

**Similarity Scoring**:
- Returns 0-100 numeric score
- Explicit scoring guide (90-100 = identical, 70-89 = very similar, etc.)
- Low temperature (0.1) for consistency

## Design Patterns

### 1. Strategy Pattern
- **LLM Client**: Provider abstraction (Ollama, OpenAI, Gemini)
- **Implementation**: `LLMClient` class with provider-specific methods

### 2. Repository Pattern
- **Database Client**: TypeORM repositories abstract data access
- **Benefits**: Testability, separation of concerns

### 3. Pipeline Pattern
- **Theme Processing**: Sequential stages (extract → cluster → merge → deduplicate)
- **Implementation**: Functional composition with clear stage boundaries

### 4. Factory Pattern
- **Model Selection**: `getModel()` utility selects appropriate LLM model
- **Configuration**: Environment-based model selection

## API Design Patterns

### RESTful Endpoints
- Resource-based URLs (`/api/themes`, `/api/responses`)
- HTTP methods: GET (read), POST (create/process)
- Status codes: 200 (success), 400 (bad request), 500 (server error)

### Streaming Responses
- **SSE (Server-Sent Events)**: `/api/themes/process` streams progress updates
- **Format**: `data: {JSON}\n\n` per SSE standard
- **Progress Tracking**: Real-time status updates during long operations

### Session Management
- **Header-based**: `x-session-id` header for all requests
- **Isolation**: All data scoped to session
- **Persistence**: Session state stored in database

## Performance Considerations

### 1. Parallel Processing

- **Response Generation**: Parallel batches of 5 responses
- **LLM Calls**: Sequential per response (API rate limits)
- **Non-blocking UI**: Individual button states prevent blocking
- **Streaming**: Real-time progress updates via SSE

### 2. Database Optimization

- **SQLite**: File-based, single-writer (sufficient for development)
- **Indexes**: `session_id`, `batch_id`, `processed` indexed
- **Queries**: Efficient TypeORM queries with proper selects
- **No N+1 Problems**: Batch loading where possible

### 3. LLM Optimization

- **Provider Selection**: Cloud (OpenAI/Gemini) for production, local (Ollama) for dev
- **Model Selection**: Configurable per use case
- **Batching**: Spans analyzed together in single LLM call
- **Caching**: None currently (future: embedding cache)

### 4. Memory Management

- **Server Components**: Next.js SSR reduces client memory
- **State Management**: React hooks with proper cleanup
- **Streaming**: Large responses streamed, not buffered
- **Database**: SQLite handles memory efficiently

### 5. Frontend Optimization

- **Infinite Scroll**: Paginated loading for large lists
- **React Memoization**: Components memoized where appropriate
- **Lazy Loading**: Code splitting via Next.js dynamic imports
- **Efficient Re-renders**: Proper dependency arrays in hooks

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

- **User-friendly Messages**: Clear error messages in UI
- **Fallback States**: Empty states, loading states, error boundaries
- **Retry Mechanisms**: Manual retry buttons for failed operations
- **Partial Failures**: Processing continues even if some responses fail

### 2. Error Recovery

- **Transaction Safety**: TypeORM transactions for atomic operations
- **State Consistency**: `processed` flag ensures idempotency
- **Data Integrity**: Validation at extraction stage (phrase substring matching)
- **LLM Failures**: Graceful fallback with error logging

### 3. Error Types

- **LLM Errors**: Network failures, API errors, parsing errors
- **Database Errors**: Connection failures, constraint violations
- **Validation Errors**: Missing session ID, invalid input
- **Processing Errors**: Empty responses, no spans extracted

### 4. Monitoring

- **Console Logging**: Development logging with emoji indicators (✅, ⚠️, ❌)
- **Error Tracking**: Server-side error logging
- **Progress Tracking**: Real-time progress via SSE
- **Health Checks**: `/api/health` endpoint for monitoring

## Testing Strategy

### Test Coverage

- **117+ tests** across 22 test files
- **~73% source file coverage**
- **96.6% passing rate** (113/117 tests passing)

### Test Types

1. **Unit Tests**: Individual functions and utilities
   - Span extraction logic
   - Theme merging algorithms
   - Database operations
   - LLM client methods (mocked)

2. **Integration Tests**: API routes with real database
   - End-to-end API workflows
   - Database operations
   - Session management

3. **Component Tests**: React components
   - UI rendering
   - User interactions
   - State management

### Testing Infrastructure

- **Framework**: Bun's built-in test runner
- **Mocking**: `spyOn` for function mocking
- **Database**: Real SQLite database (isolated per test)
- **LLM Mocking**: Mocked LLM responses for deterministic tests
- **CI/CD**: GitHub Actions runs tests on every push/PR

### Test Organization

```
src/
├── lib/__tests__/          # Core library tests
├── lib/theme-evolution/__tests__/  # Theme evolution tests
├── app/api/__tests__/       # API route tests
├── app/hooks/__tests__/     # React hook tests
└── components/__tests__/    # Component tests
```

## Technical Trade-offs

### 1. LLM-based vs. Vector Similarity

**Chosen**: LLM-based semantic analysis
- **Pros**: Better semantic understanding, human-readable themes, context-aware
- **Cons**: Higher latency, API costs, less deterministic
- **Alternative**: Vector embeddings (faster, cheaper, but less nuanced)

### 2. Dynamic vs. Pre-computed Matching

**Chosen**: Dynamic phrase-based matching
- **Pros**: Flexible, supports phrase evolution, simpler schema
- **Cons**: Query-time computation, slower for large datasets
- **Alternative**: Pre-computed assignments table (faster queries, but more complex)

### 3. SQLite vs. PostgreSQL

**Chosen**: SQLite for development
- **Pros**: Zero configuration, file-based, sufficient for development
- **Cons**: Single-writer limitation, no vector search
- **Future**: PostgreSQL + pgvector for production scale

### 4. Batch Processing vs. Streaming

**Chosen**: Batch processing with SSE progress updates
- **Pros**: Simpler implementation, clear batch boundaries
- **Cons**: Higher memory usage, less real-time
- **Future**: Full streaming processing pipeline

### 5. 80% Similarity Threshold

**Chosen**: 80% threshold for theme merging
- **Rationale**: High enough to merge truly similar themes, low enough to encourage new theme creation
- **Impact**: Balances theme consolidation vs. theme diversity
- **Tunable**: Can be adjusted based on use case

## Implementation Details

### Type Safety

- **100% TypeScript**: Strict mode enabled
- **Type Definitions**: Comprehensive interfaces for all data structures
- **Type Guards**: Runtime type validation (`getErrorMessage`, etc.)
- **Generic Types**: Reusable type utilities

### Code Organization

- **Modular Design**: No file exceeds ~250 lines
- **Separation of Concerns**: Clear boundaries (API, business logic, data)
- **Single Responsibility**: Each module has one clear purpose
- **DRY Principle**: Shared utilities in `utils.ts`

### Configuration Management

- **Environment Variables**: `.env` file for configuration
- **Provider Abstraction**: Runtime provider selection
- **Model Configuration**: Per-use-case model selection
- **Database Path**: Configurable via `DATA_DIR` env var

## Key Technical Innovations

### 1. Semantic Span-Based Theme Extraction

**Innovation**: Multi-stage semantic analysis pipeline
- **Stage 1**: Extract semantic spans (goals, pain points, emotions) with precise character positions
- **Stage 2**: Cluster spans by semantic meaning (not just keywords)
- **Stage 3**: Generate human-readable themes that capture "inner messages"
- **Result**: Themes represent what users truly mean, not just what they say

### 2. LLM-Based Semantic Similarity

**Innovation**: Uses LLM understanding for theme comparison
- **Approach**: LLM scores semantic similarity (0-100) rather than vector cosine similarity
- **Benefit**: Better understanding of semantic equivalence (e.g., "need flexibility" = "want flexible work")
- **Threshold**: 80% similarity for merging (tunable parameter)

### 3. Dynamic Phrase-Based Matching

**Innovation**: No pre-computed assignments table
- **Approach**: Themes store semantic phrases; responses matched at query time
- **Benefit**: Supports phrase evolution, flexible matching, simpler schema
- **Trade-off**: Query-time computation vs. pre-computed speed

### 4. Cross-Batch Theme Evolution

**Innovation**: Themes evolve across multiple batches
- **Mechanism**: New themes compared with existing themes using semantic similarity
- **Merging**: Similar themes merged, phrases deduplicated, response counts aggregated
- **Result**: Consistent theme evolution as new data arrives

### 5. Multi-Provider LLM Abstraction

**Innovation**: Unified interface for multiple LLM providers
- **Providers**: Ollama (local), OpenAI (cloud), Gemini (cloud)
- **Benefit**: Development flexibility, production scalability
- **Implementation**: Strategy pattern with provider-specific methods

## Research & Academic Relevance

### Algorithm Contributions

1. **Semantic Span Extraction**: Novel approach to extracting meaningful phrases with semantic classification (7 semantic classes)
2. **LLM-Based Clustering**: Alternative to traditional vector-based clustering for theme discovery
3. **Incremental Theme Evolution**: Method for maintaining theme consistency across batches with 80% similarity threshold

### Evaluation Metrics (Future Work)

- **Performance**: Processing speed, memory usage, scalability with varying dataset sizes
- **Accuracy**: Theme extraction quality, semantic coherence, comparison with baseline methods
- **Consistency**: Theme stability across batches, merge correctness
- **Coverage**: Percentage of responses with extracted themes, span extraction success rate

### Potential Extensions

- **Vector Embeddings**: Hybrid approach combining LLM understanding with vector similarity for faster similarity checks
- **Active Learning**: User feedback integration for theme refinement and validation
- **Multi-lingual Support**: Extend semantic classes and extraction to multiple languages
- **Temporal Analysis**: Track theme evolution over time with temporal patterns and trends
- **Embedding Caching**: Cache LLM embeddings for repeated text to reduce API costs
- **Distributed Processing**: Scale theme extraction across multiple workers for large datasets
