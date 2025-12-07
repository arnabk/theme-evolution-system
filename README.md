# Theme Evolution System

**AI-Powered Theme Evolution:** Intelligently extract and evolve themes from survey responses using LLM analysis and semantic similarity.

**Tech Stack:** Next.js 15 + TypeScript + React + TypeORM + SQLite + Ollama + Bun

**100% TypeScript • Zero Python • Lightning Fast ⚡**

---

## Quick Start

```bash
# 1. Install Ollama and models
brew install ollama
ollama serve  # Keep running in a terminal

# 2. In a new terminal, pull models
ollama pull llama3.2:3b
ollama pull nomic-embed-text

# 3. Install dependencies & start app
bun install
bun dev
```

**Access:** http://localhost:3000

---

## Documentation

- **[Setup Guide](docs/setup.md)** - Installation and configuration
- **[Usage Guide](docs/usage.md)** - How to use the system
- **[Architecture](docs/architecture.md)** - System design and components  
- **[Database Schema](docs/database_schema.md)** - TypeORM entities and auto-sync
- **[Testing Guide](docs/testing.md)** - Testing strategies
- **[Project Proposal](docs/project_proposal.md)** - Original project overview
- **[Progress Report](docs/progress_report.md)** - Implementation status

---

**Repository:** https://github.com/arnabk/theme-evolution-system
