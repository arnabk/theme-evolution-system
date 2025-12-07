import { NextResponse } from 'next/server';
import { ollama } from '../../../../lib/ollama';
import { db } from '../../../../lib/database';

export async function POST(request: Request) {
  try {
    const sessionId = request.headers.get('x-session-id');
    if (!sessionId) {
      return NextResponse.json({ success: false, error: 'Session ID required' }, { status: 400 });
    }

    const question = await llm.generateQuestion();
    
    // Save question to database
    await db.saveCurrentQuestion(sessionId, question);
    
    return NextResponse.json({ 
      success: true,
      question,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Question generation error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

