# Docker Setup Guide

This guide explains how to run the Theme Evolution System using Docker for production deployments.

## Prerequisites

- **Docker** (version 20.10+)
  - [Install Docker](https://docs.docker.com/get-docker/)
- **Docker Compose** (version 2.0+)
  - Usually included with Docker Desktop

## Quick Start (Production)

### 1. Create Environment File

Create a `.env` file in the project root:

```bash
# LLM Provider (openai, gemini, or ollama for external instance)
LLM_PROVIDER=openai

# Ollama Configuration (only if using external Ollama instance)
# OLLAMA_BASE_URL=http://your-ollama-host:11434
# OLLAMA_MODEL=llama3.2:3b

# OpenAI Configuration (if using OpenAI)
# OPENAI_API_KEY=your-api-key-here
# OPENAI_MODEL=gpt-4o-mini

# Gemini Configuration (if using Gemini)
# GEMINI_API_KEY=your-api-key-here
# GEMINI_MODEL=gemini-1.5-flash
```

### 2. Build and Run

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f app

# Stop services
docker-compose down
```

The application will be available at **http://localhost:3000**

## Manual Docker Build

If you prefer to build manually:

```bash
# Build the image
docker build -t theme-evolution-system .

# Run the container
docker run -p 3000:3000 \
  -e LLM_PROVIDER=openai \
  -e OPENAI_API_KEY=your-api-key \
  -v $(pwd)/data:/app/data \
  theme-evolution-system
```

## Services

### Application (`app`)
- **Port**: 3000
- **Image**: Built from `Dockerfile`
- **Volumes**: 
  - `./data:/app/data` - Persists SQLite database

**Note**: This setup uses cloud LLM providers (OpenAI or Gemini) by default. For local Ollama, use an external instance and configure `OLLAMA_BASE_URL`.

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `LLM_PROVIDER` | LLM provider: `ollama`, `openai`, or `gemini` | `ollama` |
| `OLLAMA_BASE_URL` | Ollama API URL | `http://ollama:11434` |
| `OLLAMA_MODEL` | Ollama model name | `llama3.2:3b` |
| `OPENAI_API_KEY` | OpenAI API key | - |
| `OPENAI_MODEL` | OpenAI model name | `gpt-4o-mini` |
| `GEMINI_API_KEY` | Gemini API key | - |
| `GEMINI_MODEL` | Gemini model name | `gemini-1.5-flash` |

## Data Persistence

The SQLite database is stored in `./data/theme-evolution.db` and persists across container restarts.

## Troubleshooting

### Port Already in Use

If port 3000 is already in use, change it in `docker-compose.yml`:

```yaml
ports:
  - "3001:3000"  # Use 3001 instead
```

### Using External Ollama

If you want to use an external Ollama instance:

1. Set `LLM_PROVIDER=ollama` in your `.env`
2. Set `OLLAMA_BASE_URL=http://host.docker.internal:11434` (macOS/Windows)
3. Or use your host IP: `OLLAMA_BASE_URL=http://192.168.1.100:11434`
4. Ensure the Ollama instance is accessible from the Docker container

### Database Permissions

If you see database permission errors:

```bash
# Fix permissions
sudo chown -R 1001:1001 ./data
```

## Production Deployment

For production, consider:

1. **Use a reverse proxy** (nginx, Traefik) in front of the app
2. **Set up SSL/TLS** certificates
3. **Use environment secrets** management (Docker secrets, Kubernetes secrets)
4. **Configure resource limits** in docker-compose.yml:

```yaml
services:
  app:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
        reservations:
          cpus: '1'
          memory: 1G
```

5. **Set up health checks**:

```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
  interval: 30s
  timeout: 10s
  retries: 3
```

