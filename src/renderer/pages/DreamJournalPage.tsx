import React, { useState, useEffect, useCallback } from 'react';
import { useDreamStore } from '../stores';
import type { DreamEntry } from '../../shared/types';
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

/* ── Clarity Rating (moon icons) ── */
interface ClaritySelectorProps {
  value: number;
  onChange: (clarity: number) => void;
}

const ClaritySelector: React.FC<ClaritySelectorProps> = ({ value, onChange }) => {
  const [hovered, setHovered] = useState<number>(0);

  return (
    <div className="clarity-selector">
      <span className="clarity-label">Clarity:</span>
      {[1, 2, 3, 4, 5].map((level) => (
        <button
          key={level}
          type="button"
          className={`clarity-moon${level <= (hovered || value) ? ' active' : ''}`}
          onClick={() => onChange(level)}
          onMouseEnter={() => setHovered(level)}
          onMouseLeave={() => setHovered(0)}
        >
          ☾
        </button>
      ))}
    </div>
  );
};

/* ── Toggle Switch ── */
interface ToggleSwitchProps {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ label, value, onChange }) => {
  return (
    <div className="toggle-item">
      <label onClick={() => onChange(!value)}>{label}</label>
      <div
        className={`toggle-switch${value ? ' on' : ''}`}
        onClick={() => onChange(!value)}
      />
    </div>
  );
};

/* ── Dream Entry Card ── */
interface DreamEntryCardProps {
  entry: DreamEntry;
  isActive: boolean;
  onClick: () => void;
}

const DreamEntryCard: React.FC<DreamEntryCardProps> = ({ entry, isActive, onClick }) => {
  const preview = entry.body?.slice(0, 100) || '';
  const clarityMoons = Array.from({ length: 5 }, (_, i) =>
    i < entry.clarity ? '☾' : '☽'
  ).join('');

  return (
    <div className={`entry-card${isActive ? ' active' : ''}`} onClick={onClick}>
      <div className="entry-card-date">{formatDate(entry.date)}</div>
      <div className="entry-card-title">
        {entry.title || 'Untitled Dream'}
      </div>
      {preview && <div className="entry-card-preview">{preview}</div>}
      <div className="entry-card-clarity">{clarityMoons}</div>
      {(entry.symbol_tags.length > 0 || entry.is_lucid || entry.is_recurring) && (
        <div className="entry-card-tags">
          {entry.symbol_tags.map((tag) => (
            <span key={tag} className="tag-pill">
              {tag}
            </span>
          ))}
          {entry.is_lucid && <span className="entry-card-badge">LUCID</span>}
          {entry.is_recurring && <span className="entry-card-badge">RECURRING</span>}
        </div>
      )}
    </div>
  );
};

/* ── Dream Editor State ── */
interface DreamEditorState {
  date: string;
  title: string;
  body: string;
  clarity: number;
  is_lucid: boolean;
  is_recurring: boolean;
  symbol_tags: string[];
}

const emptyEditor: DreamEditorState = {
  date: todayISO(),
  title: '',
  body: '',
  clarity: 3,
  is_lucid: false,
  is_recurring: false,
  symbol_tags: [],
};

function entryToEditor(entry: DreamEntry): DreamEditorState {
  return {
    date: entry.date,
    title: entry.title,
    body: entry.body,
    clarity: entry.clarity,
    is_lucid: entry.is_lucid,
    is_recurring: entry.is_recurring,
    symbol_tags: [...entry.symbol_tags],
  };
}

/* ── Main Page ── */
const DreamJournalPage: React.FC = () => {
  const entries = useDreamStore((s) => s.entries);
  const selectedEntry = useDreamStore((s) => s.selectedEntry);
  const selectEntry = useDreamStore((s) => s.selectEntry);
  const createEntry = useDreamStore((s) => s.createEntry);
  const updateEntry = useDreamStore((s) => s.updateEntry);
  const deleteEntry = useDreamStore((s) => s.deleteEntry);
  const searchStore = useDreamStore((s) => s.search);
  const searchQuery = useDreamStore((s) => s.searchQuery);

  const [editor, setEditor] = useState<DreamEditorState>(emptyEditor);
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
        clarity: editor.clarity,
        is_lucid: editor.is_lucid,
        is_recurring: editor.is_recurring,
        symbol_tags: editor.symbol_tags,
      });
      setIsNew(false);
      selectEntry(entry);
    } else if (selectedEntry) {
      updateEntry(selectedEntry.id, {
        date: editor.date,
        title: editor.title,
        body: editor.body,
        clarity: editor.clarity,
        is_lucid: editor.is_lucid,
        is_recurring: editor.is_recurring,
        symbol_tags: editor.symbol_tags,
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
    (entry: DreamEntry) => {
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
          <h2>☽ Dream Journal</h2>
          <button className="new-entry-btn" onClick={handleNew}>
            <Sparkles size={14} /> New Dream
          </button>
          <div className="search-wrapper">
            <Search size={14} className="search-icon" />
            <input
              type="text"
              className="search-box"
              placeholder="Search your dreams..."
              value={localSearch}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>
        </div>
        <div className="entry-list-items">
          {entries.length === 0 && (
            <div className="entry-list-empty">
              {searchQuery
                ? 'No dreams found'
                : 'When you wake, your dreams will find their home here... 🌙'}
            </div>
          )}
          {entries.map((entry) => (
            <DreamEntryCard
              key={entry.id}
              entry={entry}
              isActive={selectedEntry?.id === entry.id}
              onClick={() => handleSelect(entry)}
            />
          ))}
        </div>
      </div>

      {/* RIGHT PANEL — dream editor */}
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
              placeholder="Name this dream..."
              value={editor.title}
              onChange={(e) => setEditor((s) => ({ ...s, title: e.target.value }))}
            />

            <ClaritySelector
              value={editor.clarity}
              onChange={(clarity) => setEditor((s) => ({ ...s, clarity }))}
            />

            <div className="toggle-row">
              <ToggleSwitch
                label="Lucid dream"
                value={editor.is_lucid}
                onChange={(is_lucid) => setEditor((s) => ({ ...s, is_lucid }))}
              />
              <ToggleSwitch
                label="Recurring"
                value={editor.is_recurring}
                onChange={(is_recurring) => setEditor((s) => ({ ...s, is_recurring }))}
              />
            </div>

            <div className="editor-divider">☾ ✦ ☾</div>

            <textarea
              className="editor-body"
              placeholder="Describe your dream..."
              value={editor.body}
              onChange={(e) => setEditor((s) => ({ ...s, body: e.target.value }))}
            />

            <TagInput
              tags={editor.symbol_tags}
              onChange={(symbol_tags) => setEditor((s) => ({ ...s, symbol_tags }))}
              placeholder="add symbol..."
              label="Dream Symbols"
              variant="lavender"
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
                      <span>Delete this dream?</span>
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
            <div className="editor-empty-icon">🌙</div>
            <p>Select a dream or record a new one</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DreamJournalPage;
