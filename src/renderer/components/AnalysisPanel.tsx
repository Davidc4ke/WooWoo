import React, { useState, useEffect, useRef } from 'react';
import Markdown from 'react-markdown';
import { useAnalysisStore } from '../stores/useAnalysisStore';
import { useSettingsStore } from '../stores/useSettingsStore';
import { useUIStore } from '../stores/useUIStore';
import { analyseEntry } from '../ai/analysisService';
import type { EntryType, Analysis } from '../../shared/types';

const loadingMessages = [
  'Consulting the stars...',
  'Reading the cosmic patterns...',
  'Aligning the celestial bodies...',
  'Weaving the threads of insight...',
  'Gazing into the soul mirror...',
];

function formatAnalysisDate(isoStr: string): string {
  const d = new Date(isoStr);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

interface AnalysisPanelProps {
  entryId: string;
  entryType: EntryType;
}

const AnalysisPanel: React.FC<AnalysisPanelProps> = ({ entryId, entryType }) => {
  const [streamingText, setStreamingText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingMsg, setLoadingMsg] = useState(loadingMessages[0]);
  const panelRef = useRef<HTMLDivElement>(null);
  const loadingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadAnalyses = useAnalysisStore((s) => s.loadAnalyses);
  const analysesByEntryId = useAnalysisStore((s) => s.analysesByEntryId);
  const setActiveTab = useUIStore((s) => s.setActiveTab);

  const analyses = analysesByEntryId[entryId] || [];
  const latestAnalysis: Analysis | undefined = analyses[0];

  // Load analyses from DB when entry changes
  useEffect(() => {
    if (entryId) {
      loadAnalyses(entryId);
    }
  }, [entryId, loadAnalyses]);

  // Auto-trigger analysis if no existing analysis when panel opens
  const hasTriggered = useRef(false);
  useEffect(() => {
    if (entryId && !hasTriggered.current && analyses.length === 0 && !isStreaming && !error) {
      const timer = setTimeout(() => {
        const currentAnalyses = useAnalysisStore.getState().analysesByEntryId[entryId] || [];
        if (currentAnalyses.length === 0 && !hasTriggered.current) {
          hasTriggered.current = true;
          triggerAnalysis();
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [entryId, analyses.length]);

  // Rotate loading messages
  useEffect(() => {
    if (isStreaming && !streamingText) {
      let idx = 0;
      loadingIntervalRef.current = setInterval(() => {
        idx = (idx + 1) % loadingMessages.length;
        setLoadingMsg(loadingMessages[idx]);
      }, 2500);
      return () => {
        if (loadingIntervalRef.current) clearInterval(loadingIntervalRef.current);
      };
    } else if (loadingIntervalRef.current) {
      clearInterval(loadingIntervalRef.current);
    }
  }, [isStreaming, streamingText]);

  // Auto-scroll while streaming
  useEffect(() => {
    if (isStreaming && panelRef.current) {
      panelRef.current.scrollTop = panelRef.current.scrollHeight;
    }
  }, [streamingText, isStreaming]);

  const triggerAnalysis = async () => {
    const currentKey = useSettingsStore.getState().getApiKey();
    if (!currentKey) {
      setError('no-api-key');
      return;
    }

    setStreamingText('');
    setError(null);
    setIsStreaming(true);

    try {
      await analyseEntry(entryId, entryType, {
        onChunk: (chunk) => {
          setStreamingText((prev) => prev + chunk);
        },
        onComplete: () => {
          setIsStreaming(false);
          loadAnalyses(entryId);
        },
        onError: (err) => {
          setIsStreaming(false);
          setError(mapError(err.message));
        },
      });
    } catch {
      setIsStreaming(false);
    }
  };

  const handleRegenerate = () => {
    triggerAnalysis();
  };

  // Show nothing if no analysis exists and not streaming
  const hasContent = latestAnalysis || isStreaming || error;

  if (!hasContent) {
    return (
      <div className="analysis-empty-hint">
        Tap ✨ to receive your spiritual reflection
      </div>
    );
  }

  return (
    <div className="analysis-panel" ref={panelRef}>
      <div className="analysis-panel-header">
        <h3>Soul Mirror</h3>
        {latestAnalysis && !isStreaming && (
          <span className="analysis-date">
            {formatAnalysisDate(latestAnalysis.created_at)}
          </span>
        )}
      </div>

      {error && (
        <div className="analysis-error">
          {error === 'no-api-key' ? (
            <p>
              Your API key isn't set yet.{' '}
              <button className="link-btn" onClick={() => setActiveTab('settings')}>
                Visit Settings
              </button>{' '}
              to add it.
            </p>
          ) : (
            <p>{error}</p>
          )}
        </div>
      )}

      {isStreaming && !streamingText && (
        <div className="analysis-loading">
          <div className="analysis-loading-pulse" />
          <span>{loadingMsg}</span>
        </div>
      )}

      {(isStreaming && streamingText) ? (
        <div className="analysis-content">
          <Markdown>{streamingText}</Markdown>
        </div>
      ) : latestAnalysis && !error ? (
        <div className="analysis-content">
          <Markdown>{latestAnalysis.content}</Markdown>
        </div>
      ) : null}

      {!isStreaming && (latestAnalysis || error) && (
        <div className="analysis-actions">
          <button className="btn btn-regenerate" onClick={handleRegenerate}>
            {latestAnalysis ? '↻ Regenerate' : '✨ Try Again'}
          </button>
        </div>
      )}
    </div>
  );
};

function mapError(message: string): string {
  if (message.includes('API key') || message.includes('401') || message.includes('Unauthorized')) {
    return "Your API key doesn't seem right. Visit Settings to update it.";
  }
  if (message.includes('rate') || message.includes('429')) {
    return 'The stars need a moment to align. Try again shortly.';
  }
  if (message.includes('network') || message.includes('fetch') || message.includes('Failed')) {
    return 'The cosmic connection seems disrupted. Check your internet and try again.';
  }
  return message;
}

export default AnalysisPanel;
