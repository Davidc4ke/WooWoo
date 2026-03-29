import { callClaude } from './claudeClient';
import { buildDailyAnalysisPrompt, buildDreamAnalysisPrompt, buildWeeklyReviewPrompt } from './promptBuilder';
import { dailyEntryRepo, dreamEntryRepo, analysisRepo } from '../db';
import { useSettingsStore } from '../stores/useSettingsStore';
import { useAnalysisStore } from '../stores/useAnalysisStore';
import type { EntryType, SpiritualFramework } from '../../shared/types';

export interface AnalysisCallbacks {
  onChunk: (chunk: string) => void;
  onComplete?: (fullText: string) => void;
  onError?: (error: Error) => void;
}

function getApiKey(): string {
  return useSettingsStore.getState().getApiKey();
}

function getSettings() {
  return useSettingsStore.getState().settings;
}

export async function analyseEntry(
  entryId: string,
  entryType: EntryType,
  callbacks: AnalysisCallbacks
): Promise<string> {
  const apiKey = getApiKey();
  if (!apiKey) {
    const error = new Error('No API key configured. Please add your Anthropic API key in Settings.');
    callbacks.onError?.(error);
    throw error;
  }

  const settings = getSettings();
  const analysisStore = useAnalysisStore.getState();
  analysisStore.setLoading(true);
  analysisStore.setError(null);

  try {
    let system: string;
    let messages: { role: 'user' | 'assistant'; content: string }[];

    if (entryType === 'daily') {
      const entry = dailyEntryRepo.getById(entryId);
      if (!entry) throw new Error('Daily entry not found.');

      // Get recent entries for context (past 7 days, excluding this one)
      const endDate = entry.date;
      const startDate = new Date(new Date(entry.date + 'T12:00:00').getTime() - 7 * 24 * 60 * 60 * 1000)
        .toISOString().split('T')[0];
      const recentEntries = dailyEntryRepo.getByDateRange(startDate, endDate)
        .filter(e => e.id !== entryId);

      const prompt = buildDailyAnalysisPrompt(entry, settings, recentEntries);
      system = prompt.system;
      messages = prompt.messages;
    } else if (entryType === 'dream') {
      const entry = dreamEntryRepo.getById(entryId);
      if (!entry) throw new Error('Dream entry not found.');

      // Get recent dreams with matching symbol tags
      let recentDreams = dreamEntryRepo.getAll(1, 20)
        .filter(d => d.id !== entryId);

      // Prioritize dreams with shared symbols
      if (entry.symbol_tags.length > 0) {
        const withSharedSymbols = recentDreams.filter(d =>
          d.symbol_tags.some(tag => entry.symbol_tags.includes(tag))
        );
        const others = recentDreams.filter(d =>
          !d.symbol_tags.some(tag => entry.symbol_tags.includes(tag))
        );
        recentDreams = [...withSharedSymbols, ...others];
      }

      const prompt = buildDreamAnalysisPrompt(entry, settings, recentDreams.slice(0, 5));
      system = prompt.system;
      messages = prompt.messages;
    } else {
      throw new Error(`Unsupported entry type: ${entryType}`);
    }

    const fullText = await callClaude({
      system,
      messages,
      apiKey,
      onChunk: callbacks.onChunk,
      onComplete: callbacks.onComplete,
      onError: (error) => {
        analysisStore.setLoading(false);
        analysisStore.setError(error.message);
        callbacks.onError?.(error);
      },
    });

    // Save the analysis
    const frameworks = settings?.preferred_frameworks || ['astrology', 'numerology', 'tarot', 'chakra', 'general'];
    analysisStore.saveAnalysis({
      entry_id: entryId,
      entry_type: entryType,
      content: fullText,
      frameworks_used: frameworks as SpiritualFramework[],
      astro_context: '',
    });

    analysisStore.setLoading(false);
    return fullText;
  } catch (error) {
    analysisStore.setLoading(false);
    const message = error instanceof Error ? error.message : 'An unexpected error occurred.';
    analysisStore.setError(message);
    throw error;
  }
}

export async function analyseWeek(
  weekStartDate: string,
  callbacks: AnalysisCallbacks
): Promise<string> {
  const apiKey = getApiKey();
  if (!apiKey) {
    const error = new Error('No API key configured. Please add your Anthropic API key in Settings.');
    callbacks.onError?.(error);
    throw error;
  }

  const settings = getSettings();
  const analysisStore = useAnalysisStore.getState();
  analysisStore.setLoading(true);
  analysisStore.setError(null);

  try {
    // Calculate week end (6 days after start = Sunday)
    const startDate = new Date(weekStartDate + 'T12:00:00');
    const endDate = new Date(startDate.getTime() + 6 * 24 * 60 * 60 * 1000);
    const weekEnd = endDate.toISOString().split('T')[0];

    const dailyEntries = dailyEntryRepo.getByDateRange(weekStartDate, weekEnd);
    const dreamEntries = dreamEntryRepo.getByDateRange(weekStartDate, weekEnd);

    const prompt = buildWeeklyReviewPrompt(dailyEntries, dreamEntries, settings, weekStartDate, weekEnd);

    const fullText = await callClaude({
      system: prompt.system,
      messages: prompt.messages,
      apiKey,
      onChunk: callbacks.onChunk,
      onComplete: callbacks.onComplete,
      onError: (error) => {
        analysisStore.setLoading(false);
        analysisStore.setError(error.message);
        callbacks.onError?.(error);
      },
    });

    // Save as weekly review analysis (entry_id = week start date)
    const frameworks = settings?.preferred_frameworks || ['astrology', 'numerology', 'tarot', 'chakra', 'general'];
    analysisStore.saveAnalysis({
      entry_id: weekStartDate,
      entry_type: 'weekly_review',
      content: fullText,
      frameworks_used: frameworks as SpiritualFramework[],
      astro_context: '',
    });

    analysisStore.setLoading(false);
    return fullText;
  } catch (error) {
    analysisStore.setLoading(false);
    const message = error instanceof Error ? error.message : 'An unexpected error occurred.';
    analysisStore.setError(message);
    throw error;
  }
}
