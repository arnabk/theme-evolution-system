import { NextResponse } from 'next/server';
import { db } from '../../../../lib/database';

export async function POST(request: Request) {
  try {
    const sessionId = request.headers.get('x-session-id');
    if (!sessionId) {
      return NextResponse.json({ success: false, error: 'Session ID required' }, { status: 400 });
    }

    await db.clearSessionData(sessionId);
    
    return NextResponse.json({ 
      success: true,
      message: 'Session data cleared',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Clear session data error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

