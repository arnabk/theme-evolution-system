# Testing Guide

This guide explains how to test the Theme Evolution System built with Next.js and TypeScript.

## Testing Strategy

### Current Status

The system is currently in development phase. Testing will be implemented using modern TypeScript testing tools.

### Recommended Testing Stack

- **Bun Test** - Fast, built-in test runner
- **React Testing Library** - Component testing
- **MSW** (Mock Service Worker) - API mocking
- **TypeScript** - Type-safe tests

## Test Structure (Planned)

```
tests/
├── unit/
│   ├── theme-extractor.test.ts     # Theme extraction logic
│   ├── theme-merger.test.ts        # Theme merging logic
│   ├── response-assigner.test.ts   # Response assignment
│   └── llm-client.test.ts          # LLM client
├── integration/
│   ├── api-routes.test.ts          # API endpoint testing
│   ├── database.test.ts            # Database operations
│   └── theme-evolution.test.ts     # End-to-end theme processing
├── components/
│   ├── ThemesTab.test.tsx          # Theme tab component
│   ├── ResponsesTab.test.tsx       # Responses tab component
│   └── StatsCard.test.tsx          # Stats card component
└── e2e/
    └── user-workflow.test.ts       # Complete user flows
```

## Setting Up Tests

### Install Testing Dependencies

```bash
# Bun includes built-in test runner
# No additional dependencies needed for basic tests

# For component testing (optional)
bun add -d @testing-library/react @testing-library/jest-dom
bun add -d @testing-library/user-event

# For API mocking (optional)
bun add -d msw
```

## Running Tests

### Using Bun Test

```bash
# Run all tests
bun test

# Run specific test file
bun test tests/unit/theme-extractor.test.ts

# Run tests in watch mode
bun test --watch

# Run with coverage
bun test --coverage
```

## Test Examples

### 1. Unit Tests

#### Theme Extractor Test

```typescript
// tests/unit/theme-extractor.test.ts
import { describe, expect, test, mock } from 'bun:test';
import { extractThemes } from '@/lib/theme-evolution/theme-extractor';

describe('Theme Extractor', () => {
  test('should extract themes from responses', async () => {
    const responses = [
      'Remote work is challenging due to isolation',
      'Working from home lacks collaboration',
      'Virtual meetings are exhausting'
    ];

    const themes = await extractThemes(responses, 'mock-session');

    expect(themes.length).toBeGreaterThan(0);
    expect(themes[0]).toHaveProperty('name');
    expect(themes[0]).toHaveProperty('description');
    expect(themes[0]).toHaveProperty('confidence');
  });

  test('should handle empty responses', async () => {
    const themes = await extractThemes([], 'mock-session');
    expect(themes).toEqual([]);
  });
});
```

#### Theme Merger Test

```typescript
// tests/unit/theme-merger.test.ts
import { describe, expect, test } from 'bun:test';
import { mergeThemes } from '@/lib/theme-evolution/theme-merger';

describe('Theme Merger', () => {
  test('should merge similar themes', () => {
    const theme1 = {
      id: 1,
      name: 'Remote Work Challenges',
      keywords: ['remote', 'work', 'home', 'isolation']
    };

    const theme2 = {
      id: 2,
      name: 'Working from Home Issues',
      keywords: ['home', 'work', 'remote', 'communication']
    };

    const overlap = calculateOverlap(theme1.keywords, theme2.keywords);
    expect(overlap).toBeGreaterThan(0.5);
  });

  test('should not merge different themes', () => {
    const theme1 = {
      keywords: ['remote', 'work', 'home']
    };

    const theme2 = {
      keywords: ['productivity', 'tools', 'efficiency']
    };

    const overlap = calculateOverlap(theme1.keywords, theme2.keywords);
    expect(overlap).toBeLessThan(0.3);
  });
});
```

### 2. API Route Tests

```typescript
// tests/integration/api-routes.test.ts
import { describe, expect, test } from 'bun:test';

describe('API Routes', () => {
  test('GET /api/health returns ok', async () => {
    const response = await fetch('http://localhost:3000/api/health');
    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(data.status).toBe('ok');
  });

  test('POST /api/questions/generate creates question', async () => {
    const response = await fetch('http://localhost:3000/api/questions/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: 'test-session' })
    });

    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(data).toHaveProperty('question');
    expect(data.question).toBeTruthy();
  });
});
```

### 3. Component Tests

```typescript
// tests/components/StatsCard.test.tsx
import { describe, expect, test } from 'bun:test';
import { render, screen } from '@testing-library/react';
import StatsCard from '@/components/StatsCard';

describe('StatsCard Component', () => {
  test('renders title and value', () => {
    render(<StatsCard title="Total Responses" value={42} />);
    
    expect(screen.getByText('Total Responses')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
  });

  test('applies gradient styling', () => {
    const { container } = render(
      <StatsCard title="Test" value={10} gradient="from-blue-400 to-blue-600" />
    );
    
    const card = container.firstChild;
    expect(card).toHaveClass('from-blue-400');
  });
});
```

### 4. Database Tests

```typescript
// tests/integration/database.test.ts
import { describe, expect, test, beforeAll, afterAll } from 'bun:test';
import { getDataSource } from '@/lib/data-source';
import { Theme } from '@/lib/entities/Theme';

describe('Database Operations', () => {
  beforeAll(async () => {
    const dataSource = await getDataSource();
    // Use test database
  });

  afterAll(async () => {
    // Clean up test data
  });

  test('should save and retrieve theme', async () => {
    const dataSource = await getDataSource();
    const themeRepo = dataSource.getRepository(Theme);

    const theme = themeRepo.create({
      session_id: 'test-session',
      name: 'Test Theme',
      description: 'Test description',
      confidence: 0.85,
      is_active: true
    });

    const saved = await themeRepo.save(theme);
    expect(saved.id).toBeTruthy();

    const retrieved = await themeRepo.findOne({ where: { id: saved.id } });
    expect(retrieved?.name).toBe('Test Theme');
  });
});
```

## Manual Testing

### Testing Through UI

1. **Start the application**
   ```bash
   bun dev
   ```

2. **Test question generation**
   - Click "Generate Random Question"
   - Verify a question appears
   - Check it's relevant and well-formed

3. **Test response generation**
   - Click "Generate 100 Responses"
   - Verify responses are created
   - Check response count increases

4. **Test theme processing**
   - Click "Process Themes"
   - Verify themes are extracted
   - Check themes make semantic sense
   - Verify responses are assigned to themes

5. **Test theme viewing**
   - Navigate to "Themes" tab
   - Click on different themes
   - Verify responses are displayed correctly
   - Check keyword highlighting works

6. **Test responses viewing**
   - Navigate to "Responses" tab
   - Verify all responses are listed
   - Check pagination works
   - Verify theme assignments are shown

### API Testing with curl

```bash
# Health check
curl http://localhost:3000/api/health

# Generate question
curl -X POST http://localhost:3000/api/questions/generate \
  -H "Content-Type: application/json" \
  -d '{"sessionId":"test"}'

# Get current question
curl http://localhost:3000/api/questions/current?sessionId=test

# Get statistics
curl http://localhost:3000/api/stats?sessionId=test

# List themes
curl http://localhost:3000/api/themes?sessionId=test
```

## Performance Testing

### Load Testing

Test system performance with large datasets:

```typescript
// tests/performance/load.test.ts
import { describe, test } from 'bun:test';

describe('Performance Tests', () => {
  test('should handle 1000 responses', async () => {
    const startTime = Date.now();
    
    // Generate 1000 responses
    for (let i = 0; i < 10; i++) {
      await fetch('http://localhost:3000/api/responses/generate', {
        method: 'POST',
        body: JSON.stringify({ count: 100, sessionId: 'perf-test' })
      });
    }
    
    const duration = Date.now() - startTime;
    console.log(`Generated 1000 responses in ${duration}ms`);
    
    // Should complete in reasonable time
    expect(duration).toBeLessThan(60000); // 1 minute
  });

  test('should process themes efficiently', async () => {
    const startTime = Date.now();
    
    await fetch('http://localhost:3000/api/themes/process', {
      method: 'POST',
      body: JSON.stringify({ sessionId: 'perf-test' })
    });
    
    const duration = Date.now() - startTime;
    console.log(`Processed themes in ${duration}ms`);
    
    expect(duration).toBeLessThan(30000); // 30 seconds
  });
});
```

### Benchmarking

```typescript
// Benchmark theme extraction
import { bench, run } from 'bun:test';

bench('extract themes from 100 responses', async () => {
  await extractThemes(responses, 'bench-session');
});

bench('merge similar themes', () => {
  mergeThemes(themes, 'bench-session');
});

await run();
```

## Test Coverage

### Measuring Coverage

```bash
# Run tests with coverage
bun test --coverage

# View coverage report
# Coverage results will be displayed in terminal
```

### Coverage Goals

- **Unit Tests**: 80%+ coverage for business logic
- **Integration Tests**: Key workflows covered
- **Component Tests**: Major UI components tested
- **API Routes**: All endpoints tested

## Continuous Integration

### GitHub Actions Example

```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Bun
        uses: oven-sh/setup-bun@v1
        with:
          bun-version: latest
      
      - name: Install dependencies
        run: bun install
      
      - name: Run tests
        run: bun test
      
      - name: Build
        run: bun run build
```

## Test Data

### Synthetic Test Data

Use the UI to generate test data:

```typescript
// Generate test data programmatically
async function generateTestData(sessionId: string) {
  // Generate question
  await fetch('/api/questions/generate', {
    method: 'POST',
    body: JSON.stringify({ sessionId })
  });

  // Generate responses
  await fetch('/api/responses/generate', {
    method: 'POST',
    body: JSON.stringify({ count: 100, sessionId })
  });

  // Process themes
  await fetch('/api/themes/process', {
    method: 'POST',
    body: JSON.stringify({ sessionId })
  });
}
```

## Best Practices

### 1. Test Isolation

- Each test should be independent
- Clean up test data after tests
- Use unique session IDs for tests
- Mock external dependencies

### 2. Test Organization

- Group related tests with `describe`
- Use descriptive test names
- Follow AAA pattern (Arrange, Act, Assert)
- Keep tests focused and simple

### 3. Mocking

- Mock LLM calls for unit tests
- Use MSW for API mocking
- Create test fixtures for complex data
- Avoid over-mocking

### 4. Assertions

- Be specific in assertions
- Test both success and failure cases
- Verify error messages
- Check edge cases

## Debugging Tests

### Debug Output

```typescript
test('debug example', () => {
  const result = someFunction();
  console.log('Result:', result); // Bun will show this
  expect(result).toBe(expected);
});
```

### Breakpoints

```bash
# Run tests with debugger
bun test --inspect

# Then connect Chrome DevTools or VS Code debugger
```

## Future Testing Enhancements

### Planned Improvements

1. **E2E Testing** - Playwright for full user workflows
2. **Visual Regression** - Screenshot comparison testing
3. **Performance Monitoring** - Continuous performance tracking
4. **Test Database** - Separate test database setup
5. **Automated Testing** - CI/CD integration
6. **Load Testing** - Scalability testing with tools like k6

## Next Steps

1. Set up test infrastructure with Bun test
2. Write unit tests for core business logic
3. Add integration tests for API routes
4. Implement component tests for UI
5. Set up CI/CD for automated testing
6. Measure and improve test coverage
