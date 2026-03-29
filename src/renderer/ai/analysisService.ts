import { dailyEntryRepo, dreamEntryRepo } from '../db';
import { useAnalysisStore } from '../stores/useAnalysisStore';
import { useSettingsStore } from '../stores/useSettingsStore';
import { callClaude, ClaudeApiError } from './claudeClient';
import {
  buildDailyAnalysisPrompt,
  buildDreamAnalysisPrompt,
  buildWeeklyReviewPrompt,
} from './promptBuilder';
import type { EntryType } from '../../shared/types';

export interface AnalysisCallbacks {
  onChunk: (chunk: string) => void;
  onComplete: (fullText: string) => void;
  onError: (error: string) => void;
}

export async function analyseEntry(
  entryId: string,
  entryType: EntryType,
  callbacks: AnalysisCallbacks,
): Promise<void> {
  const store = useAnalysisStore.getState();
  const settingsStore = useSettingsStore.getState();
  const apiKey = settingsStore.getApiKey();

  if (!apiKey) {
    callbacks.onError('No API key configured. Visit Settings to add your Anthropic API key.');
    return;
  }

  store.setLoading(true);
  store.setError(null);

  try {
    let prompt: { system: string; messages: { role: 'user' | 'assistant'; content: string }[] };

    if (entryType === 'daily') {
      const entry = dailyEntryRepo.getById(entryId);
      if (!entry) {
        callbacks.onError('Entry not found.');
        return;
      }
      const recentEntries = dailyEntryRepo.getAll(1, 5).filter((e) => e.id !== entryId);
      prompt = buildDailyAnalysisPrompt(entry, settingsStore.settings, recentEntries);
    } else if (entryType === 'dream') {
      const entry = dreamEntryRepo.getById(entryId);
      if (!entry) {
        callbacks.onError('Entry not found.');
        return;
      }
      const recentDreams = dreamEntryRepo.getAll(1, 10);
      prompt = buildDreamAnalysisPrompt(entry, settingsStore.settings, recentDreams);
    } else {
      callbacks.onError('Invalid entry type for single analysis.');
      return;
    }

    const fullText = await callClaude({
      system: prompt.system,
      messages: prompt.messages,
      apiKey,
      onStream: callbacks.onChunk,
    });

    // Delete existing analyses for this entry and save the new one
    store.deleteAnalyses(entryId);
    store.saveAnalysis({
      entry_id: entryId,
      entry_type: entryType,
      content: fullText,
      frameworks_used: settingsStore.settings?.preferred_frameworks || [],
      astro_context: '',
    });

    callbacks.onComplete(fullText);
  } catch (error) {
    let message = 'The cosmic connection seems disrupted. Check your internet and try again.';
    if (error instanceof ClaudeApiError) {
      message = error.message;
    }
    store.setError(message);
    callbacks.onError(message);
  } finally {
    store.setLoading(false);
  }
}

export async function analyseWeek(
  endDate: string,
  callbacks: AnalysisCallbacks,
): Promise<void> {
  const store = useAnalysisStore.getState();
  const settingsStore = useSettingsStore.getState();
  const apiKey = settingsStore.getApiKey();

  if (!apiKey) {
    callbacks.onError('No API key configured. Visit Settings to add your Anthropic API key.');
    return;
  }

  store.setLoading(true);
  store.setError(null);

  try {
    // Calculate week range (Monday to Sunday)
    const end = new Date(endDate + 'T00:00:00');
    const dayOfWeek = end.getDay();
    const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const start = new Date(end);
    start.setDate(end.getDate() - mondayOffset);
    const sundayEnd = new Date(start);
    sundayEnd.setDate(start.getDate() + 6);

    const startDate = start.toISOString().split('T')[0];
    const endDateStr = sundayEnd.toISOString().split('T')[0];

    // Load all entries for the week
    const allDaily = dailyEntryRepo.getAll(1, 100);
    const dailyEntries = allDaily.filter((e) => e.date >= startDate && e.date <= endDateStr);

    const allDreams = dreamEntryRepo.getAll(1, 100);
    const dreamEntries = allDreams.filter((e) => e.date >= startDate && e.date <= endDateStr);

    const prompt = buildWeeklyReviewPrompt(
      dailyEntries,
      dreamEntries,
      settingsStore.settings,
      { start: startDate, end: endDateStr },
    );

    const fullText = await callClaude({
      system: prompt.system,
      messages: prompt.messages,
      apiKey,
      onStream: callbacks.onChunk,
    });

    // Use the week start date as the entry_id for weekly reviews
    const weekEntryId = `week-${startDate}`;
    store.deleteAnalyses(weekEntryId);
    store.saveAnalysis({
      entry_id: weekEntryId,
      entry_type: 'weekly_review',
      content: fullText,
      frameworks_used: settingsStore.settings?.preferred_frameworks || [],
      astro_context: '',
    });

    callbacks.onComplete(fullText);
  } catch (error) {
    let message = 'The cosmic connection seems disrupted. Check your internet and try again.';
    if (error instanceof ClaudeApiError) {
      message = error.message;
    }
    store.setError(message);
    callbacks.onError(message);
  } finally {
    store.setLoading(false);
  }
}
