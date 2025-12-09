/**
 * Export API - Export question and all responses
 */

import { NextResponse } from 'next/server';
import { db } from '@/lib/database';
import { getErrorMessage } from '@/lib/types';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const sessionId = url.searchParams.get('sessionId');
    
    if (!sessionId) {
      return NextResponse.json({ success: false, error: 'Session ID required' }, { status: 400 });
    }

    // Get current question
    const question = await db.getCurrentQuestion(sessionId);
    
    if (!question) {
      return NextResponse.json({ success: false, error: 'No question found' }, { status: 404 });
    }

    // Get all responses
    const { responses: allResponses } = await db.getResponses(sessionId, 1, 10000);
    
    // Format export data
    const exportData = {
      question,
      metadata: {
        total_responses: allResponses.length,
        exported_at: new Date().toISOString(),
        session_id: sessionId
      },
      responses: allResponses.map(r => ({
        id: r.id,
        text: r.response_text,
        batch_id: r.batch_id,
        created_at: r.created_at
      }))
    };

    return NextResponse.json({
      success: true,
      data: exportData
    });

  } catch (error: unknown) {
    console.error('Export error:', error);
    return NextResponse.json(
      { success: false, error: getErrorMessage(error) },
      { status: 500 }
    );
  }
}

