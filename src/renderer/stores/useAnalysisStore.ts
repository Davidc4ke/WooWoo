import { create } from 'zustand';
import { analysisRepo } from '../db';
import type { Analysis, EntryType } from '../../shared/types';

interface AnalysisStore {
  analysesByEntryId: Record<string, Analysis[]>;
  loading: boolean;
  error: string | null;
  loadAnalyses: (entryId: string) => void;
  saveAnalysis: (analysis: Omit<Analysis, 'id' | 'created_at'>) => Analysis;
  deleteAnalyses: (entryId: string) => void;
  getAnalysesForEntry: (entryId: string) => Analysis[];
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useAnalysisStore = create<AnalysisStore>((set, get) => ({
  analysesByEntryId: {},
  loading: false,
  error: null,

  loadAnalyses(entryId) {
    const analyses = analysisRepo.getByEntryId(entryId);
    set((state) => ({
      analysesByEntryId: {
        ...state.analysesByEntryId,
        [entryId]: analyses,
      },
    }));
  },

  saveAnalysis(data) {
    const analysis = analysisRepo.create(data);
    get().loadAnalyses(analysis.entry_id);
    return analysis;
  },

  deleteAnalyses(entryId) {
    analysisRepo.deleteByEntryId(entryId);
    set((state) => {
      const updated = { ...state.analysesByEntryId };
      delete updated[entryId];
      return { analysesByEntryId: updated };
    });
  },

  getAnalysesForEntry(entryId) {
    return get().analysesByEntryId[entryId] || [];
  },

  setLoading(loading) {
    set({ loading });
  },

  setError(error) {
    set({ error });
  },
}));
