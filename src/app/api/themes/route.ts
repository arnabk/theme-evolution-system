import { NextResponse } from 'next/server';
import { db } from '@/lib/database';
import { getErrorMessage } from '@/lib/types';

export async function GET(request: Request) {
  try {
    const sessionId = request.headers.get('x-session-id');
    if (!sessionId) {
      return NextResponse.json({ success: false, error: 'Session ID required' }, { status: 400 });
    }

    const themes = await db.getThemes(sessionId);
    
    return NextResponse.json({ 
      success: true,
      themes,
      count: themes.length,
      timestamp: new Date().toISOString()
    });
  } catch (error: unknown) {
    console.error('Get themes error:', error);
    return NextResponse.json(
      { success: false, error: getErrorMessage(error) },
      { status: 500 }
    );
  }
}

