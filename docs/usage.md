# Usage Guide

This guide explains how to use the Theme Evolution System through the modern Next.js web interface.

## Quick Start

1. **Start the application**
   ```bash
   bun dev
   ```

2. **Open your browser**
   ```
   http://localhost:3000
   ```

3. **Start using the system**
   - Generate a question
   - Generate responses
   - Process themes
   - View results

## Interface Overview

The application has a modern, gradient-styled interface with:

### Left Sidebar (Control Panel)

**System Actions:**
- 🎯 **Generate Random Question** - Creates a new survey question
- 📝 **Generate 100 Responses** - Creates 100 synthetic responses
- ⚡ **Process Themes** - Extracts themes from unprocessed responses
- 🗑️ **Clear All Data** - Resets the session (fresh start)

**Statistics Dashboard:**
- Total Responses count
- Active Themes count
- Batches Processed count

### Main Content Area (Tabs)

**Two main tabs:**
1. **Themes** - View themes with assigned responses
2. **Responses** - View all responses with assignments

## Step-by-Step Workflow

### 1. Generate a Question

**Action**: Click **"Generate Random Question"** button

**What happens:**
- System uses LLM to generate a random survey question
- Question appears in the main panel
- Examples: 
  - "What are your biggest challenges with remote work?"
  - "How do you maintain work-life balance?"
  - "What tools improve your productivity?"

**Status**: Button shows loading spinner while generating

### 2. Generate Responses

**Action**: Click **"Generate 100 Responses"** button

**Requirements**: Must have a current question

**What happens:**
- System generates 100 diverse, synthetic responses
- Uses different personas and perspectives
- Responses saved to database
- Response count updates in stats

**Time**: Takes ~20-30 seconds (depends on LLM speed)

**Status**: Button shows loading spinner and disables during generation

### 3. Process Themes

**Action**: Click **"Process Themes"** button

**Requirements**: Must have unprocessed responses

**What happens:**
1. Loads all unprocessed responses
2. Extracts themes using n-gram analysis and LLM
3. Merges similar themes (>50% keyword overlap)
4. Assigns responses to themes
5. Highlights contributing keywords
6. Updates database

**Time**: Takes ~10-20 seconds (depends on response count)

**Output:**
- Themes extracted and displayed
- Response-theme assignments created
- Keywords highlighted in responses

### 4. View Themes

**Navigate to**: **Themes** tab (default view)

**Interface:**
- **Left panel**: List of all themes
  - Theme name
  - Confidence score
  - Response count
  - Truncated description
  
- **Right panel**: Selected theme details
  - Full description
  - All assigned responses
  - Highlighted keywords in each response
  - Confidence scores per assignment

**Interactions:**
- Click any theme in left panel to view details
- Scroll through responses (infinite scroll)
- Hover over keywords to see highlighting

### 5. View Responses

**Navigate to**: **Responses** tab

**Interface:**
- **Statistics bar**:
  - Total responses
  - Average response length
  - Assignment rate
  
- **Response list**:
  - All responses in order
  - Batch ID for each
  - Assigned themes (if processed)
  - Response text

**Features:**
- Paginated view (25 responses per page)
- Next/Previous pagination buttons
- Theme badges show assignments

## Advanced Features

### Session Management

**What is a session?**
- Unique identifier for your work
- Stored in browser localStorage
- All data tied to session ID
- Persists across page refreshes

**Session isolation:**
- Each browser gets unique session
- Data doesn't mix between sessions
- Clear data only affects your session

### Multiple Batches

**Process multiple times:**
1. Generate question (once)
2. Generate responses (batch 1)
3. Process themes → Themes created
4. Generate more responses (batch 2)
5. Process themes → Themes evolve!

**Theme evolution:**
- Batch 1: Initial themes extracted
- Batch 2: New responses added, similar themes merged
- Batch 3+: Themes continue to evolve

### Theme Merging

**Automatic merging:**
- System detects similar themes
- Merges if >50% keyword overlap
- Combines descriptions intelligently
- Updates all assignments

**Example:**
```
Theme 1: "Remote Work Challenges" (keywords: remote, work, home, isolation)
Theme 2: "Working from Home Issues" (keywords: home, work, remote, communication)
→ Merged: "Remote Work Challenges" (combined description)
```

### Keyword Highlighting

**How it works:**
- Extracts n-grams (1-3 word phrases)
- Calculates similarity to theme
- Highlights top contributing keywords
- Shows keyword positions in text

**Visual display:**
- Bold text for highlighted keywords
- Inline with response text
- Shows which words contributed to assignment

## UI Features

### Modern Design

**Visual elements:**
- Gradient backgrounds
- Glass-morphism cards
- Animated particles
- Smooth transitions
- Loading spinners

**Color scheme:**
- Dark theme (gray-950 base)
- Blue/cyan accents
- White/gray text
- Subtle borders

### Responsive Buttons

**Smart button states:**
- Each button has independent state
- Loading spinner when active
- Disabled during operation
- Tooltips show requirements

**Examples:**
- "Generate Responses" disabled until question exists
- "Process Themes" disabled until responses exist
- Clear warnings before destructive actions

### Real-time Updates

**Automatic refresh:**
- Stats update after each operation
- Theme list refreshes on processing
- Response counts update live
- No manual refresh needed

## Common Workflows

### Experiment with Questions

```
1. Generate Question
2. Generate Responses (100)
3. Process Themes
4. Review results
5. Clear All Data
6. Repeat with different question
```

### Iterative Theme Development

```
1. Generate Question (once)
2. Generate Responses (100)
3. Process Themes
4. Review themes
5. Generate MORE Responses (100)
6. Process Themes again
7. Watch themes evolve!
```

### Analyze Patterns

```
1. Process multiple batches
2. View Themes tab
3. Compare theme confidence scores
4. Check response counts per theme
5. Review keyword highlights
6. Identify patterns
```

## API Access

For programmatic access, use the REST API:

### Available Endpoints

```bash
# Health check
GET /api/health

# Questions
POST /api/questions/generate
GET /api/questions/current?sessionId={id}
POST /api/questions/clear

# Responses
POST /api/responses/generate
GET /api/responses?sessionId={id}

# Themes
GET /api/themes?sessionId={id}
POST /api/themes/process
GET /api/themes/{themeId}/responses

# Statistics
GET /api/stats?sessionId={id}
```

### Example Usage

```typescript
// Generate question
const response = await fetch('/api/questions/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ sessionId })
});
const { question } = await response.json();

// Generate responses
const response = await fetch('/api/responses/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ count: 100, sessionId })
});

// Process themes
const response = await fetch('/api/themes/process', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ sessionId })
});
```

## Troubleshooting

### No Question Generated

**Problem**: Generate question button doesn't work

**Solutions:**
- Check Ollama is running: `ollama list`
- Check browser console for errors
- Verify API endpoint: http://localhost:3000/api/health
- Check network tab in DevTools

### Slow Response Generation

**Problem**: Taking too long to generate responses

**Causes:**
- Ollama model loading (first time)
- System resources (CPU/RAM)
- Model size (larger = slower)

**Solutions:**
- Wait for first generation (model loads)
- Use smaller model: `llama3.2:3b`
- Close other applications
- Check system resources

### Processing Fails

**Problem**: Theme processing errors out

**Solutions:**
- Check browser console for error message
- Verify responses exist in database
- Check Ollama is responding: `curl localhost:11434/api/version`
- Restart application if needed

### Data Not Showing

**Problem**: Stats show 0 or data missing

**Solutions:**
- Refresh the page
- Check correct session ID
- Verify database file exists: `ls theme-evolution.db`
- Clear browser cache
- Check API responses in network tab

### Clear Data Not Working

**Problem**: Data persists after clearing

**Solutions:**
- Hard refresh: Cmd/Ctrl + Shift + R
- Clear localStorage in DevTools
- Delete database file: `rm theme-evolution.db`
- Restart application

## Performance Tips

### Optimal Workflow

1. **Generate in batches**: 100 responses at a time
2. **Process incrementally**: After each batch
3. **Review regularly**: Check themes after processing
4. **Clear periodically**: Start fresh for new experiments

### System Resources

- **CPU**: Higher CPU = faster generation
- **RAM**: 4GB minimum, 8GB recommended
- **Disk**: SQLite grows with data (plan accordingly)
- **Network**: Only needed for cloud LLM providers

### Scaling Considerations

- SQLite handles 1000s of responses fine
- For 10,000+ responses, consider PostgreSQL
- Batch processing prevents memory issues
- Theme evolution maintains performance

## Best Practices

### 1. Question Design

- Keep questions focused and specific
- Avoid yes/no questions
- Use open-ended phrasing
- Target specific topics

### 2. Response Analysis

- Process themes after each batch
- Review theme descriptions
- Check confidence scores
- Verify keyword highlights make sense

### 3. Theme Management

- Let similar themes merge naturally
- High confidence = good themes
- Low confidence = review manually
- Multiple batches improve quality

### 4. Data Management

- Clear data between experiments
- Export results before clearing
- Monitor database file size
- Backup important results

## Integration

### Programmatic Usage

```typescript
// Example: Automated testing
async function runExperiment(topic: string) {
  // Generate question about topic
  const question = await generateQuestion();
  
  // Generate responses
  for (let batch = 1; batch <= 5; batch++) {
    await generateResponses(100);
    await processThemes();
  }
  
  // Analyze results
  const themes = await getThemes();
  return analyzeThemes(themes);
}
```

### Export Data

```typescript
// Export themes and responses
async function exportData(sessionId: string) {
  const themes = await fetch(`/api/themes?sessionId=${sessionId}`);
  const responses = await fetch(`/api/responses?sessionId=${sessionId}`);
  
  return {
    themes: await themes.json(),
    responses: await responses.json()
  };
}
```

## Next Steps

1. **Experiment**: Try different question types
2. **Analyze**: Study theme evolution patterns
3. **Iterate**: Process multiple batches
4. **Export**: Save interesting results
5. **Scale**: Test with larger datasets
6. **Customize**: Modify code for specific needs

## Related Documentation

- [Setup Guide](setup.md) - Installation instructions
- [Architecture](architecture.md) - System design
- [Database Schema](database_schema.md) - Data structure
- [Testing Guide](testing.md) - Testing strategies
