/**
 * Theme Processing - Semantic Span-based extraction
 * 
 * FLOW:
 * 1. Extract semantic spans from responses (goals, pain points, emotions, etc.)
 * 2. Cluster spans semantically into themes
 * 3. Merge with existing themes (if overlapping) or add as new
 * 4. Mark responses as processed
 */

import { db } from '@/lib/database';
import {
  extractSpansFromResponses
} from '@/lib/theme-evolution/span-extractor';
import {
  clusterSpansIntoThemes,
  buildThemesWithResponses,
  mergeSimilarThemes,
  deduplicateSpansAcrossThemes
} from '@/lib/theme-evolution/span-clusterer';
import { mergeWithExistingThemes } from '@/lib/theme-evolution/theme-merger';
import { getErrorMessage, type ProcessingStatus } from '@/lib/types';

export async function POST(request: Request) {
  const encoder = new TextEncoder();
  
  const sessionId = request.headers.get('x-session-id');
  if (!sessionId) {
    return new Response('Session ID required', { status: 400 });
  }

  const { question } = await request.json();
  
  if (!question) {
    return new Response('Question is required', { status: 400 });
  }

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: ProcessingStatus) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      try {
        // ============================================
        // STEP 1: Load UNPROCESSED responses
        // ============================================
        send({ type: 'status', message: 'Loading unprocessed responses...', progress: 5 });
        
        const { responses } = await db.getUnprocessedResponses(sessionId);
        if (responses.length === 0) {
          send({ type: 'error', message: 'No unprocessed responses found. Generate more responses first!' });
          controller.close();
          return;
        }
        
        console.log(`📦 Processing batch of ${responses.length} unprocessed responses`);

        // ============================================
        // STEP 2: Extract semantic spans
        // ============================================
        send({ type: 'status', message: 'Extracting semantic spans...', progress: 10 });
        
        const responsesWithSpans = await extractSpansFromResponses(
          responses.map(r => ({ id: r.id, text: r.response_text })),
          question,
          (done: number, total: number) => {
            const progress = 10 + Math.floor((done / total) * 30);
            send({ 
              type: 'status', 
              message: `Extracting spans: ${done}/${total}`, 
              progress 
            });
          }
        );

        console.log(`✅ Extracted spans from ${responsesWithSpans.length}/${responses.length} responses`);

        if (responsesWithSpans.length === 0) {
          send({ type: 'error', message: 'No semantic spans extracted from responses' });
          controller.close();
          return;
        }

        // ============================================
        // STEP 3: Cluster spans into themes
        // ============================================
        send({ type: 'status', message: 'Clustering spans into themes...', progress: 45 });
        
        const semanticThemes = await clusterSpansIntoThemes(
          responsesWithSpans,
          question,
          (msg: string) => send({ type: 'status', message: msg, progress: 50 })
        );
        
        console.log(`✅ Generated ${semanticThemes.length} semantic themes`);

        if (semanticThemes.length === 0) {
          send({ type: 'error', message: 'No themes could be generated from spans' });
          controller.close();
          return;
        }

        // ============================================
        // STEP 4: Build theme objects with responses
        // ============================================
        send({ type: 'status', message: 'Building theme associations...', progress: 60 });
        
        let finalThemes = buildThemesWithResponses(semanticThemes, responsesWithSpans);
        console.log(`✅ Built ${finalThemes.length} themes with response associations`);

        // ============================================
        // STEP 5: Merge similar themes
        // ============================================
        send({ type: 'status', message: 'Merging similar themes...', progress: 70 });
        
        finalThemes = await mergeSimilarThemes(finalThemes);
        console.log(`✅ After merge: ${finalThemes.length} themes`);

        // ============================================
        // STEP 6: Deduplicate spans
        // ============================================
        send({ type: 'status', message: 'Deduplicating spans...', progress: 80 });
        
        finalThemes = deduplicateSpansAcrossThemes(finalThemes);
        console.log(`✅ After dedup: ${finalThemes.length} themes`);

        // ============================================
        // STEP 7: Merge with existing themes
        // ============================================
        send({ type: 'status', message: 'Merging with existing themes...', progress: 85 });
        
        // Convert new themes to database format
        const newThemesData = finalThemes.map(theme => ({
          name: theme.name,
          description: theme.description,
          phrases: theme.contributingSpans.map(span => ({
            text: span.text,
            class: span.class
          })),
          response_count: theme.responses.length
        }));

        // Get existing themes
        const existingThemes = await db.getThemes(sessionId);
        
        // Merge with existing themes
        const mergeResult = await mergeWithExistingThemes(
          existingThemes,
          newThemesData,
          (msg) => send({ type: 'status', message: msg, progress: 88 })
        );

        // ============================================
        // STEP 8: Save results
        // ============================================
        send({ type: 'status', message: 'Saving themes...', progress: 92 });

        // Update existing themes that were merged
        for (const update of mergeResult.updatedThemes) {
          await db.updateTheme(update.id, {
            phrases: update.theme.phrases,
            response_count: update.theme.response_count
          });
        }

        // Add new themes
        if (mergeResult.newThemes.length > 0) {
          await db.saveThemes(sessionId, mergeResult.newThemes);
        }

        // Mark all responses as processed
        const processedIds = responses.map(r => r.id);
        await db.markResponsesProcessed(processedIds);

        // ============================================
        // STEP 9: Recalculate response counts for ALL themes
        //         Based on ALL responses (not just this batch)
        // ============================================
        send({ type: 'status', message: 'Recalculating response counts...', progress: 95 });
        await db.recalculateThemeResponseCounts(sessionId);

        // Calculate summary stats
        const totalThemes = existingThemes.length + mergeResult.newThemes.length;
        const totalPhrasesBeforeUpdate = existingThemes.reduce((sum, t) => sum + t.getPhrases().length, 0);
        const totalPhrasesAfterUpdate = mergeResult.updatedThemes.reduce((sum, u) => sum + u.theme.phrases.length, 0) +
          existingThemes.filter(t => !mergeResult.updatedThemes.some(u => u.id === t.id)).reduce((sum, t) => sum + t.getPhrases().length, 0) +
          mergeResult.newThemes.reduce((sum, t) => sum + t.phrases.length, 0);
        
        console.log(`\n📊 === BATCH PROCESSING SUMMARY ===`);
        console.log(`   Responses processed: ${processedIds.length}`);
        console.log(`   Existing themes: ${existingThemes.length}`);
        console.log(`   Themes updated (merged): ${mergeResult.updatedThemes.length}`);
        console.log(`   New themes added: ${mergeResult.newThemes.length}`);
        console.log(`   Total themes now: ${totalThemes}`);
        console.log(`   Total phrases: ${totalPhrasesBeforeUpdate} → ${totalPhrasesAfterUpdate} (+${totalPhrasesAfterUpdate - totalPhrasesBeforeUpdate})`);
        console.log(`================================\n`);

        // ============================================
        // STEP 10: Complete
        // ============================================
        send({
          type: 'complete',
          message: `Processed ${responses.length} responses. Updated ${mergeResult.updatedThemes.length}, added ${mergeResult.newThemes.length} themes`,
          themes_count: totalThemes,
          responses_count: responses.length,
          progress: 100
        });

        controller.close();

      } catch (error: unknown) {
        console.error('Theme processing error:', error);
        send({
          type: 'error',
          message: getErrorMessage(error)
        });
        controller.close();
      }
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
