import { describe, it, expect } from 'bun:test';
import { GET } from '../health/route';

describe('API: /api/health', () => {
  it('should return health status', async () => {
    const request = new Request('http://localhost/api/health');
    const response = await GET(request);
    
    expect(response.status).toBe(200);
    
    const data = await response.json();
    expect(data).toHaveProperty('status');
    expect(data.status).toBe('healthy');
  });
});

