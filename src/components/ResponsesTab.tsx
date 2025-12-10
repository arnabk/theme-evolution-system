'use client';

import { useState, useEffect } from 'react';

interface Response {
  id: number;
  response_text: string;
  batch_id: number;
  question: string;
  created_at: string;
  highlights?: Array<{ text: string; start: number; end: number }>;
}

interface ResponsesTabProps {
  sessionId: string;
}

export function ResponsesTab({ sessionId }: ResponsesTabProps) {
  const [responses, setResponses] = useState<Response[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (sessionId) {
      loadResponses();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, sessionId]);

  const loadResponses = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/responses?page=${page}&pageSize=10`, {
        headers: { 'x-session-id': sessionId }
      });
      const data = await res.json();
      if (data.success) {
        setResponses(data.responses);
        setTotalPages(data.totalPages);
        setTotal(data.total);
      }
    } catch (error) {
      console.error('Failed to load responses:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-20">
        <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-white/60 text-lg">Loading responses...</p>
      </div>
    );
  }

  if (responses.length === 0) {
    return (
      <div className="text-center py-24">
        <div className="inline-block glass-dark rounded-3xl p-12">
          <div className="text-8xl mb-6">📝</div>
          <p className="text-3xl font-bold gradient-text mb-4">No responses available</p>
          <p className="text-white/50 text-lg">Generate responses to see them here!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-3xl font-black gradient-text">Survey Responses</h3>
        <span className="glass-dark px-6 py-2 rounded-full text-white/60 text-sm font-semibold">
          {total} total responses
        </span>
      </div>

      <div className="grid gap-4">
        {responses.map((response, idx) => (
          <div
            key={response.id}
            className="glass rounded-2xl p-6 hover:scale-[1.01] transition-all duration-300 border-l-2 border-blue-400/50 hover:border-blue-400"
            style={{ animationDelay: `${idx * 50}ms` }}
          >
            <div className="flex justify-between items-start mb-3">
              <span className="glass-dark px-4 py-1.5 rounded-full text-xs font-bold text-white/80">
                #{response.id}
              </span>
              <span className="text-xs text-white/40 glass-dark px-3 py-1 rounded-full">
                Batch {response.batch_id}
              </span>
            </div>
            <p className="text-white/90 leading-relaxed text-lg">
              {response.response_text}
            </p>
            <div className="mt-4 flex items-center gap-2 text-white/30 text-xs">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"></div>
              <span>{new Date(response.created_at).toLocaleString()}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 pt-6">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="glass px-6 py-3 rounded-xl font-semibold text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/20 transition-all hover:scale-110"
          >
            ← Previous
          </button>
          <span className="glass-dark px-8 py-3 rounded-xl text-white font-bold text-lg">
            {page} <span className="text-white/40">/</span> {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="glass px-6 py-3 rounded-xl font-semibold text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/20 transition-all hover:scale-110"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
