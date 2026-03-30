# Soul Journal — Claude Code Build Prompts

Feed these prompts to Claude Code sequentially. Each prompt builds on the previous one. Wait for completion and verify before moving to the next.

---

## Prompt 0 — Project Setup ✅ COMPLETED

```
Read the file 01-project-requirements.md in the project root. This is the full requirements doc for the app we're building. Keep it as reference for all future prompts.

Initialize a new Electron + React + TypeScript project called "soul-journal" using Vite as the bundler. Set up the following:
- Electron main process with a single BrowserWindow
- React 18 with TypeScript in the renderer
- Tailwind CSS 4
- better-sqlite3 for local storage
- File structure:
  src/
    main/          (Electron main process)
    renderer/      (React app)
      components/
      pages/
      hooks/
      stores/
      db/
      ai/
      styles/
      types/
    shared/        (shared types between main/renderer)

Install all dependencies. Make sure the app launches with a blank window showing "Soul Journal" when you run `npm run dev`.
```

---

## Prompt 1 — Database Layer ✅ COMPLETED

```
Create the SQLite database layer in src/renderer/db/. Implement:

1. Database initialization (create tables if not exist):
   - daily_entries (id TEXT PK, date TEXT UNIQUE, title TEXT, body TEXT, mood TEXT, tags TEXT as JSON, created_at TEXT, updated_at TEXT)
   - dream_entries (id TEXT PK, date TEXT, title TEXT, body TEXT, clarity INTEGER, is_lucid INTEGER, is_recurring INTEGER, symbol_tags TEXT as JSON, created_at TEXT, updated_at TEXT)
   - analyses (id TEXT PK, entry_id TEXT, entry_type TEXT, content TEXT, frameworks_used TEXT as JSON, astro_context TEXT, created_at TEXT)
   - user_settings (id TEXT PK DEFAULT 'default', birth_date TEXT, birth_time TEXT, birth_location TEXT, preferred_frameworks TEXT as JSON, api_key_encrypted TEXT, created_at TEXT, updated_at TEXT)

2. Repository modules with full CRUD:
   - dailyEntryRepo.ts — create, update, delete, getByDate, getAll (paginated, newest first), search(query)
   - dreamEntryRepo.ts — create, update, delete, getByDate, getAll (paginated, newest first), search(query), getBySymbolTag(tag)
   - analysisRepo.ts — create, getByEntryId, deleteByEntryId
   - settingsRepo.ts — get, update (upsert)

3. Use uuid for IDs. Dates stored as ISO strings.

Write a simple test that creates a daily entry, retrieves it, and deletes it — run it to verify the DB works.
```

---

## Prompt 2 — State Management & Types ✅ COMPLETED

```
Set up Zustand stores and TypeScript types:

1. src/shared/types.ts — Define all TypeScript interfaces:
   - DailyEntry, DreamEntry, Analysis, UserSettings
   - Mood enum: 'radiant' | 'good' | 'neutral' | 'low' | 'stormy'
   - EntryType: 'daily' | 'dream' | 'weekly_review'
   - SpiritualFramework: 'astrology' | 'numerology' | 'tarot' | 'chakra' | 'general'

2. Zustand stores (src/renderer/stores/):
   - useDailyStore — entries[], selectedEntry, CRUD actions, search
   - useDreamStore — entries[], selectedEntry, CRUD actions, search
   - useAnalysisStore — analyses map by entry_id, loading state, generate action
   - useSettingsStore — settings, updateSettings, apiKey management
   - useUIStore — activeTab ('daily' | 'dream' | 'review' | 'settings'), sidebarCollapsed, theme ('light' | 'dark')

Each store should sync with the SQLite repos on mutations. Load initial data on app startup.
```

---

## Prompt 3 — App Shell & Navigation ✅ COMPLETED

```
Build the app shell with sidebar navigation and main content area. Refer to the requirements doc for the design direction:

Aesthetic: Soft, spiritual, cute. Pastel colors, gentle serif headings, rounded body font.

1. Import Google Fonts: Cormorant Garamond (headings) and Quicksand (body).

2. Set up CSS variables in a global stylesheet for the full color palette:
   - Light mode: cream background #FFF8F0, lavender #C4B1D4, sage #A8C5A0, dusty rose #D4A0A0, warm gold #D4A96A
   - Dark mode: deep indigo #1A1A2E, soft purple #6B5B7B, muted teal #5B8A8A, warm amber #D4A96A
   - Implement theme toggle using the useUIStore.

3. Build the layout:
   - Slim sidebar (60px collapsed, 200px expanded) with icon + label navigation:
     🌞 Daily Journal, 🌙 Dream Journal, 🔮 Soul Review, ⚙️ Settings
   - Main content area: centered, max-width 720px, generous padding
   - Subtle CSS-only star/sparkle decorations in the background (very subtle, not distracting)
   - Soft rounded corners (12-16px) on all cards and containers

4. Add smooth fade-in transitions when switching tabs.

The app should look beautiful and feel calming even with placeholder content. Use actual emoji or simple SVG icons for nav items — keep it cute, not corporate.
```

---

## Prompt 4 — Daily Journal Page ✅ COMPLETED

```
Build the Daily Journal page with two panels:

LEFT PANEL (entry list):
- Scrollable list of past daily entries, newest first
- Each card shows: date (formatted nicely, e.g. "March 29, 2026"), mood emoji, title or first line preview, tags as small pills
- Selected entry is highlighted with a soft lavender/sage glow
- "New Entry" button at top with a sparkle icon
- Search bar at top with a gentle placeholder "Search your thoughts..."

RIGHT PANEL (entry editor):
- Date picker (defaults to today)
- Optional title field
- Mood selector: 5 cute circular buttons with emoji (✨ radiant, 😊 good, 😐 neutral, 😔 low, 🌧️ stormy) — selected one gets a soft glow ring
- Body: A clean textarea or simple rich text editor (just bold/italic/lists is fine — use a contenteditable div with basic formatting toolbar, or a lightweight library)
- Tags input: type and press Enter to add tags, shown as removable pastel pills
- Save button (auto-save on blur is nice too)
- Delete button (subtle, with confirmation)
- "✨ Analyse" button that will trigger AI analysis (wire up the click but don't implement the AI call yet — just show a placeholder)

Make sure CRUD operations work end-to-end: create, edit, delete entries. Data should persist across app restarts.
```

---

## Prompt 5 — Dream Journal Page ✅ COMPLETED

```
Build the Dream Journal page, similar layout to Daily Journal but with dream-specific fields:

LEFT PANEL (entry list):
- Same scrollable list style as daily journal
- Each card shows: date, title/preview, clarity as small stars (e.g. ★★★☆☆), lucid badge if applicable, symbol tags
- Search bar: "Search your dreams..."

RIGHT PANEL (dream editor):
- Date picker
- Optional title
- Body textarea (same style as daily journal)
- Clarity rating: 5 star buttons (or 5 moon phase icons from empty to full) — cute interactive selector
- Lucid dream toggle: a pretty toggle switch with a small "Lucid" label
- Recurring dream toggle: same style, "Recurring" label
- Symbol tags: Same tag input as daily journal, but with a label "Dream Symbols" and placeholder "water, flying, teeth..."
- Save, Delete, "✨ Analyse" buttons (same as daily journal, AI not wired yet)

Full CRUD working and persisted. Reuse shared components where possible (tag input, date picker, entry list card pattern).
```

---

## Prompt 6 — Settings Page ✅ COMPLETED

```
Build the Settings page:

1. Birth Information section:
   - Birth date picker
   - Birth time input (HH:MM format, optional)
   - Birth location text input (city, country — optional)
   - Small note: "Used to personalize your spiritual analyses ✨"

2. Spiritual Frameworks section:
   - Checkboxes (styled as cute toggle pills) for: Astrology, Numerology, Tarot, Chakras, General Spiritual
   - All checked by default
   - Small descriptions under each

3. API Key section:
   - Password input for Anthropic API key
   - Show/hide toggle
   - "Test Connection" button that makes a tiny API call to verify the key works
   - Store encrypted using Electron safeStorage (or if that's complex, at minimum base64 encode — add a TODO for proper encryption)

4. Theme section:
   - Light / Dark toggle with sun/moon icons

5. Data section:
   - "Export All Data" button → saves a JSON file with all entries and analyses
   - "Import Data" button → loads from a previously exported JSON file
   - Warning text on import: "This will merge with your existing data"

6. About section:
   - App name, version, small spiritual quote

All settings should persist via the settings store/repo.
```

---

## Prompt 7 — AI Analysis Engine ✅ COMPLETED

```
Build the AI analysis engine in src/renderer/ai/:

1. claudeClient.ts:
   - Function callClaude(messages, apiKey, onStream) that calls the Anthropic API with streaming
   - Use fetch to POST to https://api.anthropic.com/v1/messages
   - Model: claude-sonnet-4-20250514
   - Enable web_search tool so Claude can look up current astrological transits
   - Handle streaming: parse SSE events, call onStream(chunk) for each text delta
   - Handle errors gracefully (invalid key, rate limit, network)

2. promptBuilder.ts:
   - buildDailyAnalysisPrompt(entry, settings, recentEntries?) → messages array
   - buildDreamAnalysisPrompt(dreamEntry, settings, recentDreams?) → messages array
   - buildWeeklyReviewPrompt(dailyEntries, dreamEntries, settings) → messages array

   System prompt should establish Claude as a warm, wise spiritual guide named "Soul Mirror". The prompt should:
   - Be gentle and reflective, never preachy or prescriptive
   - Reference the entry date and instruct Claude to search for moon phase and planetary transits for that date
   - Include the user's birth data if available for natal chart context
   - Specify which spiritual frameworks to use based on user preferences
   - For dreams: include recent dreams with matching symbol tags for pattern recognition
   - Ask for a structured response with sections (use markdown headers): Reflection, Astrological Insights, [other frameworks], Guidance
   - Keep analysis to ~500 words — insightful but not overwhelming

3. analysisService.ts:
   - analyseEntry(entryId, entryType) — orchestrates: loads entry + context, builds prompt, calls Claude with streaming, saves result
   - analyseWeek(endDate) — loads 7 days of entries, builds combined prompt, calls Claude, saves result
   - Returns a readable stream or calls an onChunk callback for the UI

Write a simple manual test that calls the API with a hardcoded test entry (requires a real API key in settings).
```

---

## Prompt 8 — Wire Up AI Analysis UI ✅ COMPLETED

```
Connect the AI analysis engine to the journal pages:

1. Analysis panel:
   - When user clicks "✨ Analyse" on a daily or dream entry, show an analysis panel below or beside the entry
   - While loading: show a gentle pulsing animation with text "Consulting the stars..." (or similar cute loading messages that rotate)
   - Stream the response: render markdown as it arrives (use a simple markdown renderer — react-markdown or similar)
   - When complete: show the full analysis with nice typography and section headers
   - Show a "Regenerate" button to re-run analysis
   - Show the date/time the analysis was generated
   - If no API key is set, show a friendly message linking to Settings

2. Analysis persistence:
   - Save completed analyses to the database
   - When viewing an entry that already has an analysis, show it immediately (don't re-call the API)
   - "Regenerate" overwrites the saved analysis

3. Entry list indicators:
   - Show a small ✨ or 🔮 icon on entry cards that have an analysis saved

4. Error handling:
   - Network errors: "The cosmic connection seems disrupted. Check your internet and try again."
   - Invalid API key: "Your API key doesn't seem right. Visit Settings to update it."
   - Rate limit: "The stars need a moment to align. Try again shortly."
```

---

## Prompt 9 — Weekly Soul Review

```
Build the Soul Review page:

1. Week selector:
   - Show the current week by default (Mon–Sun)
   - Previous/next week navigation arrows
   - Display the date range nicely (e.g., "March 23 – March 29, 2026")

2. Week summary panel:
   - Show a mini overview of the week: number of daily entries, number of dream entries, mood trend (small sparkline or emoji sequence), common tags
   - If the week has few or no entries, show an encouraging message

3. Generate review:
   - "✨ Generate Soul Review" button
   - This calls the weekly review analysis which cross-references all daily and dream entries from the selected week
   - Streams the response with the same markdown rendering as individual analyses
   - Save the review as an analysis with entry_type='weekly_review' and entry_id as the week's start date

4. Past reviews:
   - If a review already exists for the selected week, show it
   - "Regenerate" option available

Style consistently with the rest of the app. The weekly review should feel like a special, more expansive reflection.
```

---

## Prompt 10 — Polish & Final Touches

```
Final polish pass on the entire app:

1. Empty states:
   - Daily Journal with no entries: Warm illustration placeholder or message — "Your journal awaits your first thoughts... 🌱"
   - Dream Journal with no entries: "When you wake, your dreams will find their home here... 🌙"
   - No analysis yet: "Tap ✨ to receive your spiritual reflection"

2. Animations:
   - Fade-in on page transitions (if not already)
   - Gentle scale-up on entry cards when they appear in the list
   - Soft glow pulse on the "Analyse" button
   - Smooth expand/collapse on the analysis panel

3. Keyboard shortcuts:
   - Cmd/Ctrl+N: New entry (in current journal)
   - Cmd/Ctrl+S: Save current entry
   - Cmd/Ctrl+F: Focus search
   - Escape: Deselect current entry

4. Responsive details:
   - If window is narrow, stack the list and editor vertically
   - Sidebar collapses to icons on narrow windows

5. Typography & spacing audit:
   - Ensure consistent spacing throughout
   - Headings use Cormorant Garamond, body uses Quicksand
   - Generous line-height (1.6–1.8) for readability
   - Entry body text should be comfortable to read

6. Add subtle CSS-only decorative elements:
   - Small moon phase indicator in the header showing actual current moon phase (calculate from date)
   - Thin decorative dividers between sections with a small ✦ or ☽ character centered

7. Final smoke test: Create a daily entry, a dream entry, run analysis on both, run a weekly review, export data, import it back. Verify everything works end-to-end.
```

---

## Build Notes

- **Run each prompt one at a time.** Verify the app works after each step before moving on.
- **If something breaks**, tell Claude Code what's wrong and ask it to fix before proceeding.
- **API key**: You'll need an Anthropic API key to test prompts 7–9. Set it in Settings once that page is built.
- **Expect iteration**: Prompts 3–5 (UI) may need follow-up requests for styling tweaks. That's normal — just describe what you want changed.
- **Electron complexity**: If Electron setup proves too heavy, ask Claude Code to pivot to a Tauri setup or a pure web app (Vite + React) using IndexedDB via `idb` library instead of SQLite. The rest of the prompts stay the same.
