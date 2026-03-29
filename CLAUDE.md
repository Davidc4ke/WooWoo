# Soul Journal

A local-first, AI-enhanced desktop journaling app combining daily journaling, dream journaling, and spiritual analysis (astrology, tarot, numerology). Built with Electron, React 18, TypeScript, and SQLite.

## Project Status

Currently in the specification and UI mockup phase. The implementation will follow the incremental build prompts in `02-claude-code-prompts.md`.

## Tech Stack

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **Desktop**: Electron
- **Styling**: Tailwind CSS 4
- **Database**: SQLite via `better-sqlite3`
- **State Management**: Zustand
- **AI**: Anthropic Claude API (`@anthropic-ai/sdk`)
- **Icons**: Lucide React
- **Typography**: Cormorant Garamond (headings), Quicksand (body)

## Project Structure (Planned)

```
src/
  main/          # Electron main process
  renderer/      # React app
    components/
    pages/
    hooks/
    stores/
    db/
    ai/
    styles/
    types/
  shared/        # Shared types between main/renderer
```

## Commands (once initialized)

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm test         # Run tests
npm run lint     # Lint code
```

## Key Files

- `01-project-requirements.md` — Full requirements and data model
- `02-claude-code-prompts.md` — Step-by-step build prompts (Prompt 0–10)
- `mockup.html` — Static UI mockup

## Design Guidelines

- Soft, rounded corners (12–16px border-radius)
- Generous whitespace, single-column centered layout (max-width 720px)
- Subtle animations (fade-ins, hover glows, gentle scale-ups)
- Light mode background: `#FFF8F0` (warm cream)
- Lavender accent: `#C4B1D4`, sage: `#A8C5A0`, dusty rose: `#D4A0A0`, warm gold: `#D4A96A`
- Dark mode base: `#1A1A2E` (deep indigo/navy)

## Maintaining This File

After any significant change to the project, update this CLAUDE.md to reflect the current state. This includes:

- Adding or removing dependencies from the tech stack
- Changes to project structure (new directories, renamed modules)
- New, changed, or removed build/test/lint commands
- New key files or removal of existing ones
- Changes to design guidelines or architecture decisions
- Updates to project status (e.g., moving from spec phase to implementation)

Keep this file accurate so it serves as a reliable reference for every session.

## Architecture Principles

- **Local-first**: All data stored locally in SQLite, no cloud/backend
- **Privacy**: No telemetry, API keys stored via Electron's `safeStorage`
- **Direct API calls**: No proxy server; the app calls Claude API directly
- **Data portability**: Full export/import support (JSON/Markdown)
