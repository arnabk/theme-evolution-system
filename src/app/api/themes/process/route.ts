/**
 * Theme Processing API Route - Orchestrates theme extraction and evolution
 */

import { db } from '../../../../lib/database';
import {
  extractInitialThemes,
  evolveExistingThemes,
  mergeThemesWithOverlap,
  deduplicateKeywords,
  assignAllResponses,
  type ThemeWithKeywords
} from '../../../../lib/theme-evolution';

export async function POST(request: Request) {
  const encoder = new TextEncoder();
  
  const sessionId = request.headers.get('x-session-id');
  if (!sessionId) {
    return new Response('Session ID required', { status: 400 });
  }

  const { question, batchId } = await request.json();
  
  if (!question) {
    return new Response('Question is required', { status: 400 });
  }

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: any) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      try {
        // Step 1: Load responses
        send({ type: 'status', message: 'Loading responses...', progress: 0 });
        const { responses } = await db.getResponses(sessionId, 1, 1000, batchId);
        const responseTexts = responses.map(r => r.response_text);
        
        if (responses.length === 0) {
          send({ type: 'error', message: 'No responses found for this batch' });
          controller.close();
          return;
        }

        // Step 2: Load existing themes
        send({ type: 'status', message: 'Loading existing themes...', progress: 5 });
        const existingThemes = await db.getThemes(sessionId);
        console.log(`📊 Starting evolution with ${existingThemes.length} existing themes`);

        // Step 3: Extract or evolve themes
        const extractionMessage = existingThemes.length > 0 
          ? 'Evolving existing themes...' 
          : 'Extracting themes from responses...';
        send({ type: 'status', message: extractionMessage, progress: 10 });

        let extractedThemes;
        try {
          if (existingThemes.length > 0) {
            extractedThemes = await evolveExistingThemes(question, responseTexts, existingThemes);
          } else {
            extractedThemes = await extractInitialThemes(question, responseTexts);
          }
        } catch (error: any) {
          console.error('Theme extraction failed:', error);
          send({ type: 'error', message: `Extraction failed: ${error.message}` });
          controller.close();
          return;
        }

        if (extractedThemes.length === 0) {
          send({ type: 'error', message: 'No themes extracted' });
          controller.close();
          return;
        }

        // Step 4: Process keywords
        send({ type: 'status', message: 'Processing keywords...', progress: 20 });
        
        const themesWithArrays = extractedThemes.map(theme => ({
          ...theme,
          keywordArray: theme.keywords?.split(',').map(k => k.trim()).filter(k => k) || []
        }));

        // Step 5: Merge similar themes (>50% overlap)
        send({ type: 'status', message: 'Merging similar themes...', progress: 22 });
        const mergedThemes = mergeThemesWithOverlap(themesWithArrays, 50);

        // Step 6: If we have existing themes, consolidate with them
        let finalThemes;
        if (existingThemes.length > 0) {
          send({ type: 'status', message: 'Consolidating with existing themes...', progress: 24 });
          
          const allThemes: ThemeWithKeywords[] = [
            ...existingThemes.map(t => ({
              ...t,
              keywordArray: (Array.isArray(t.keywords) ? t.keywords : t.keywords?.split(',') || []).map(k => k.trim().toLowerCase()),
              keywords: Array.isArray(t.keywords) ? t.keywords.join(', ') : t.keywords || '',
              isExisting: true
            })),
            ...mergedThemes.map(t => ({ ...t, isExisting: false }))
          ];

          finalThemes = mergeThemesWithOverlap(allThemes, 50);
        } else {
          finalThemes = mergedThemes;
        }

        // Step 7: Deduplicate keywords
        send({ type: 'status', message: 'Ensuring keyword uniqueness...', progress: 26 });
        const cleanedThemes = deduplicateKeywords(finalThemes);

        if (cleanedThemes.length === 0) {
          send({ type: 'error', message: 'No distinct themes after processing' });
          controller.close();
          return;
        }

        console.log(`✅ Evolution: ${existingThemes.length} existing + ${extractedThemes.length} extracted → ${cleanedThemes.length} final`);

        send({
          type: 'status',
          message: `${existingThemes.length > 0 ? 'Evolved' : 'Found'} ${cleanedThemes.length} distinct themes`,
          progress: 30,
          themes_found: cleanedThemes.length
        });

        // Step 8: Convert to database format
        const dbThemes = cleanedThemes.map((theme, index) => {
          const existingTheme = existingThemes.find(et =>
            et.name.toLowerCase() === theme.name.toLowerCase()
          );

          return {
            id: existingTheme?.id || (existingThemes.length + index + 1),
            session_id: sessionId,
            name: theme.name,
            description: theme.description || `Theme: ${theme.name}`,
            confidence: 0.8,
            centroid_embedding: null,
            is_active: true,
            created_at: existingTheme?.created_at || new Date(),
            updated_at: new Date(),
          };
        });

        // Step 9: Assign responses to themes
        const assignments = await assignAllResponses(
          responses,
          cleanedThemes,
          (current, total) => {
            const progress = 30 + Math.floor((current / total) * 60);
            send({
              type: 'status',
              message: `Processing response ${current}/${total}...`,
              progress,
              current_response: current,
              total_responses: total
            });
          }
        );

        // Step 10: Save to database
        send({ type: 'status', message: 'Saving themes...', progress: 95 });
        await db.saveThemes(sessionId, dbThemes, assignments);

        // Step 11: Complete
        send({
          type: 'complete',
          message: 'Theme evolution complete!',
          progress: 100,
          themes_count: cleanedThemes.length,
          assignments_count: assignments.length,
          responses_count: responses.length
        });

        controller.close();
      } catch (error: any) {
        console.error('Theme processing error:', error);
        send({ type: 'error', message: error.message || 'Failed to process themes' });
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
