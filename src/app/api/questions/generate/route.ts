import { NextResponse } from 'next/server';
import { llm } from '@/lib/llm';
import { db } from '@/lib/database';
import { getErrorMessage } from '@/lib/types';

export async function POST(request: Request) {
  try {
    const sessionId = request.headers.get('x-session-id');
    if (!sessionId) {
      return NextResponse.json({ success: false, error: 'Session ID required' }, { status: 400 });
    }

    // Clear all previous session data (responses, themes, assignments)
    await db.clearSessionData(sessionId);
    
    // Generate new question
    const question = await llm.generateQuestion();
    
    // Save new question to database
    await db.saveCurrentQuestion(sessionId, question);
    
    return NextResponse.json({ 
      success: true,
      question,
      timestamp: new Date().toISOString()
    });
  } catch (error: unknown) {
    console.error('Question generation error:', error);
    return NextResponse.json(
      { success: false, error: getErrorMessage(error) },
      { status: 500 }
    );
  }
}

