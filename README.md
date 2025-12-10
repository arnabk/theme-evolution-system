# Theme Evolution System

[![CI](https://github.com/arnabk/theme-evolution-system/actions/workflows/ci.yml/badge.svg)](https://github.com/arnabk/theme-evolution-system/actions/workflows/ci.yml)
[![codecov](https://codecov.io/gh/arnabk/theme-evolution-system/branch/main/graph/badge.svg)](https://codecov.io/gh/arnabk/theme-evolution-system)

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

## Development

### Available Commands

```bash
# Development
bun dev              # Start development server
bun run build        # Build for production
bun start            # Start production server

# Code Quality
bun run lint         # Check code with ESLint
bun run lint:fix     # Auto-fix linting issues

# Testing
bun test             # Run all tests
bun test --coverage  # Run tests with coverage report
```

### Testing

The project includes comprehensive test coverage:

- **117+ tests** across 22 test files
- **~73% source file coverage**
- Tests for API routes, database operations, theme evolution logic, and React components
- Uses Bun's built-in test runner (no additional dependencies)

See [TEST_COVERAGE.md](TEST_COVERAGE.md) for detailed coverage information.

### Continuous Integration

- **GitHub Actions** runs tests and linting on every push and PR
- **Codecov** integration for coverage tracking
- Check the [Actions tab](https://github.com/arnabk/theme-evolution-system/actions) for CI status

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
