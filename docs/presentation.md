# Theme Evolution System

**AI-Powered Theme Extraction from Survey Responses**

---

## Problem Statement

### The Challenge

Traditional survey analysis is **time-consuming** and **manual**:
- Researchers spend hours reading through responses
- Identifying patterns and categorizing themes manually
- Themes evolve, merge, or split as new data arrives
- Maintaining consistency across batches is difficult

### Key Problems We're Solving

1. **Automatic Theme Extraction**  
   Extract meaningful themes from unstructured text automatically

2. **Theme Consistency**  
   Maintain consistency as new data arrives in batches

3. **Intuitive Exploration**  
   Provide an interface for researchers to explore and understand themes

---

## Solution Overview

### AI-Powered Theme Evolution System

A full-stack web application that uses **Large Language Models** to perform semantic analysis of survey responses.

### Workflow

1. **Generate** or input a survey question
2. **Generate** synthetic responses using LLM
3. **Extract** themes through multi-stage pipeline
4. **Evolve** themes as new batches are processed

### Key Innovation

- Automatic theme merging using **semantic similarity scoring**
- Maintains consistency across batches
- Allows themes to evolve naturally

---

## Technical Architecture

### Technology Stack

| Component | Technology |
|-----------|-----------|
| **Frontend** | Next.js 15 + React 19 (Server Components) |
| **Backend** | Next.js API Routes + TypeScript |
| **Database** | SQLite + TypeORM |
| **LLM** | Multi-provider (OpenAI, Gemini, Ollama) |
| **Runtime** | Bun (~3x faster than Node.js) |

### Architecture Layers

```
┌─────────────────────────────────────┐
│   React Frontend (User Interface)   │
├─────────────────────────────────────┤
│   Next.js API Routes                │
├─────────────────────────────────────┤
│   Theme Evolution Module            │
│   (Core Algorithms)                  │
├─────────────────────────────────────┤
│   Database Layer (TypeORM)          │
└─────────────────────────────────────┘
```

### Design Principles

- **Clean separation of concerns**
- **Type-safe** (100% TypeScript)
- **Modular** design (<250 lines per file)
- **Testable** architecture

---

## Core Innovation: Theme Evolution Pipeline

### Multi-Stage Processing Pipeline

#### Stage 1: Span Extraction

- **LLM extracts semantic spans** from each response
- **7 semantic classes**: user goals, pain points, emotions, requests, insights, suggestions, concerns
- **Validation**: Ensures exact substring matching
- **Output**: Spans with precise character positions for highlighting

#### Stage 2: Span Clustering

- **Single batched LLM call** analyzes all spans together
- **Groups semantically similar spans** into themes
- **Generates 3-7 distinct themes** with human-readable names
- **Uses LLM understanding** (not vector similarity) for better coherence

#### Stage 3: Within-Batch Merging

- **Pairwise LLM comparison** of themes in batch
- **80% similarity threshold** for merging
- **Prevents duplicate themes** within the same batch

#### Stage 4: Cross-Batch Evolution

- **Compares new themes** with existing themes
- **Merges similar themes** (≥80% similarity)
- **Combines phrase lists** and updates response counts
- **Maintains consistency** while allowing evolution

---

## Key Features

### 1. Multi-Provider LLM Support

- **OpenAI** (production, cloud)
- **Google Gemini** (fast, cloud)
- **Ollama** (local development)

**Flexibility** for different use cases and environments

### 2. Real-Time Progress Updates

- **Server-Sent Events (SSE)** for streaming
- **Live progress indicators** during long operations
- **Transparent processing** status

### 3. Semantic Highlighting

- **Color-coded phrases** by semantic class
- **Visual feedback** on theme assignments
- **Easy to understand** why responses match themes

### 4. Session Management

- **Isolated user sessions**
- **Data persistence** across page refreshes
- **Multi-user support**

### 5. Comprehensive Testing

- **285 tests** with **73% code coverage**
- **Unit, integration, and component tests**
- **CI/CD** with GitHub Actions

---

## Algorithm Complexity

### Overall Complexity

**O(n + m² + k)** where:
- `n` = number of responses
- `m` = number of themes per batch
- `k` = number of existing themes

### Stage-by-Stage Analysis

| Stage | Complexity | Description |
|-------|-----------|-------------|
| **Span Extraction** | O(n) | One LLM call per response |
| **Span Clustering** | O(1) | Single batched LLM call |
| **Within-Batch Merging** | O(m²) | Pairwise theme comparison |
| **Cross-Batch Merging** | O(m×k) | Compare new vs existing themes |

### Design Rationale

- **Balances accuracy with performance**
- **Uses LLM understanding** for semantic analysis
- **Keeps computational complexity manageable**

---

## Results & Evaluation

### Success Metrics

✅ **Semantically coherent themes**  
✅ **Human-readable output**  
✅ **80% similarity threshold** balances consolidation vs diversity  
✅ **Consistent theme evolution** across batches

### Performance

- **Processing time**: 1-3 seconds per response
- **Varies by LLM provider**
- **Gemini Flash Lite**: Fastest observed performance

### Testing Results

- **285 tests passing**
- **73% code coverage**
- **Comprehensive test suite** across all layers

---

## System Demonstration

### Live Demo Workflow

1. **Generate Question**  
   LLM creates a relevant survey question

2. **Generate Responses**  
   Creates 20 synthetic responses with diverse personas

3. **Extract Themes**  
   Multi-stage pipeline processes responses:
   - Extract semantic spans
   - Cluster into themes
   - Merge similar themes
   - Save to database

4. **Explore Themes**  
   View themes with:
   - Semantic phrases (color-coded)
   - Matching responses (highlighted keywords)
   - Response counts

5. **Theme Evolution**  
   Process new batch → themes automatically merge if similar (≥80%)

---

## Future Work

### Potential Enhancements

🔮 **Vector Embeddings**  
Combine LLM understanding with vector similarity for faster similarity checks

🔮 **Active Learning**  
Integrate user feedback for theme refinement and validation

🔮 **Multi-lingual Support**  
Extend semantic classes and extraction to multiple languages

🔮 **Temporal Analysis**  
Track theme evolution over time with patterns and trends

🔮 **Scalability**  
PostgreSQL + pgvector for production-scale deployments

---

## Research Contributions

### Algorithmic Innovations

1. **Semantic Span Extraction**  
   Novel approach with 7 semantic classes and exact substring validation

2. **LLM-Based Clustering**  
   Alternative to traditional vector-based clustering for theme discovery

3. **Incremental Theme Evolution**  
   Method for maintaining consistency across batches with 80% similarity threshold

### Technical Contributions

- **Multi-provider LLM abstraction** (Strategy pattern)
- **Dynamic phrase-based matching** (no pre-computed assignments)
- **Cross-batch theme evolution** mechanism

---

## Conclusion

### Summary

The **Theme Evolution System** demonstrates how modern LLMs can solve real-world qualitative data analysis problems.

### Key Achievements

✅ **Intuitive interface** for researchers  
✅ **Semantic consistency** through intelligent merging  
✅ **Scalable architecture** with comprehensive testing  
✅ **Production-ready** codebase

### Impact

The combination of **semantic analysis**, **multi-stage processing**, and **cross-batch evolution** creates a powerful tool for understanding evolving themes in survey data.

---

## Repository & Links

- **GitHub**: https://github.com/arnabk/theme-evolution-system
- **CI/CD**: GitHub Actions with Codecov integration
- **Tech Stack**: Next.js 15, React 19, TypeScript, TypeORM, SQLite, Bun

---

## Questions?

Thank you for your attention!

