'use client';

import { useState, useEffect } from 'react';
import { StatsCard } from '@/components/StatsCard';
import { ActionButton } from '@/components/ActionButton';
import { QuestionDisplay } from '@/components/QuestionDisplay';
import { ThemesTab } from '@/components/ThemesTab';
import { ResponsesTab } from '@/components/ResponsesTab';
import { getSessionId } from '@/lib/session';
import { useThemeEvolution } from './hooks/useThemeEvolution';

export default function Home() {
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [sessionId, setSessionId] = useState<string>('');
  const [activeTab, setActiveTab] = useState('themes');

  const evolution = useThemeEvolution(sessionId);

  useEffect(() => {
    const id = getSessionId();
    setSessionId(id);
  }, []);

  useEffect(() => {
    if (sessionId) {
      loadInitialData();
    }
  }, [sessionId]);

  const loadInitialData = async () => {
    setIsInitialLoading(true);
    try {
      await Promise.all([
        evolution.loadStats(),
        evolution.loadCurrentQuestion()
      ]);
    } finally {
      setIsInitialLoading(false);
    }
  };

  const hasQuestion = Boolean(evolution.currentQuestion);
  const hasUnprocessedResponses = evolution.stats.batches_generated > evolution.stats.batches_processed;
  const anyOperationActive = evolution.isGeneratingQuestion || evolution.isGeneratingResponses || evolution.isProcessingThemes;

  // Show loading screen while fetching initial data
  if (isInitialLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-slate-900 to-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin mb-6 mx-auto"></div>
          <p className="text-white/60 text-xl">Loading Theme Evolution System...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen min-page-width">
      {/* Animated background */}
      <div className="fixed inset-0 bg-gradient-to-br from-gray-950 via-slate-900 to-gray-950"></div>
      <div className="fixed inset-0 bg-[url('/grid.svg')] opacity-10"></div>
      
      {/* Floating particles */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-72 h-72 bg-blue-600/15 rounded-full filter blur-3xl animate-float"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-cyan-600/15 rounded-full filter blur-3xl animate-float-delayed"></div>
      </div>

      <div className="relative z-10 flex">
        {/* Sidebar */}
        <div className="w-96 min-h-screen p-8 glass border-r border-white/10">
          <div className="space-y-8">
            {/* Logo */}
            <div className="text-center pb-6 border-b border-white/10">
              <h1 className="text-4xl font-black mb-2">
                <span className="gradient-text">🧠 Theme Evolution</span>
              </h1>
              <p className="text-white/60 text-sm">AI-Powered Theme Extraction</p>
            </div>
            
            {/* Actions */}
            <div className="space-y-4">
              <ActionButton
                label={evolution.isGeneratingQuestion ? "🔄 Generating..." : "🎯 Generate Question"}
                onClick={evolution.generateQuestion}
                disabled={anyOperationActive}
                loading={evolution.isGeneratingQuestion}
                variant="primary"
              />
              
              <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
              
              <ActionButton
                label={evolution.isGeneratingResponses ? `Generating ${evolution.responseProgress.current}/${evolution.responseProgress.total}...` : "📝 Generate Responses"}
                onClick={evolution.generateResponses}
                disabled={!hasQuestion || anyOperationActive}
                loading={evolution.isGeneratingResponses}
                progress={evolution.isGeneratingResponses ? (evolution.responseProgress.current / evolution.responseProgress.total) * 100 : undefined}
                helpText={!hasQuestion ? "Generate a question first" : undefined}
                variant="secondary"
              />
              
              <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
              
              <ActionButton
                label={evolution.isProcessingThemes && evolution.themeProgress.message ? evolution.themeProgress.message : evolution.isProcessingThemes ? "🔄 Processing..." : "⚡ Extract Themes"}
                onClick={evolution.processThemes}
                disabled={anyOperationActive || !hasUnprocessedResponses}
                loading={evolution.isProcessingThemes}
                progress={evolution.isProcessingThemes ? evolution.themeProgress.progress : undefined}
                helpText={!hasUnprocessedResponses ? "Generate responses first" : anyOperationActive && !evolution.isProcessingThemes ? "Operation in progress" : undefined}
                variant="accent"
              />
              
              <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
              
              <ActionButton
                label="📥 Export Data"
                onClick={evolution.exportData}
                disabled={anyOperationActive || evolution.stats.total_responses === 0}
                loading={false}
                helpText={evolution.stats.total_responses === 0 ? "No data to export" : "Download question & responses"}
                variant="secondary"
              />
            </div>

          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-8 overflow-y-auto max-h-screen">
          <div className="max-w-7xl mx-auto space-y-8">
            <QuestionDisplay question={evolution.currentQuestion} />
            
            {/* Main Stats Cards */}
            <div className="grid grid-cols-4 gap-6">
              <StatsCard icon="📊" label="Total Responses" value={evolution.stats.total_responses} color="blue" />
              <StatsCard icon="🎯" label="Themes Found" value={evolution.stats.total_themes} color="purple" />
              <StatsCard icon="📦" label="Batches Generated" value={evolution.stats.batches_generated} color="pink" />
              <StatsCard icon="✅" label="Batches Processed" value={evolution.stats.batches_processed} color="green" />
            </div>

            {/* Tabs */}
            <div className="glass rounded-2xl p-1 overflow-hidden">
              <div className="flex gap-4 mb-6 p-2">
                {[
                  { id: 'themes', label: 'Themes', icon: '🎯' },
                  { id: 'responses', label: 'Responses', icon: '📝' },
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 px-8 py-4 rounded-xl text-base font-bold transition-all duration-300 ${
                      activeTab === tab.id
                        ? 'bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500 text-white shadow-lg shadow-blue-500/50'
                        : 'text-white/60 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <span className="text-2xl mr-3">{tab.icon}</span>
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="p-6">
                {activeTab === 'themes' && <ThemesTab key={`themes-${evolution.refreshKey}`} sessionId={sessionId} />}
                {activeTab === 'responses' && <ResponsesTab key={`responses-${evolution.refreshKey}`} sessionId={sessionId} />}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
