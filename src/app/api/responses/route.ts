import { NextResponse } from 'next/server';
import { db } from '@/lib/database';
import { getErrorMessage } from '@/lib/types';

export async function GET(request: Request) {
  try {
    const sessionId = request.headers.get('x-session-id');
    if (!sessionId) {
      return NextResponse.json({ success: false, error: 'Session ID required' }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    const batchId = searchParams.get('batchId');
    
    const result = await db.getResponses(
      sessionId,
      page, 
      pageSize, 
      batchId ? parseInt(batchId) : undefined
    );
    
    return NextResponse.json({ 
      success: true,
      ...result,
      timestamp: new Date().toISOString()
    });
  } catch (error: unknown) {
    console.error('Get responses error:', error);
    return NextResponse.json(
      { success: false, error: getErrorMessage(error) },
      { status: 500 }
    );
  }
}

