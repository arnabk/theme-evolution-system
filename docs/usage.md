# Usage Guide

Learn how to use the Theme Evolution System through the web interface.

## Quick Start

```bash
# Start the application
bun dev
```

Open http://localhost:3000 in your browser.

## Basic Workflow

### 1. Generate Question
Click **"🎯 Generate Question"** to create a random survey question using LLM.

Examples:
- "What are your biggest challenges with remote work?"
- "How do you maintain work-life balance?"

### 2. Generate Responses
Click **"📝 Generate Responses"** to create 20 synthetic responses to the question.
- Button disabled until question exists
- Shows progress during generation
- Takes ~10-15 seconds

### 3. Extract Themes
Click **"⚡ Extract Themes"** to analyze responses and extract themes.
- Disabled until unprocessed responses exist
- Shows real-time progress with streaming updates
- Automatically merges similar themes
- Highlights keywords in responses

## Interface Layout

### Left Sidebar
- **Action buttons**: Generate question, responses, extract themes
- **Statistics**: Real-time counts of responses, themes, and batches

### Main Area
**Themes Tab** (default):
- Left: List of themes with confidence scores
- Right: Selected theme details and responses with highlighted keywords
- Infinite scroll for responses

**Responses Tab**:
- Paginated list of all responses (10 per page)
- Batch ID and timestamp for each response

## Key Features

### Session Management
- Automatic session created in browser localStorage
- All data tied to your session
- Persists across page refreshes
- Isolated from other users/browsers

### Theme Evolution
Generate and process multiple batches to watch themes evolve:

```
1. Generate question (once)
2. Generate responses (batch 1) → Extract themes
3. Generate more responses (batch 2) → Extract themes again
4. Similar themes automatically merge
5. Repeat for continuous evolution
```

### Theme Merging
- Automatically detects similar themes (>50% keyword overlap)
- Merges themes and combines descriptions
- Updates all response assignments

### Keyword Highlighting
- Extracts n-grams (1-3 word phrases) from responses
- Calculates similarity to themes
- Highlights contributing keywords in UI

## API Endpoints

Use the REST API for programmatic access:

```bash
# Questions
POST   /api/questions/generate
GET    /api/questions/current
POST   /api/questions/clear

# Responses
POST   /api/responses/generate
GET    /api/responses

# Themes
POST   /api/themes/process
GET    /api/themes
GET    /api/themes/{id}/responses

# Statistics
GET    /api/stats
```

All endpoints require `x-session-id` header.

### Example

```typescript
// Generate responses
const res = await fetch('/api/responses/generate', {
  method: 'POST',
  headers: { 
    'Content-Type': 'application/json',
    'x-session-id': sessionId
  },
  body: JSON.stringify({ question: "Your question", count: 20 })
});
const { success, batchId } = await res.json();

// Extract themes (streaming)
const res = await fetch('/api/themes/process', {
  method: 'POST',
  headers: {
    'x-session-id': sessionId,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ question, batchId })
});

const reader = res.body.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  
  const chunk = decoder.decode(value);
  // Parse SSE data: lines starting with "data: "
}
```

## Troubleshooting

**Question generation fails**
- Verify Ollama is running: `ollama list`
- Check model is pulled: `ollama pull llama3.2:3b`

**Response generation slow**
- First run loads model (slower)
- Subsequent runs faster
- Use smaller model for speed

**Theme processing errors**
- Check browser console
- Verify responses exist
- Ensure Ollama is responding

**Data not showing**
- Refresh page
- Check network tab for API errors
- Verify database file exists: `ls theme-evolution.db`

## Related Documentation

- [Setup Guide](setup.md) - Installation instructions
- [Architecture](architecture.md) - System design
- [Database Schema](database_schema.md) - Data structure
