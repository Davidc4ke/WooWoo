import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Markdown from 'react-markdown';
import { dailyEntryRepo, dreamEntryRepo } from '../db';
import { useAnalysisStore } from '../stores/useAnalysisStore';
import { useSettingsStore } from '../stores/useSettingsStore';
import { useUIStore } from '../stores/useUIStore';
import { analyseWeek } from '../ai/analysisService';
import { moodEmoji } from '../components/MoodSelector';
import type { DailyEntry, DreamEntry, Analysis, Mood } from '../../shared/types';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/* ── Date helpers ── */

function getMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function toISO(date: Date): string {
  return date.toISOString().split('T')[0];
}

function formatWeekRange(monday: Date): string {
  const sunday = addDays(monday, 6);
  const mMonth = monday.toLocaleDateString('en-US', { month: 'long' });
  const sMonth = sunday.toLocaleDateString('en-US', { month: 'long' });
  const mDay = monday.getDate();
  const sDay = sunday.getDate();
  const year = sunday.getFullYear();

  if (mMonth === sMonth) {
    return `${mMonth} ${mDay} – ${sDay}, ${year}`;
  }
  return `${mMonth} ${mDay} – ${sMonth} ${sDay}, ${year}`;
}

/* ── Loading messages ── */
const loadingMessages = [
  'Consulting the stars...',
  'Weaving your week together...',
  'Reading the cosmic patterns...',
  'Reflecting on your journey...',
  'Aligning the celestial bodies...',
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

/* ── Mood trend helper ── */
function getMoodTrend(moods: Mood[]): { emojis: string; direction: string } {
  if (moods.length === 0) return { emojis: '', direction: '' };

  const values: Record<Mood, number> = {
    stormy: 1,
    low: 2,
    neutral: 3,
    good: 4,
    radiant: 5,
  };

  const emojis = moods.map((m) => moodEmoji[m] || '😐').join(' ');

  if (moods.length < 2) return { emojis, direction: '' };

  const firstHalf = moods.slice(0, Math.ceil(moods.length / 2));
  const secondHalf = moods.slice(Math.ceil(moods.length / 2));
  const avgFirst = firstHalf.reduce((a, m) => a + values[m], 0) / firstHalf.length;
  const avgSecond = secondHalf.reduce((a, m) => a + values[m], 0) / secondHalf.length;

  if (avgSecond > avgFirst + 0.3) return { emojis, direction: 'Trending upward ↑' };
  if (avgSecond < avgFirst - 0.3) return { emojis, direction: 'Trending downward ↓' };
  return { emojis, direction: 'Steady ↔' };
}

/* ── Common tags helper ── */
function getCommonTags(dailyEntries: DailyEntry[], dreamEntries: DreamEntry[]): string[] {
  const counts = new Map<string, number>();
  for (const e of dailyEntries) {
    for (const tag of e.tags) {
      counts.set(tag, (counts.get(tag) || 0) + 1);
    }
  }
  for (const e of dreamEntries) {
    for (const tag of e.symbol_tags) {
      counts.set(tag, (counts.get(tag) || 0) + 1);
    }
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([tag]) => tag);
}

/* ── Main Page ── */
const SoulReviewPage: React.FC = () => {
  const [weekStart, setWeekStart] = useState<Date>(() => getMonday(new Date()));
  const [streamingText, setStreamingText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingMsg, setLoadingMsg] = useState(loadingMessages[0]);
  const panelRef = useRef<HTMLDivElement>(null);
  const loadingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadAnalyses = useAnalysisStore((s) => s.loadAnalyses);
  const analysesByEntryId = useAnalysisStore((s) => s.analysesByEntryId);
  const setActiveTab = useUIStore((s) => s.setActiveTab);

  const weekStartISO = toISO(weekStart);
  const weekEndISO = toISO(addDays(weekStart, 6));

  // Load entries for the selected week
  const dailyEntries = useMemo(
    () => dailyEntryRepo.getByDateRange(weekStartISO, weekEndISO),
    [weekStartISO, weekEndISO]
  );
  const dreamEntries = useMemo(
    () => dreamEntryRepo.getByDateRange(weekStartISO, weekEndISO),
    [weekStartISO, weekEndISO]
  );

  // Load any existing review analysis
  useEffect(() => {
    loadAnalyses(weekStartISO);
  }, [weekStartISO, loadAnalyses]);

  const analyses = analysesByEntryId[weekStartISO] || [];
  const latestAnalysis: Analysis | undefined = analyses.find(
    (a) => a.entry_type === 'weekly_review'
  );

  // Summary data
  const totalEntries = dailyEntries.length + dreamEntries.length;
  const moods = dailyEntries.map((e) => e.mood);
  const moodTrend = getMoodTrend(moods);
  const commonTags = getCommonTags(dailyEntries, dreamEntries);

  // Week navigation
  const goToPrevWeek = useCallback(() => {
    setWeekStart((prev) => addDays(prev, -7));
    setStreamingText('');
    setError(null);
  }, []);

  const goToNextWeek = useCallback(() => {
    setWeekStart((prev) => addDays(prev, 7));
    setStreamingText('');
    setError(null);
  }, []);

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

  const triggerReview = useCallback(async () => {
    const currentKey = useSettingsStore.getState().getApiKey();
    if (!currentKey) {
      setError('no-api-key');
      return;
    }

    setStreamingText('');
    setError(null);
    setIsStreaming(true);

    try {
      await analyseWeek(weekStartISO, {
        onChunk: (chunk) => {
          setStreamingText((prev) => prev + chunk);
        },
        onComplete: () => {
          setIsStreaming(false);
          loadAnalyses(weekStartISO);
        },
        onError: (err) => {
          setIsStreaming(false);
          setError(mapError(err.message));
        },
      });
    } catch {
      setIsStreaming(false);
    }
  }, [weekStartISO, loadAnalyses]);

  const hasEntries = totalEntries > 0;
  const showReviewContent = latestAnalysis || isStreaming || error;

  return (
    <div className="review-page" ref={panelRef}>
      <div className="review-inner">
        {/* Header with week navigation */}
        <div className="review-header">
          <h2>✦ Soul Review</h2>
          <div className="week-nav">
            <button className="week-nav-btn" onClick={goToPrevWeek} title="Previous week">
              <ChevronLeft size={18} />
            </button>
            <span className="week-range">{formatWeekRange(weekStart)}</span>
            <button className="week-nav-btn" onClick={goToNextWeek} title="Next week">
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        {/* Summary cards */}
        <div className="summary-cards">
          <div className="summary-card">
            <div className="summary-card-label">Journal Entries</div>
            <div className="summary-card-value">{totalEntries}</div>
            <div className="summary-card-sub">
              {dailyEntries.length} daily • {dreamEntries.length} dream{dreamEntries.length !== 1 ? 's' : ''}
            </div>
          </div>

          <div className="summary-card">
            <div className="summary-card-label">Mood Trend</div>
            {moods.length > 0 ? (
              <>
                <div className="mood-trend-emojis">{moodTrend.emojis}</div>
                <div className="summary-card-sub">{moodTrend.direction}</div>
              </>
            ) : (
              <div className="summary-card-sub">No daily entries this week</div>
            )}
          </div>

          <div className="summary-card">
            <div className="summary-card-label">Common Themes</div>
            {commonTags.length > 0 ? (
              <div className="common-tags">
                {commonTags.map((tag) => (
                  <span key={tag} className="tag-pill">{tag}</span>
                ))}
              </div>
            ) : (
              <div className="summary-card-sub">No tags this week</div>
            )}
          </div>
        </div>

        <div className="section-divider">✦</div>

        {/* Encouraging message if few entries */}
        {!hasEntries && (
          <div className="review-empty-message">
            <p>This week's pages are still blank — a fresh canvas awaits your reflections ✨</p>
            <p className="review-empty-hint">
              Start journaling in{' '}
              <button className="link-btn" onClick={() => setActiveTab('daily')}>
                Daily Journal
              </button>{' '}
              or{' '}
              <button className="link-btn" onClick={() => setActiveTab('dream')}>
                Dream Journal
              </button>
            </p>
          </div>
        )}

        {/* Generate button */}
        {hasEntries && (
          <button
            className={`generate-btn${isStreaming ? ' loading' : ''}`}
            onClick={triggerReview}
            disabled={isStreaming}
          >
            {isStreaming ? '✨ Generating...' : latestAnalysis ? '✨ Regenerate Soul Review' : '✨ Generate Soul Review'}
          </button>
        )}

        {/* Error display */}
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

        {/* Loading state */}
        {isStreaming && !streamingText && (
          <div className="analysis-loading">
            <div className="analysis-loading-pulse" />
            <span>{loadingMsg}</span>
          </div>
        )}

        {/* Streaming or saved review content */}
        {isStreaming && streamingText ? (
          <div className="review-analysis">
            <div className="analysis-content">
              <Markdown>{streamingText}</Markdown>
            </div>
          </div>
        ) : latestAnalysis && !error ? (
          <div className="review-analysis">
            <div className="review-analysis-header">
              <h3>☽ Weekly Reflection</h3>
              <span className="analysis-date">
                {formatAnalysisDate(latestAnalysis.created_at)}
              </span>
            </div>
            <div className="analysis-content">
              <Markdown>{latestAnalysis.content}</Markdown>
            </div>
            {!isStreaming && (
              <div className="analysis-actions">
                <button className="btn btn-regenerate" onClick={triggerReview}>
                  ↻ Regenerate
                </button>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default SoulReviewPage;
