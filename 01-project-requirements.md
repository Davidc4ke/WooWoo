# Soul Journal — Project Requirements Document

## 1. Project Overview

**Soul Journal** is a local-first desktop/web application for daily journaling and dream journaling, enhanced with AI-powered spiritual analysis. The app draws on astrology, tarot symbolism, numerology, and other spiritual frameworks to provide reflective insights based on the user's entries.

The app should feel like opening a calm, sacred personal space — cute, spiritual, simple, and never overwhelming.

---

## 2. Functional Requirements

### 2.1 Daily Journal

- **Create entries**: Write a daily journal entry with a title (optional) and body (rich text — bold, italic, lists).
- **Date association**: Each entry is tied to a date. One entry per day by default; user can edit the same day's entry.
- **Mood selector**: Simple mood picker (e.g., 5 cute icons: radiant, good, neutral, low, stormy).
- **Tags**: User can add freeform tags (e.g., "work", "love", "health", "growth").
- **Entry list/calendar view**: Browse past entries via a scrollable list or a simple calendar grid.
- **Search**: Full-text search across all daily entries.
- **Edit & delete**: Edit or delete any past entry with a soft confirmation prompt.

### 2.2 Dream Journal

- **Create dream entries**: Write a dream entry with title (optional), body, and date.
- **Dream clarity rating**: Simple 1–5 scale (e.g., "foggy" to "vivid").
- **Lucid dream toggle**: Mark whether the dream was lucid.
- **Recurring dream flag**: Mark if this dream is recurring.
- **Symbol tags**: Tag dream symbols (e.g., "water", "flying", "teeth", "snake").
- **Entry list view**: Browse past dream entries chronologically.
- **Search**: Full-text search across all dream entries.

### 2.3 AI Spiritual Analysis

- **Analyse daily entry**: User clicks an "Analyse" button on any daily entry. The AI reads the entry and returns a spiritual reflection incorporating:
  - Astrological context (current transits, moon phase for that date)
  - Numerological meaning (date numerology, life path if user has provided birth date)
  - Tarot card associations (symbolic, not a "reading")
  - Chakra or energy body associations
  - General spiritual/reflective commentary
- **Analyse dream entry**: User clicks "Analyse" on a dream entry. The AI interprets dream symbols using:
  - Spiritual/Jungian dream symbolism
  - Astrological associations
  - Recurring pattern detection (references prior dreams if available)
  - Elemental and archetypal analysis
- **Combined analysis**: User can request a "Weekly Soul Review" that cross-references daily journal entries and dream entries from the past 7 days, looking for patterns, synchronicities, and spiritual themes.
- **Analysis history**: Each analysis is saved alongside the entry it was generated for. User can regenerate.
- **Web search**: The AI uses web search to pull in current astrological transit data (moon phase, planetary positions, retrogrades) for the entry's date.

### 2.4 User Profile & Settings

- **Birth date & time** (optional): Used for natal chart context in analyses.
- **Birth location** (optional): For accurate natal chart data.
- **Preferred spiritual frameworks**: User can toggle which frameworks the AI uses (astrology, numerology, tarot, chakras, general spiritual). All on by default.
- **API key management**: User provides their own Anthropic API key (stored locally).
- **Theme toggle**: Light / dark mode.
- **Data export**: Export all entries as JSON or Markdown.
- **Data import**: Import previously exported data.

---

## 3. Non-Functional / Technical Requirements

### 3.1 Architecture

- **Local-first**: All data stored locally on the user's machine. No backend server, no cloud database.
- **Stack**: Electron (or Tauri) + React + TypeScript.
- **Storage**: SQLite via `better-sqlite3` (Electron) or `sql.js` for local persistence. Alternatively, a simple JSON file store if SQLite adds too much complexity.
- **AI integration**: Anthropic Claude API called directly from the app (user provides their own API key). Use the `claude-sonnet-4-20250514` model for analysis.
- **Web search for astrology data**: The AI analysis prompt instructs Claude to use its web search tool (or the app pre-fetches moon phase/transit data from a free API like `farmsense.net/api/astro` or similar, and injects it into the prompt).

### 3.2 Data Model

```
User
  - id: string (single user, local)
  - birth_date: string | null
  - birth_time: string | null
  - birth_location: string | null
  - preferred_frameworks: string[] (e.g., ["astrology", "numerology", "tarot", "chakra"])
  - api_key: string (encrypted at rest)
  - created_at: datetime

DailyEntry
  - id: string (uuid)
  - date: string (YYYY-MM-DD, unique)
  - title: string | null
  - body: string (rich text stored as HTML or Markdown)
  - mood: enum (radiant | good | neutral | low | stormy)
  - tags: string[]
  - created_at: datetime
  - updated_at: datetime

DreamEntry
  - id: string (uuid)
  - date: string (YYYY-MM-DD)
  - title: string | null
  - body: string
  - clarity: int (1-5)
  - is_lucid: boolean
  - is_recurring: boolean
  - symbol_tags: string[]
  - created_at: datetime
  - updated_at: datetime

Analysis
  - id: string (uuid)
  - entry_id: string (FK to DailyEntry or DreamEntry)
  - entry_type: enum (daily | dream | weekly_review)
  - content: string (Markdown)
  - frameworks_used: string[]
  - astro_context: string | null (raw transit data used)
  - created_at: datetime
```

### 3.3 AI Prompt Architecture

- **System prompt**: A carefully crafted system prompt that establishes the AI as a gentle, wise spiritual guide. It should:
  - Be warm but not preachy
  - Reference specific spiritual frameworks based on user preferences
  - Use the entry date for astrological context
  - Reference the user's natal data if available
  - For dream analysis, reference prior dream entries if recurring symbols are detected
- **Context injection**: Before calling the API, the app assembles context:
  - The entry being analysed
  - User's birth data (if available)
  - Current astrological transit data for the entry's date (pre-fetched or instructed via web search tool)
  - For weekly reviews: all entries from the past 7 days
  - For dream analysis: recent dream entries with matching symbol tags
- **Streaming**: Use streaming responses so the analysis appears progressively.

### 3.4 UI / UX Design Direction

**Aesthetic**: Soft, spiritual, cute — like a cozy metaphysical bookshop meets a pastel studio.

- **Typography**: Use a gentle serif for headings (e.g., `Cormorant Garamond` or `Playfair Display`) paired with a clean rounded body font (e.g., `Quicksand`, `Nunito`, or `Karla`).
- **Color palette**:
  - Light mode: Warm cream/ivory background (`#FFF8F0`), soft lavender accents (`#C4B1D4`), muted sage (`#A8C5A0`), dusty rose (`#D4A0A0`), warm gold for highlights (`#D4A96A`).
  - Dark mode: Deep indigo/navy (`#1A1A2E`), soft purple (`#6B5B7B`), muted teal (`#5B8A8A`), warm amber accents (`#D4A96A`).
- **Decorative elements**: Subtle, never overwhelming.
  - Small moon phase icons in the header or entry cards.
  - Gentle star/sparkle accents (CSS-only, no heavy assets).
  - Soft rounded corners everywhere (12–16px border-radius).
  - Thin decorative dividers with small celestial symbols.
- **Layout**: Single-column centered content (max-width ~720px). Generous whitespace. No dense dashboards.
- **Animations**: Subtle fade-ins on page transitions. Gentle hover glows on buttons. No aggressive motion.
- **Icons**: Use a cute, rounded icon set (e.g., Lucide with custom spiritual additions via SVG — moons, stars, crystals, third eye).
- **Empty states**: Warm, encouraging messages with small illustrations ("Your dream journal awaits... ✨").

### 3.5 Navigation Structure

```
Sidebar (slim, collapsible):
  - 🌞 Daily Journal
  - 🌙 Dream Journal
  - 🔮 Soul Review (weekly analysis)
  - ⚙️ Settings

Main content area:
  - Entry list (left panel or top) → Entry detail/editor (main)
```

### 3.6 Security & Privacy

- All data stays local. No telemetry, no analytics.
- API key stored encrypted using Electron's `safeStorage` API.
- No data leaves the machine except API calls to Anthropic (with user's own key).

### 3.7 Performance

- App should launch in under 2 seconds.
- Journal entries should save instantly (local write).
- AI analysis calls should stream to reduce perceived latency.

### 3.8 Platform

- Primary: Desktop (macOS, Windows, Linux) via Electron or Tauri.
- Stretch: Web-only version (PWA) using IndexedDB instead of SQLite if Electron is too heavy.

---

## 4. Out of Scope (V1)

- Multi-user / accounts
- Cloud sync
- Mobile native apps
- Natal chart generation/visualization (may reference external tools)
- Voice journaling
- Image/media attachments in entries
- Community or sharing features

---

## 5. Success Criteria

- User can write and browse daily journal entries and dream entries smoothly.
- AI analysis returns thoughtful, spiritually-informed reflections within 10 seconds.
- The app feels calm, personal, and beautiful — not like enterprise software.
- All data remains fully local and exportable.
