import { NextResponse } from 'next/server';
import { getDataSource } from '../../../../../lib/data-source';
import { Response } from '../../../../../lib/entities/Response';
import { ThemeAssignment } from '../../../../../lib/entities/ThemeAssignment';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ themeId: string }> }
) {
  try {
    const sessionId = request.headers.get('x-session-id');
    if (!sessionId) {
      return NextResponse.json({ success: false, error: 'Session ID required' }, { status: 400 });
    }

    const { themeId: themeIdStr } = await params;
    const themeId = parseInt(themeIdStr);
    
    // Get pagination params from query string
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const pageSize = parseInt(url.searchParams.get('pageSize') || '10');
    
    const dataSource = await getDataSource();
    const assignmentRepo = dataSource.getRepository(ThemeAssignment);
    const responseRepo = dataSource.getRepository(Response);

    // Get all assignments for this theme
    const [assignments, totalAssignments] = await assignmentRepo.findAndCount({
      where: { theme_id: themeId },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    // Get the responses with highlights
    const responsesWithHighlights = await Promise.all(
      assignments.map(async (assignment) => {
        const response = await responseRepo.findOne({
          where: { id: assignment.response_id },
        });

        if (!response) return null;

        // Parse highlighted keywords
        let highlights: any[] = [];
        if (assignment.highlighted_keywords) {
          try {
            highlights = JSON.parse(assignment.highlighted_keywords as string);
          } catch (e) {
            highlights = [];
          }
        }

        // Extract keywords from contributing_text
        const keywords = assignment.contributing_text?.split(',').map(k => k.trim()).filter(k => k) || [];

        // Check if any keywords actually exist in the response text
        const hasMatchingKeywords = keywords.some(keyword => 
          response.response_text.toLowerCase().includes(keyword.toLowerCase())
        );

        // Only return if there are matching keywords
        if (!hasMatchingKeywords || keywords.length === 0) {
          return null;
        }

        return {
          id: response.id,
          text: response.response_text,
          keywords,
          highlights,
          confidence: assignment.confidence,
        };
      })
    );

    const validResponses = responsesWithHighlights.filter(r => r !== null);

    return NextResponse.json({
      success: true,
      responses: validResponses,
      count: validResponses.length,
      total: totalAssignments,
      page,
      pageSize,
      hasMore: page * pageSize < totalAssignments,
    });
  } catch (error: any) {
    console.error('Get theme responses error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

