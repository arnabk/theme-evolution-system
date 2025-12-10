# Theme Evolution System

**AI-Powered Theme Evolution:** Intelligently extract and evolve themes from survey responses using LLM analysis and semantic similarity.

**Tech Stack:** Next.js 15 + TypeScript + React + TypeORM + SQLite + Ollama + Bun

---

## Quick Start

### Option 1: Docker (Recommended for Production)

```bash
# 1. Create .env file (see docker-compose.yml for variables)
cp .env.example .env  # Edit as needed

# 2. Start with Docker Compose
docker-compose up -d

# 3. Access the application
open http://localhost:3000
```

See **[Docker Guide](docs/docker.md)** for detailed instructions.

### Option 2: Local Development

```bash
# 1. Install Ollama and models
brew install ollama
ollama serve  # Keep running in a terminal

# 2. In a new terminal, pull models
ollama pull llama3.2:3b

# 3. Install dependencies & start app
bun install
bun dev
```

**Access:** http://localhost:3000

---

## Documentation

- **[Setup Guide](docs/setup.md)** - Local installation and configuration
- **[Docker Guide](docs/docker.md)** - Docker production setup
- **[Usage Guide](docs/usage.md)** - How to use the system
- **[Architecture](docs/architecture.md)** - System design and components  
- **[Database Schema](docs/database_schema.md)** - TypeORM entities and auto-sync
- **[Project Proposal](docs/project_proposal.md)** - Original project overview
- **[Progress Report](docs/progress_report.md)** - Implementation status

---

**Repository:** https://github.com/arnabk/theme-evolution-system
