/**
 * Custom hook for theme evolution operations
 */

import { useState, useCallback } from 'react';

export interface Stats {
  total_responses: number;
  total_themes: number;
  batches_generated: number;
  batches_processed: number;
}

export function useThemeEvolution(sessionId: string) {
  const [stats, setStats] = useState<Stats>({
    total_responses: 0,
    total_themes: 0,
    batches_generated: 0,
    batches_processed: 0
  });
  const [currentQuestion, setCurrentQuestion] = useState<string>('');
  const [currentBatchId, setCurrentBatchId] = useState<number | null>(null);
  const [isGeneratingQuestion, setIsGeneratingQuestion] = useState(false);
  const [isGeneratingResponses, setIsGeneratingResponses] = useState(false);
  const [isProcessingThemes, setIsProcessingThemes] = useState(false);
  const [responseProgress, setResponseProgress] = useState({ current: 0, total: 0 });
  const [themeProgress, setThemeProgress] = useState({ message: '', progress: 0 });
  const [refreshKey, setRefreshKey] = useState(0);

  const loadStats = async () => {
    try {
      const res = await fetch('/api/stats', {
        headers: { 'x-session-id': sessionId }
      });
      const data = await res.json();
      if (data.success) {
        setStats({
          total_responses: data.total_responses,
          total_themes: data.total_themes,
          batches_generated: data.batches_generated,
          batches_processed: data.batches_processed
        });
      }
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const loadCurrentQuestion = async () => {
    try {
      const res = await fetch('/api/questions/current', {
        headers: { 'x-session-id': sessionId }
      });
      const data = await res.json();
      if (data.success && data.question) {
        setCurrentQuestion(data.question);
      }
    } catch (error) {
      console.error('Failed to load current question:', error);
    }
  };

  const generateQuestion = async () => {
    setIsGeneratingQuestion(true);
    try {
      const res = await fetch('/api/questions/generate', {
        method: 'POST',
        headers: { 'x-session-id': sessionId }
      });
      const data = await res.json();
      
      if (data.success) {
        setCurrentQuestion(data.question);
        setCurrentBatchId(null);
        await loadStats();
        setRefreshKey(prev => prev + 1);
      }
    } catch (error: unknown) {
      console.error('Failed to generate question:', error);
    } finally {
      setIsGeneratingQuestion(false);
    }
  };

  const generateResponses = async () => {
    setIsGeneratingResponses(true);
    setResponseProgress({ current: 0, total: 20 });
    
    try {
      const progressInterval = setInterval(() => {
        setResponseProgress(prev => {
          if (prev.current < prev.total - 1) {
            return { ...prev, current: prev.current + 1 };
          }
          return prev;
        });
      }, 500);
      
      const res = await fetch('/api/responses/generate', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-session-id': sessionId
        },
        body: JSON.stringify({ question: currentQuestion, count: 20 })
      });
      const data = await res.json();
      
      clearInterval(progressInterval);
      setResponseProgress({ current: 20, total: 20 });
      
      if (data.success) {
        setCurrentBatchId(data.batchId);
        await loadStats();
        setRefreshKey(prev => prev + 1);
      }
    } catch (error: unknown) {
      console.error('Failed to generate responses:', error);
    } finally {
      setIsGeneratingResponses(false);
      setResponseProgress({ current: 0, total: 0 });
    }
  };

  const exportData = useCallback(async () => {
    try {
      const res = await fetch(`/api/export?sessionId=${sessionId}`);
      const data = await res.json();
      
      if (data.success) {
        // Create filename with timestamp
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        const filename = `theme-evolution-export-${timestamp}.json`;
        
        // Create blob and download
        const blob = new Blob([JSON.stringify(data.data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        console.log('✅ Exported data successfully');
        return true;
      }
      return false;
    } catch (error: unknown) {
      console.error('Export failed:', error);
      return false;
    }
  }, [sessionId]);

  const processThemes = async () => {
    setIsProcessingThemes(true);
    setThemeProgress({ message: 'Starting theme extraction...', progress: 0 });
    
    try {
      const res = await fetch('/api/themes/process', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-session-id': sessionId
        },
        body: JSON.stringify({ question: currentQuestion, batchId: currentBatchId })
      });

      if (!res.ok || !res.body) {
        throw new Error('Failed to start theme processing');
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              
              if (data.type === 'status') {
                setThemeProgress({ message: data.message, progress: data.progress });
              } else if (data.type === 'complete') {
                setThemeProgress({ message: data.message, progress: 100 });
                await loadStats();
                setRefreshKey(prev => prev + 1);
              } else if (data.type === 'error') {
                console.error('Theme processing error:', data.message);
                setThemeProgress({ message: `Error: ${data.message}`, progress: 0 });
              }
            } catch (e) {
              console.error('Failed to parse SSE data:', e);
            }
          }
        }
      }
    } catch (error: unknown) {
      console.error('Failed to process themes:', error);
      setThemeProgress({ message: 'Failed to process themes', progress: 0 });
    } finally {
      setIsProcessingThemes(false);
      setTimeout(() => setThemeProgress({ message: '', progress: 0 }), 2000);
    }
  };

  return {
    stats,
    currentQuestion,
    currentBatchId,
    isGeneratingQuestion,
    isGeneratingResponses,
    isProcessingThemes,
    responseProgress,
    themeProgress,
    refreshKey,
    loadStats,
    loadCurrentQuestion,
    generateQuestion,
    generateResponses,
    processThemes,
    exportData,
  };
}

