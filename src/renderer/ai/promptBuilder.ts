import type { DailyEntry, DreamEntry, UserSettings, SpiritualFramework } from '../../shared/types';
import type { ClaudeMessage } from './claudeClient';

const SOUL_MIRROR_SYSTEM = `You are Soul Mirror, a warm, wise, and gentle spiritual guide. You help people reflect on their journal entries and dreams through the lens of spiritual wisdom. Your tone is:
- Warm and compassionate, like a trusted friend with deep spiritual knowledge
- Reflective and insightful, never preachy or prescriptive
- Gently encouraging without being saccharine
- You use poetic language sparingly — enough to feel magical, not overwrought

You have access to web search. Use it to look up:
- Current moon phase and astrological transits for the entry date
- Any relevant planetary alignments or retrogrades

Structure your response with clear markdown headers. Keep your analysis to approximately 500 words — insightful but not overwhelming.`;

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T12:00:00');
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function buildFrameworkInstructions(frameworks: SpiritualFramework[]): string {
  const sections: string[] = [];

  if (frameworks.includes('astrology')) {
    sections.push(
      '**Astrological Insights**: Search for the moon phase and major planetary transits for this date. Reference how these celestial energies may relate to the themes in the entry.'
    );
  }
  if (frameworks.includes('numerology')) {
    sections.push(
      '**Numerological Meaning**: Calculate the numerological significance of the date (day number, universal day number). If birth date is provided, reference their life path number.'
    );
  }
  if (frameworks.includes('tarot')) {
    sections.push(
      '**Tarot Associations**: Identify tarot cards that symbolically resonate with the themes, emotions, or imagery in the entry. Explain the symbolic connection briefly.'
    );
  }
  if (frameworks.includes('chakra')) {
    sections.push(
      '**Chakra & Energy**: Identify which chakras or energy centers seem most active or relevant based on the emotional and thematic content.'
    );
  }
  if (frameworks.includes('general')) {
    sections.push(
      '**Spiritual Reflection**: Offer a general spiritual or philosophical reflection on the themes present.'
    );
  }

  return sections.join('\n\n');
}

function buildBirthContext(settings: UserSettings | null): string {
  if (!settings) return '';

  const parts: string[] = [];
  if (settings.birth_date) {
    parts.push(`Birth date: ${formatDate(settings.birth_date)}`);
  }
  if (settings.birth_time) {
    parts.push(`Birth time: ${settings.birth_time}`);
  }
  if (settings.birth_location) {
    parts.push(`Birth location: ${settings.birth_location}`);
  }

  if (parts.length === 0) return '';

  return `\n\nThe journaler's birth information (for natal chart context):\n${parts.join('\n')}`;
}

function moodLabel(mood: string): string {
  const labels: Record<string, string> = {
    radiant: '✨ Radiant',
    good: '😊 Good',
    neutral: '😐 Neutral',
    low: '😔 Low',
    stormy: '🌧️ Stormy',
  };
  return labels[mood] || mood;
}

export function buildDailyAnalysisPrompt(
  entry: DailyEntry,
  settings: UserSettings | null,
  recentEntries?: DailyEntry[]
): { system: string; messages: ClaudeMessage[] } {
  const frameworks = settings?.preferred_frameworks || ['astrology', 'numerology', 'tarot', 'chakra', 'general'];
  const frameworkInstructions = buildFrameworkInstructions(frameworks);
  const birthContext = buildBirthContext(settings);

  const system = `${SOUL_MIRROR_SYSTEM}${birthContext}

For this analysis, please include the following sections:

## Reflection
A warm, empathetic reflection on what the journaler has shared.

${frameworkInstructions}

## Guidance
A gentle, encouraging closing thought or suggestion for reflection.`;

  let userContent = `Please analyse this daily journal entry.

**Date**: ${formatDate(entry.date)}
**Mood**: ${moodLabel(entry.mood)}`;

  if (entry.title) {
    userContent += `\n**Title**: ${entry.title}`;
  }
  if (entry.tags.length > 0) {
    userContent += `\n**Tags**: ${entry.tags.join(', ')}`;
  }

  userContent += `\n\n**Entry**:\n${entry.body}`;

  if (recentEntries && recentEntries.length > 0) {
    userContent += `\n\n---\n**Recent journal entries for context** (past 7 days):\n`;
    for (const recent of recentEntries.slice(0, 5)) {
      userContent += `\n- ${formatDate(recent.date)} (${moodLabel(recent.mood)}): ${recent.body.slice(0, 150)}${recent.body.length > 150 ? '...' : ''}`;
    }
  }

  return {
    system,
    messages: [{ role: 'user', content: userContent }],
  };
}

export function buildDreamAnalysisPrompt(
  dreamEntry: DreamEntry,
  settings: UserSettings | null,
  recentDreams?: DreamEntry[]
): { system: string; messages: ClaudeMessage[] } {
  const frameworks = settings?.preferred_frameworks || ['astrology', 'numerology', 'tarot', 'chakra', 'general'];
  const birthContext = buildBirthContext(settings);

  const frameworkSections: string[] = [];

  if (frameworks.includes('astrology')) {
    frameworkSections.push(
      '**Astrological Context**: Search for the moon phase and transits for this date. Consider how lunar and planetary energies may connect to the dream imagery.'
    );
  }
  if (frameworks.includes('tarot')) {
    frameworkSections.push(
      '**Tarot Symbolism**: Identify tarot cards that mirror the dream\'s symbols and archetypes.'
    );
  }
  if (frameworks.includes('numerology')) {
    frameworkSections.push(
      '**Numerological Echoes**: Note any numerological significance of the date or recurring numbers in the dream.'
    );
  }
  if (frameworks.includes('chakra')) {
    frameworkSections.push(
      '**Elemental & Energetic Analysis**: Identify elements (water, fire, earth, air) and chakra associations present in the dream.'
    );
  }
  if (frameworks.includes('general')) {
    frameworkSections.push(
      '**Archetypal & Jungian Reflection**: Explore the deeper archetypal and symbolic meaning of the dream from a spiritual/Jungian perspective.'
    );
  }

  const system = `${SOUL_MIRROR_SYSTEM}${birthContext}

You are interpreting a dream. Approach dream symbols with curiosity and multiple possible meanings — never be reductive or overly literal. Draw on spiritual dream symbolism, Jungian archetypes, and elemental associations.

For this analysis, please include these sections:

## Dream Reflection
A warm interpretation of the overall dream narrative and emotional tone.

## Symbol Analysis
Break down the key symbols in the dream and their possible spiritual meanings.

${frameworkSections.join('\n\n')}

## Guidance
A gentle message about what this dream might be inviting the dreamer to explore or integrate.`;

  const clarityLabels = ['Very Foggy', 'Foggy', 'Moderate', 'Clear', 'Vivid'];
  let userContent = `Please analyse this dream journal entry.

**Date**: ${formatDate(dreamEntry.date)}
**Clarity**: ${clarityLabels[(dreamEntry.clarity || 3) - 1]} (${dreamEntry.clarity}/5)`;

  if (dreamEntry.is_lucid) {
    userContent += `\n**Lucid Dream**: Yes`;
  }
  if (dreamEntry.is_recurring) {
    userContent += `\n**Recurring Dream**: Yes`;
  }
  if (dreamEntry.title) {
    userContent += `\n**Title**: ${dreamEntry.title}`;
  }
  if (dreamEntry.symbol_tags.length > 0) {
    userContent += `\n**Dream Symbols**: ${dreamEntry.symbol_tags.join(', ')}`;
  }

  userContent += `\n\n**Dream**:\n${dreamEntry.body}`;

  if (recentDreams && recentDreams.length > 0) {
    userContent += `\n\n---\n**Recent dreams for pattern recognition** (sharing symbols or themes):\n`;
    for (const dream of recentDreams.slice(0, 5)) {
      userContent += `\n- ${formatDate(dream.date)}`;
      if (dream.symbol_tags.length > 0) {
        userContent += ` [${dream.symbol_tags.join(', ')}]`;
      }
      userContent += `: ${dream.body.slice(0, 150)}${dream.body.length > 150 ? '...' : ''}`;
    }
  }

  return {
    system,
    messages: [{ role: 'user', content: userContent }],
  };
}

export function buildWeeklyReviewPrompt(
  dailyEntries: DailyEntry[],
  dreamEntries: DreamEntry[],
  settings: UserSettings | null,
  weekStart: string,
  weekEnd: string
): { system: string; messages: ClaudeMessage[] } {
  const frameworks = settings?.preferred_frameworks || ['astrology', 'numerology', 'tarot', 'chakra', 'general'];
  const frameworkInstructions = buildFrameworkInstructions(frameworks);
  const birthContext = buildBirthContext(settings);

  const system = `${SOUL_MIRROR_SYSTEM}${birthContext}

You are creating a Weekly Soul Review — a special, expansive reflection that weaves together an entire week of journal entries and dreams. Look for:
- Recurring themes and emotional patterns across the week
- Connections between daily experiences and dream content
- Synchronicities and meaningful coincidences
- Emotional arc and growth throughout the week
- Spiritual lessons emerging from the week's experiences

For this review, include these sections:

## Week at a Glance
A brief, poetic summary of the week's emotional and thematic arc.

## Patterns & Threads
Identify recurring themes, symbols, or emotions across both daily entries and dreams.

## Dream–Waking Connections
Highlight any meaningful connections between dream content and waking life entries.

${frameworkInstructions}

## Weekly Guidance
A nurturing, expansive reflection and gentle guidance for the week ahead.

This is a more expansive analysis — aim for approximately 600–800 words.`;

  let userContent = `Please create a Weekly Soul Review for the week of **${formatDate(weekStart)}** to **${formatDate(weekEnd)}**.`;

  if (dailyEntries.length > 0) {
    userContent += `\n\n### Daily Journal Entries\n`;
    for (const entry of dailyEntries) {
      userContent += `\n**${formatDate(entry.date)}** — Mood: ${moodLabel(entry.mood)}`;
      if (entry.title) userContent += ` — "${entry.title}"`;
      if (entry.tags.length > 0) userContent += ` [${entry.tags.join(', ')}]`;
      userContent += `\n${entry.body}\n`;
    }
  } else {
    userContent += `\n\nNo daily journal entries were recorded this week.`;
  }

  if (dreamEntries.length > 0) {
    userContent += `\n### Dream Journal Entries\n`;
    const clarityLabels = ['Very Foggy', 'Foggy', 'Moderate', 'Clear', 'Vivid'];
    for (const dream of dreamEntries) {
      userContent += `\n**${formatDate(dream.date)}** — Clarity: ${clarityLabels[(dream.clarity || 3) - 1]}`;
      if (dream.title) userContent += ` — "${dream.title}"`;
      if (dream.is_lucid) userContent += ` (Lucid)`;
      if (dream.is_recurring) userContent += ` (Recurring)`;
      if (dream.symbol_tags.length > 0) userContent += ` [${dream.symbol_tags.join(', ')}]`;
      userContent += `\n${dream.body}\n`;
    }
  } else {
    userContent += `\n\nNo dream journal entries were recorded this week.`;
  }

  return {
    system,
    messages: [{ role: 'user', content: userContent }],
  };
}
