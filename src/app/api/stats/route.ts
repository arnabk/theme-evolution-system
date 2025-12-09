import { NextResponse } from 'next/server';
import { db } from '@/lib/database';
import { getErrorMessage } from '@/lib/types';

export async function GET(request: Request) {
  try {
    const sessionId = request.headers.get('x-session-id');
    if (!sessionId) {
      return NextResponse.json({ success: false, error: 'Session ID required' }, { status: 400 });
    }

    const stats = await db.getStats(sessionId);
    
    return NextResponse.json({ 
      success: true,
      ...stats,
      session_id: sessionId,
      timestamp: new Date().toISOString()
    });
  } catch (error: unknown) {
    console.error('Stats error:', error);
    return NextResponse.json(
      { success: false, error: getErrorMessage(error) },
      { status: 500 }
    );
  }
}

