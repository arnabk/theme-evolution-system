'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { ThemesList, ResponsesList } from './themes';

interface Theme {
  id: number;
  name: string;
  description: string;
  phrases?: string;  // JSON string of ThemePhrase[]
  response_count: number;
  created_at: string;
  updated_at: string;
}

interface Highlight {
  text: string;
  start: number;
  end: number;
}

interface ThemeResponse {
  id: number;
  text: string;
  keywords: string[];
  highlights: Highlight[];
  confidence: number;
}

interface ThemesTabProps {
  sessionId: string;
}

export function ThemesTab({ sessionId }: ThemesTabProps) {
  const [themes, setThemes] = useState<Theme[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTheme, setSelectedTheme] = useState<Theme | null>(null);
  const [themeResponses, setThemeResponses] = useState<ThemeResponse[]>([]);
  const [loadingResponses, setLoadingResponses] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const currentPageRef = useRef(1);

  useEffect(() => {
    if (sessionId) {
      loadThemes();
    }
  }, [sessionId]);

  const loadThemes = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/themes', {
        headers: { 'x-session-id': sessionId }
      });
      const data = await res.json();
      if (data.success && data.themes.length > 0) {
        setThemes(data.themes);
        // Auto-select first theme
        setSelectedTheme(data.themes[0]);
        loadThemeResponses(data.themes[0].id);
      }
    } catch (error) {
      console.error('Failed to load themes:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadThemeResponses = async (themeId: number, page: number = 1, append: boolean = false) => {
    if (append) {
      setLoadingMore(true);
    } else {
      setLoadingResponses(true);
      setThemeResponses([]);
      setCurrentPage(1);
      currentPageRef.current = 1;
      setHasMore(true);
    }

    try {
      const res = await fetch(`/api/themes/${themeId}/responses?page=${page}&pageSize=10`, {
        headers: { 'x-session-id': sessionId }
      });
      const data = await res.json();
      if (data.success) {
        console.log(`✅ Loaded ${data.responses.length} responses (page ${page}, hasMore: ${data.hasMore})`);
        if (append) {
          setThemeResponses(prev => [...prev, ...data.responses]);
        } else {
          setThemeResponses(data.responses);
        }
        setHasMore(data.hasMore || false);
        setCurrentPage(page);
        currentPageRef.current = page;
      }
    } catch (error) {
      console.error('Failed to load theme responses:', error);
    } finally {
      setLoadingResponses(false);
      setLoadingMore(false);
    }
  };

  const selectTheme = (theme: Theme) => {
    setSelectedTheme(theme);
    loadThemeResponses(theme.id, 1, false);
  };

  // Load more handler (called by Intersection Observer in ResponsesList)
  const handleLoadMore = useCallback(() => {
    if (selectedTheme && hasMore && !loadingMore) {
      const nextPage = currentPageRef.current + 1;
      console.log(`📄 Loading page ${nextPage} for theme ${selectedTheme.id}`);
      loadThemeResponses(selectedTheme.id, nextPage, true);
    }
  }, [selectedTheme, hasMore, loadingMore]);

  if (loading) {
    return (
      <div className="text-center py-20">
        <div className="inline-block">
          <div className="w-16 h-16 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin mb-4"></div>
          <p className="text-white/60 text-lg">Loading themes...</p>
        </div>
      </div>
    );
  }

  if (themes.length === 0) {
    return (
      <div className="text-center py-24">
        <div className="inline-block glass-dark rounded-3xl p-12">
          <div className="text-8xl mb-6">🎯</div>
          <p className="text-3xl font-bold gradient-text mb-4">No themes available</p>
          <p className="text-white/50 text-lg">Extract themes from responses to see them here!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-6">
      <ThemesList 
        themes={themes}
        selectedTheme={selectedTheme}
        onSelectTheme={selectTheme}
      />
      
      <ResponsesList
        selectedTheme={selectedTheme}
        responses={themeResponses}
        loading={loadingResponses}
        loadingMore={loadingMore}
        hasMore={hasMore}
        onLoadMore={handleLoadMore}
      />
    </div>
  );
}
