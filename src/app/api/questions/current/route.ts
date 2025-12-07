import { NextResponse } from 'next/server';
import { db } from '../../../../lib/database';

export async function GET(request: Request) {
  try {
    const sessionId = request.headers.get('x-session-id');
    if (!sessionId) {
      return NextResponse.json({ success: false, error: 'Session ID required' }, { status: 400 });
    }

    const question = await db.getCurrentQuestion(sessionId);
    
    return NextResponse.json({ 
      success: true,
      question,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Get current question error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

