# Setup Guide

This guide will help you set up the Theme Evolution System on your local machine.

## Prerequisites

### Required Software

1. **Bun** (JavaScript runtime)
   - [Install Bun](https://bun.sh/docs/installation)
   - macOS/Linux: `curl -fsSL https://bun.sh/install | bash`
   - Windows: `powershell -c "irm bun.sh/install.ps1|iex"`
   - Verify: `bun --version`

2. **Ollama** (LLM runtime)
   - [Install Ollama](https://ollama.ai/download)
   - macOS: `brew install ollama`
   - Linux: `curl -fsSL https://ollama.ai/install.sh | sh`
   - Windows: Download from website
   - Verify: `ollama --version`

3. **Git**
   - [Install Git](https://git-scm.com/downloads)
   - Verify: `git --version`

### Optional: Cloud LLM Providers

If you prefer cloud-based LLMs instead of local Ollama:
- **OpenAI**: Get API key from [platform.openai.com](https://platform.openai.com)
- **Gemini**: Get API key from [aistudio.google.com](https://aistudio.google.com)

## Installation Steps

### 1. Clone the Repository

```bash
git clone https://github.com/arnabk/theme-evolution-system.git
cd theme-evolution-system
```

### 2. Install Dependencies

```bash
bun install
```

This installs all required packages defined in `package.json`.

### 3. Set Up Ollama (Recommended)

**Start Ollama service** (keep this running in a terminal):

```bash
ollama serve
```

**In a new terminal, pull the required models:**

```bash
# Generation model (2GB)
ollama pull llama3.2:3b

# Embedding model (274MB)
ollama pull nomic-embed-text

# Verify models are installed
ollama list
```

**Why llama3.2:3b?**
- Fast inference for interactive use
- Excellent quality for text generation
- Optimized for modern hardware
- Small footprint (2GB)

### 4. Configure Environment (Optional)

Create `.env` file for custom configuration:

```bash
# Copy example
cp .env.example .env
```

**Default configuration (works out of the box):**
```bash
# LLM Provider
LLM_PROVIDER=ollama  # or openai, gemini

# Ollama (default)
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2:3b

# OpenAI (optional)
# OPENAI_API_KEY=sk-...
# OPENAI_MODEL=gpt-4o-mini

# Gemini (optional)
# GEMINI_API_KEY=...
# GEMINI_MODEL=gemini-1.5-flash
```

### 5. Start the Application

```bash
bun dev
```

The application will:
- Start Next.js development server
- Auto-create SQLite database (`./data/theme-evolution.db` or project root)
- Sync database schema with TypeORM entities
- Be available at http://localhost:3000

**Note:** Database location can be configured via `DATA_DIR` environment variable. Default is `./data/theme-evolution.db`.

**Output:**
```
✓ Ready in 1.2s
○ Compiling / ...
✓ Compiled / in 500ms
```

### 6. Access the Application

Open your browser:
```
http://localhost:3000
```

You should see the Theme Evolution System interface with:
- **Themes** tab - Theme list with responses
- **Responses** tab - All responses
- **Statistics** - Real-time metrics in the sidebar

## Verification

### Check All Services

1. **Application**: http://localhost:3000 should load
2. **API**: http://localhost:3000/api/health should return `{"status":"ok"}`
3. **Ollama** (if using): `ollama list` should show models
4. **Database**: `theme-evolution.db` file should exist in `./data/` directory (or project root)

### Test the System

1. Click **"Generate Question"** - Should create a survey question
2. Click **"Generate Responses"** - Should create 20 synthetic responses
3. Click **"Extract Themes"** - Should extract and display themes
4. Navigate to **Themes** tab - Should see extracted themes with responses

## Troubleshooting

### Common Issues

#### 1. Bun Not Found

```
Error: bun: command not found
```

**Solution**: Install Bun and restart your terminal
```bash
curl -fsSL https://bun.sh/install | bash
source ~/.bashrc  # or ~/.zshrc
```

#### 2. Ollama Not Running

```
Error: Failed to connect to Ollama
```

**Solution**: Start Ollama service
```bash
ollama serve
# Keep this terminal open
```

#### 3. Port 3000 Already in Use

```
Error: Port 3000 is already in use
```

**Solution**: Stop other services or use different port
```bash
# Use different port
PORT=3001 bun dev
```

#### 4. Models Not Downloaded

```
Error: Model llama3.2:3b not found
```

**Solution**: Download required models
```bash
ollama pull llama3.2:3b
ollama pull nomic-embed-text
```

#### 5. Database Errors

```
Error: SQLITE_CANTOPEN
```

**Solution**: Ensure write permissions in project directory
```bash
# Check permissions
ls -la theme-evolution.db

# Fix if needed
chmod 644 theme-evolution.db
```

### Service Health Checks

**Check Ollama:**
```bash
curl http://localhost:11434/api/version
```

**Check Application API:**
```bash
curl http://localhost:3000/api/health
```

**Check Database:**
```bash
# Default location
sqlite3 ./data/theme-evolution.db ".tables"

# Or if in project root
sqlite3 theme-evolution.db ".tables"
```

## Alternative: Cloud LLM Setup

### Using OpenAI

```bash
# .env
LLM_PROVIDER=openai
OPENAI_API_KEY=sk-your-key-here
OPENAI_MODEL=gpt-4o-mini
```

**Pros**: Faster, more capable models
**Cons**: Requires API key, costs money per request

### Using Gemini

```bash
# .env
LLM_PROVIDER=gemini
GEMINI_API_KEY=your-key-here
GEMINI_MODEL=gemini-1.5-flash
```

**Pros**: Free tier available, fast responses
**Cons**: Requires API key, usage limits

## Development Workflow

### Hot Reloading

The application has **automatic hot reloading**:
- Edit any file in `src/`
- Save the file
- Browser automatically refreshes
- No manual restart needed!

### Development Commands

```bash
# Start development server
bun dev

# Build for production
bun run build

# Start production server
bun start

# Run linter
bun run lint
```

See [Architecture](architecture.md) for detailed system design and file structure.

## Database Management

### View Database

```bash
# Using sqlite3 CLI (default location)
sqlite3 ./data/theme-evolution.db

# List tables
.tables

# View table schema
.schema themes

# Query data
SELECT * FROM themes LIMIT 5;

# Exit
.quit
```

### Reset Database

```bash
# Delete database file (will be recreated on next start)
rm ./data/theme-evolution.db

# Or if in project root
rm theme-evolution.db

# Restart application
bun dev
```

### Backup Database

```bash
# Create backup (default location)
cp ./data/theme-evolution.db backup-$(date +%Y%m%d).db

# Restore from backup
cp backup-20240101.db ./data/theme-evolution.db
```

## Production Deployment

```bash
# Build optimized production bundle
bun run build

# Start production server
bun start
```

See [Architecture](architecture.md) for detailed deployment considerations.
