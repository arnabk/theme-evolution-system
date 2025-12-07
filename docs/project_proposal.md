# Project Proposal

**Project Title:** Theme Evolution System for Survey Response Analysis

**Team Members:** Arnab Karmakar (arnabk3)

**Project Coordinator:** Arnab Karmakar (arnabk3)

## Project Description

This project aims to develop an intelligent theme evolution system that processes survey responses in batches, automatically extracts themes, highlights contributing keywords, and intelligently evolves themes over time using local LLM processing.

### 1. What is the new tool or new function that you'd like to develop?

A scalable theme extraction and evolution system that:
- **Processes survey responses in batches** with automatic theme identification
- **Highlights keywords** that contribute to theme assignment using n-gram analysis and similarity scoring
- **Evolves themes intelligently** over time through merging based on keyword overlap
- **Provides comprehensive analytics** on theme distribution and response patterns
- **Maintains consistency** across batches using semantic analysis

### 2. Why do we need it? What pain point does it address?

**Critical Technical Challenge:**
- **LLM Context Window Limitations**: Even advanced LLMs cannot handle several million survey responses in a single context
- **Large-Scale Processing**: Survey datasets with millions of responses exceed LLM context windows
- **Memory Constraints**: Processing entire datasets causes memory overflow and performance issues
- **Theme Consistency**: Need to maintain theme coherence across large datasets that must be processed in chunks

**Our Solution:**
- **Intelligent Batching**: Process large datasets in optimal chunks that fit LLM context windows
- **N-gram Based Similarity**: Use keyword extraction and overlap analysis for efficient theme matching without requiring full embeddings
- **Theme Evolution**: Maintain and update themes across batches with intelligent merging
- **Scalable Architecture**: Handle datasets of any size through intelligent chunking and batch processing

### 3. How is this different from existing tools?

**Existing Tools Limitations:**
- **Single-shot LLM analysis** cannot handle several million responses
- **Static analysis tools** require manual coding and don't scale to large datasets
- **Basic clustering** doesn't provide semantic understanding or theme evolution
- **Survey platforms** only provide basic analytics, no theme evolution

**Our Innovation:**
- **Intelligent batching** that maintains semantic coherence across chunks
- **Keyword-based theme evolution** using n-gram analysis for efficient similarity matching
- **Incremental processing** that scales to several million responses
- **Automatic theme merging** that maintains consistency across batches

### 4. How do you plan to build your tool?

**Core Technical Solution:**
- **Intelligent Batching**: Process responses in optimal chunks that fit LLM context windows
- **Keyword-Based Similarity**: Use n-gram extraction (1-3 word phrases) to match responses to themes
- **Incremental Processing**: Maintain theme state across batches using database persistence
- **Automatic Merging**: Merge themes with >50% keyword overlap

**Technology Stack:**
- **Runtime**: Bun (fast JavaScript runtime)
- **Framework**: Next.js 15 with TypeScript for full-stack development
- **Database**: SQLite with TypeORM for development (PostgreSQL option for production)
- **LLM**: Ollama for local processing (supports OpenAI and Gemini as alternatives)
- **Frontend**: React 19 with modern UI components

**Architecture Components:**
- **API Routes**: Next.js API routes for all operations (~30-50 lines each)
- **Theme Extractor**: LLM integration for theme generation using n-gram keyword analysis
- **Theme Merger**: Merge similar themes based on keyword overlap
- **Response Assigner**: Assign responses to themes with confidence scores
- **Database Client**: TypeORM operations for all data persistence
- **React UI**: Modern interface with real-time updates

**Key Technical Innovations:**
1. **Intelligent Batching**: Process large datasets in optimal chunks that fit LLM context windows
2. **Keyword-Based Similarity**: Use n-gram extraction for efficient theme matching and merging
3. **Theme Evolution**: Maintain and update themes across batches with automatic merging
4. **Scalable Processing**: Handle datasets of any size through intelligent chunking

### 5. How do you plan to evaluate your tool?

**Evaluation Approach:**
- **Performance Testing**: Measure processing speed, memory usage, and scalability with datasets of varying sizes
- **Accuracy Testing**: Compare theme extraction results against manual analysis and baseline methods
- **Scalability Testing**: Test with large datasets (multiple batches) to verify context window handling
- **Metrics**: Use quantitative measures like throughput, similarity scores, and theme consistency
- **Comparative Analysis**: Benchmark against single-shot LLM processing and existing tools

**Specific Evaluation Metrics:**
- Processing time per batch
- Theme quality and coherence
- Keyword highlighting accuracy
- Theme merging effectiveness
- Scalability with increasing dataset sizes
- Memory efficiency
- System responsiveness

### 6. How do you plan to divide the work among team members?

**Solo Project Structure:**
- **Phase 1**: Core system architecture and database design ✅
- **Phase 2**: LLM integration and theme extraction logic ✅
- **Phase 3**: Keyword highlighting and n-gram analysis ✅
- **Phase 4**: Theme evolution and merging logic ✅
- **Phase 5**: Testing, evaluation, and documentation 🔄 (in progress)

**Current Status:**
- Core functionality complete and operational
- Modern UI built with Next.js and React
- Theme extraction and evolution working
- Keyword highlighting implemented
- Ready for comprehensive testing and evaluation phase

**Deliverables:**
- **Working System**: Functional web application ✅
- **Documentation**: Architecture, setup, usage guides ✅
- **Evaluation Results**: Performance metrics and analysis 🔄
- **Project Report**: Comprehensive documentation 🔄
- **Presentation**: Demo and findings 🔄

---

**Project Repository**: https://github.com/arnabk/theme-evolution-system

**Implementation Note**: The project is implemented in TypeScript/Next.js rather than Python for better type safety, modern tooling, and development efficiency. All core innovations and functionality from the proposal remain intact, with the technology stack updated for optimal developer experience and system performance.
