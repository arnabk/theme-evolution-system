# Theme Evolution System

[![CI](https://github.com/arnabk/theme-evolution-system/actions/workflows/ci.yml/badge.svg)](https://github.com/arnabk/theme-evolution-system/actions/workflows/ci.yml)
[![codecov](https://codecov.io/gh/arnabk/theme-evolution-system/branch/main/graph/badge.svg)](https://codecov.io/gh/arnabk/theme-evolution-system)

**AI-Powered Theme Evolution:** Intelligently extract and evolve themes from survey responses using LLM analysis and semantic similarity.

**Tech Stack:** Next.js 15 + TypeScript + React + TypeORM + SQLite + Ollama + Bun

---

## Quick Start

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

- **285 tests** across multiple test files
- **~73% source file coverage**
- Tests for API routes, database operations, theme evolution logic, and React components
- Uses Bun's built-in test runner (no additional dependencies)

### Continuous Integration

- **GitHub Actions** runs tests and linting on every push and PR
- **Codecov** integration for coverage tracking
- Check the [Actions tab](https://github.com/arnabk/theme-evolution-system/actions) for CI status

---

## Documentation

### Getting Started
- **[Setup Guide](docs/setup.md)** - Installation and configuration
- **[Usage Guide](docs/usage.md)** - How to use the system

### Technical Documentation
- **[Architecture](docs/architecture.md)** - System design and components  
- **[Database Schema](docs/database_schema.md)** - TypeORM entities and auto-sync

### Project Documentation
- **[Project Proposal](docs/project_proposal.md)** - Original project overview
- **[Progress Report](docs/progress_report.md)** - Implementation status
- **[Presentation](docs/presentation.md)** - Presentation slides and overview

---

**Repository:** https://github.com/arnabk/theme-evolution-system
