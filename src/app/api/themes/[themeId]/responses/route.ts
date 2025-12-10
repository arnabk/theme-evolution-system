import { NextResponse } from 'next/server';
import { getDataSource } from '@/lib/data-source';
import { Response } from '@/lib/entities/Response';
import { Theme, ThemePhrase } from '@/lib/entities/Theme';
import { getErrorMessage } from '@/lib/types';

// Highlight structure for UI
interface Highlight {
  text: string;
  start: number;
  end: number;
  class: string;
}

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
    
    // Validate themeId
    if (isNaN(themeId)) {
      return NextResponse.json({ success: false, error: 'Invalid theme ID' }, { status: 400 });
    }
    
    // Get pagination params
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const pageSize = parseInt(url.searchParams.get('pageSize') || '10');
    
    const dataSource = await getDataSource();
    const themeRepo = dataSource.getRepository(Theme);
    const responseRepo = dataSource.getRepository(Response);

    // Get the theme with its phrases
    const theme = await themeRepo.findOne({ where: { id: themeId } });
    if (!theme) {
      return NextResponse.json({ success: false, error: 'Theme not found' }, { status: 404 });
    }

    // Parse theme phrases
    let phrases: ThemePhrase[] = [];
    if (typeof theme.getPhrases === 'function') {
      phrases = theme.getPhrases();
    } else if (theme.phrases) {
      try {
        phrases = JSON.parse(theme.phrases);
      } catch {
        phrases = [];
      }
    }
    
    if (phrases.length === 0) {
      return NextResponse.json({
        success: true,
        responses: [],
        count: 0,
        total: 0,
        page,
        pageSize,
        hasMore: false,
      });
    }

    // Get all responses for this session
    const allResponses = await responseRepo.find({
      where: { session_id: sessionId },
      order: { created_at: 'DESC' }
    });

    // Find responses that match theme phrases
    const matchingResponses: Array<{
      id: number;
      text: string;
      highlights: Highlight[];
      confidence: number;
    }> = [];

    for (const response of allResponses) {
      if (!response || !response.response_text) continue;
      const highlights = findPhraseMatches(response.response_text, phrases);
      
      if (highlights.length > 0) {
        matchingResponses.push({
          id: response.id,
          text: response.response_text,
          highlights,
          confidence: Math.min(1, highlights.length * 0.3)  // Confidence based on match count
        });
      }
    }

    // Paginate results
    const total = matchingResponses.length;
    const startIdx = (page - 1) * pageSize;
    const paginatedResponses = matchingResponses.slice(startIdx, startIdx + pageSize);

    return NextResponse.json({
      success: true,
      responses: paginatedResponses,
      count: paginatedResponses.length,
      total,
      page,
      pageSize,
      hasMore: startIdx + paginatedResponses.length < total,
    });

  } catch (error: unknown) {
    console.error('Get theme responses error:', error);
    return NextResponse.json(
      { success: false, error: getErrorMessage(error) },
      { status: 500 }
    );
  }
}

/**
 * Find all matching phrases in response text
 */
function findPhraseMatches(text: string, phrases: ThemePhrase[]): Highlight[] {
  const highlights: Highlight[] = [];
  const lowerText = text.toLowerCase();
  const usedRanges: Array<{ start: number; end: number }> = [];

  for (const phrase of phrases) {
    const lowerPhrase = phrase.text.toLowerCase();
    let searchStart = 0;

    while (true) {
      const foundIndex = lowerText.indexOf(lowerPhrase, searchStart);
      if (foundIndex === -1) break;

      const endIndex = foundIndex + phrase.text.length;

      // Check for overlap with existing highlights
      const overlaps = usedRanges.some(r => 
        (foundIndex >= r.start && foundIndex < r.end) ||
        (endIndex > r.start && endIndex <= r.end) ||
        (foundIndex <= r.start && endIndex >= r.end)
      );

      if (!overlaps) {
        // Get actual text from response (preserve original case)
        const actualText = text.substring(foundIndex, endIndex);
        
        highlights.push({
          text: actualText,
          start: foundIndex,
          end: endIndex,
          class: phrase.class
        });
        
        usedRanges.push({ start: foundIndex, end: endIndex });
      }

      searchStart = foundIndex + 1;
    }
  }

  // Sort by position
  highlights.sort((a, b) => a.start - b.start);
  
  return highlights;
}
