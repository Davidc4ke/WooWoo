import React, { useState, useEffect, useCallback } from 'react';
import { useDailyStore } from '../stores';
import type { DailyEntry, Mood } from '../../shared/types';
import MoodSelector, { moodEmoji } from '../components/MoodSelector';
import TagInput from '../components/TagInput';
import { Search, Sparkles } from 'lucide-react';

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function todayISO(): string {
  return new Date().toISOString().split('T')[0];
}

/* ── Entry Card ── */
interface EntryCardProps {
  entry: DailyEntry;
  isActive: boolean;
  onClick: () => void;
}

const EntryCard: React.FC<EntryCardProps> = ({ entry, isActive, onClick }) => {
  const preview = entry.body?.slice(0, 100) || '';
  return (
    <div className={`entry-card${isActive ? ' active' : ''}`} onClick={onClick}>
      <div className="entry-card-date">{formatDate(entry.date)}</div>
      <div className="entry-card-title">
        <span className="mood">{moodEmoji[entry.mood] || '😐'}</span>
        {entry.title || 'Untitled'}
      </div>
      {preview && <div className="entry-card-preview">{preview}</div>}
      {entry.tags.length > 0 && (
        <div className="entry-card-tags">
          {entry.tags.map((tag) => (
            <span key={tag} className="tag-pill">
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

/* ── Entry Editor ── */
interface EditorState {
  date: string;
  title: string;
  body: string;
  mood: Mood;
  tags: string[];
}

const emptyEditor: EditorState = {
  date: todayISO(),
  title: '',
  body: '',
  mood: 'neutral',
  tags: [],
};

function entryToEditor(entry: DailyEntry): EditorState {
  return {
    date: entry.date,
    title: entry.title,
    body: entry.body,
    mood: entry.mood,
    tags: [...entry.tags],
  };
}

/* ── Main Page ── */
const DailyJournalPage: React.FC = () => {
  const entries = useDailyStore((s) => s.entries);
  const selectedEntry = useDailyStore((s) => s.selectedEntry);
  const selectEntry = useDailyStore((s) => s.selectEntry);
  const createEntry = useDailyStore((s) => s.createEntry);
  const updateEntry = useDailyStore((s) => s.updateEntry);
  const deleteEntry = useDailyStore((s) => s.deleteEntry);
  const searchStore = useDailyStore((s) => s.search);
  const searchQuery = useDailyStore((s) => s.searchQuery);

  const [editor, setEditor] = useState<EditorState>(emptyEditor);
  const [isNew, setIsNew] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [localSearch, setLocalSearch] = useState(searchQuery);

  // Sync editor when selection changes
  useEffect(() => {
    if (selectedEntry) {
      setEditor(entryToEditor(selectedEntry));
      setIsNew(false);
    }
  }, [selectedEntry]);

  const handleNew = useCallback(() => {
    selectEntry(null);
    setEditor({ ...emptyEditor, date: todayISO() });
    setIsNew(true);
    setShowDelete(false);
  }, [selectEntry]);

  const handleSave = useCallback(() => {
    if (isNew) {
      const entry = createEntry({
        date: editor.date,
        title: editor.title,
        body: editor.body,
        mood: editor.mood,
        tags: editor.tags,
      });
      setIsNew(false);
      selectEntry(entry);
    } else if (selectedEntry) {
      updateEntry(selectedEntry.id, {
        date: editor.date,
        title: editor.title,
        body: editor.body,
        mood: editor.mood,
        tags: editor.tags,
      });
    }
  }, [isNew, editor, selectedEntry, createEntry, updateEntry, selectEntry]);

  const handleDelete = useCallback(() => {
    if (selectedEntry) {
      deleteEntry(selectedEntry.id);
      setEditor(emptyEditor);
      setIsNew(false);
      setShowDelete(false);
    }
  }, [selectedEntry, deleteEntry]);

  const handleSearch = useCallback(
    (value: string) => {
      setLocalSearch(value);
      searchStore(value);
    },
    [searchStore]
  );

  const handleSelect = useCallback(
    (entry: DailyEntry) => {
      selectEntry(entry);
      setIsNew(false);
      setShowDelete(false);
    },
    [selectEntry]
  );

  const showEditor = isNew || selectedEntry !== null;

  return (
    <div className="journal-page">
      {/* LEFT PANEL — entry list */}
      <div className="entry-list">
        <div className="entry-list-header">
          <h2>Daily Journal</h2>
          <button className="new-entry-btn" onClick={handleNew}>
            <Sparkles size={14} /> New Entry
          </button>
          <div className="search-wrapper">
            <Search size={14} className="search-icon" />
            <input
              type="text"
              className="search-box"
              placeholder="Search your thoughts..."
              value={localSearch}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>
        </div>
        <div className="entry-list-items">
          {entries.length === 0 && (
            <div className="entry-list-empty">
              {searchQuery ? 'No entries found' : 'Your journal awaits your first thoughts... 🌱'}
            </div>
          )}
          {entries.map((entry) => (
            <EntryCard
              key={entry.id}
              entry={entry}
              isActive={selectedEntry?.id === entry.id}
              onClick={() => handleSelect(entry)}
            />
          ))}
        </div>
      </div>

      {/* RIGHT PANEL — entry editor */}
      <div className="entry-editor">
        {showEditor ? (
          <div className="editor-inner">
            <input
              type="date"
              className="editor-date-input"
              value={editor.date}
              onChange={(e) => setEditor((s) => ({ ...s, date: e.target.value }))}
            />
            <input
              type="text"
              className="editor-title-input"
              placeholder="Give this entry a title..."
              value={editor.title}
              onChange={(e) => setEditor((s) => ({ ...s, title: e.target.value }))}
            />

            <MoodSelector
              value={editor.mood}
              onChange={(mood) => setEditor((s) => ({ ...s, mood }))}
            />

            <div className="editor-divider">✦ ✦ ✦</div>

            <textarea
              className="editor-body"
              placeholder="What's on your mind today?"
              value={editor.body}
              onChange={(e) => setEditor((s) => ({ ...s, body: e.target.value }))}
            />

            <TagInput
              tags={editor.tags}
              onChange={(tags) => setEditor((s) => ({ ...s, tags }))}
              placeholder="Add tag..."
              label="Tags"
            />

            <div className="editor-actions">
              <button className="btn btn-save" onClick={handleSave}>
                Save
              </button>
              <button className="btn btn-analyse" onClick={() => {}}>
                ✨ Analyse
              </button>
              {!isNew && selectedEntry && (
                <>
                  {showDelete ? (
                    <div className="delete-confirm">
                      <span>Delete this entry?</span>
                      <button className="btn btn-delete-yes" onClick={handleDelete}>
                        Yes
                      </button>
                      <button
                        className="btn btn-delete-no"
                        onClick={() => setShowDelete(false)}
                      >
                        No
                      </button>
                    </div>
                  ) : (
                    <button
                      className="btn btn-delete"
                      onClick={() => setShowDelete(true)}
                    >
                      Delete
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="editor-empty">
            <div className="editor-empty-icon">🌞</div>
            <p>Select an entry or create a new one</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DailyJournalPage;
