import { NextResponse } from 'next/server';
import { ollama } from '../../../../lib/ollama';
import { db } from '../../../../lib/database';

export async function POST(request: Request) {
  try {
    const sessionId = request.headers.get('x-session-id');
    if (!sessionId) {
      return NextResponse.json({ success: false, error: 'Session ID required' }, { status: 400 });
    }

    const { question, count = 20 } = await request.json();
    
    if (!question) {
      return NextResponse.json(
        { success: false, error: 'Question is required' },
        { status: 400 }
      );
    }
    
    // Generate responses in parallel
    const responses = await llm.generateMultipleResponses(question, count);
    
    // Get next batch ID for this session
    const stats = await db.getStats(sessionId);
    const batchId = stats.batches_generated + 1;
    
    // Save to database
    await db.saveResponses(sessionId, question, responses, batchId);
    
    return NextResponse.json({ 
      success: true,
      responses,
      count: responses.length,
      batchId,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Response generation error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

