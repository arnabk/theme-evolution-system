# Theme Evolution System

A scalable system that solves **large-scale batch processing with several million responses exceeding LLM context windows** by intelligently chunking datasets, maintaining theme consistency across batches, and evolving themes over time using vector-based similarity matching.

## Quick Start

```bash
# One-command setup (downloads models, sets up database, launches UI)
docker-compose up
```

**What happens automatically:**
- 🗄️ PostgreSQL with pgvector extension
- 🤖 Ollama with Llama 3.1 and nomic-embed-text models
- 📊 Database schema setup
- 🌐 Streamlit UI at http://localhost:8501

## Documentation

- [Setup Guide](docs/setup.md) - Installation and configuration
- [Architecture](docs/architecture.md) - System design and components  
- [Usage Guide](docs/usage.md) - How to use the system
- [Database Schema](docs/database_schema.md) - Database design and tables
- [API Reference](docs/api_reference.md) - Module documentation
- [Testing Guide](docs/testing.md) - Testing and coverage
- [Evaluation Framework](docs/evaluation.md) - Evaluation criteria
- [Project Proposal](docs/project_proposal.md) - Project overview and objectives
- [Progress Report](docs/progress_report.md) - Current progress, remaining tasks, and challenges

## Requirements

- Docker and Docker Compose
- 8GB+ RAM, 10GB+ disk space
