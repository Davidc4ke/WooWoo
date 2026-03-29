import type { DailyEntry, DreamEntry, UserSettings, SpiritualFramework } from '../../shared/types';
import type { ClaudeMessage } from './claudeClient';

const SOUL_MIRROR_SYSTEM = `You are Soul Mirror, a warm, wise, and gentle spiritual guide. You speak with kindness, wonder, and poetic insight — never preachy, never prescriptive. You reflect back what you see in the person's words, offering perspective through spiritual frameworks they've chosen.

Your tone is like a dear friend who happens to be deeply versed in spiritual wisdom — approachable, compassionate, and a little whimsical. Use soft language, occasional metaphors, and always affirm the person's experience before offering insight.

Keep your analysis to approximately 500 words — insightful but not overwhelming. Structure your response with markdown headers for each section.`;

function frameworkInstructions(frameworks: SpiritualFramework[]): string {
  const sections: string[] = [];

  if (frameworks.includes('astrology')) {
    sections.push(
      '**Astrological Insights**: Search the web for the moon phase and major planetary transits for the entry date. Weave these cosmic influences into your reflection — how might the current sky mirror what the person is experiencing?',
    );
  }
  if (frameworks.includes('numerology')) {
    sections.push(
      '**Numerological Threads**: Calculate the numerology of the entry date (reduce to single digit). If the person\'s birth date is provided, reference their life path number. Share what these numbers whisper about the day\'s energy.',
    );
  }
  if (frameworks.includes('tarot')) {
    sections.push(
      '**Tarot Symbolism**: Intuitively associate one or two tarot cards (Major or Minor Arcana) with the themes in this entry. Describe the card\'s imagery and how it mirrors the person\'s experience — this is symbolic, not a "reading."',
    );
  }
  if (frameworks.includes('chakra')) {
    sections.push(
      '**Chakra & Energy**: Identify which chakra(s) seem most activated or in need of attention based on the entry\'s themes. Suggest a gentle awareness practice.',
    );
  }
  if (frameworks.includes('general')) {
    sections.push(
      '**Spiritual Reflection**: Offer a general spiritual or philosophical reflection — draw from universal wisdom traditions, Jungian psychology, or mindfulness.',
    );
  }

  return sections.join('\n\n');
}

function birthContext(settings: UserSettings | null): string {
  if (!settings) return '';
  const parts: string[] = [];
  if (settings.birth_date) parts.push(`Birth date: ${settings.birth_date}`);
  if (settings.birth_time) parts.push(`Birth time: ${settings.birth_time}`);
  if (settings.birth_location) parts.push(`Birth location: ${settings.birth_location}`);
  if (parts.length === 0) return '';
  return `\n\nThe person's birth information (for natal chart context):\n${parts.join('\n')}`;
}

function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

function moodLabel(mood: string): string {
  const labels: Record<string, string> = {
    radiant: 'radiant and bright ✨',
    good: 'good and steady 😊',
    neutral: 'neutral and balanced 😐',
    low: 'low and reflective 😔',
    stormy: 'stormy and turbulent 🌧️',
  };
  return labels[mood] || mood;
}

export function buildDailyAnalysisPrompt(
  entry: DailyEntry,
  settings: UserSettings | null,
  recentEntries?: DailyEntry[],
): { system: string; messages: ClaudeMessage[] } {
  const frameworks = settings?.preferred_frameworks || ['astrology', 'numerology', 'tarot', 'chakra', 'general'];
  const formattedDate = formatDate(entry.date);

  let system = SOUL_MIRROR_SYSTEM;
  system += `\n\nToday you are reflecting on a daily journal entry written on ${formattedDate}.`;
  system += `\nThe entry date is ${entry.date} — please search the web for the moon phase and any notable astrological transits for this date.`;
  system += birthContext(settings);
  system += `\n\nPlease structure your response with these sections:\n\n## ✨ Reflection\nA warm, personal reflection on what the person shared.\n\n${frameworkInstructions(frameworks)}\n\n## 🌟 Guidance\nA gentle closing thought or suggestion — something to carry forward.`;

  let userContent = `Here is my journal entry from ${formattedDate}:\n\n`;
  if (entry.title) userContent += `**${entry.title}**\n\n`;
  userContent += entry.body;
  userContent += `\n\nMy mood: ${moodLabel(entry.mood)}`;
  if (entry.tags.length > 0) {
    userContent += `\nTags: ${entry.tags.join(', ')}`;
  }

  if (recentEntries && recentEntries.length > 0) {
    userContent += '\n\n---\nFor context, here are my recent journal entries:\n';
    for (const recent of recentEntries.slice(0, 3)) {
      userContent += `\n**${formatDate(recent.date)}** (mood: ${recent.mood})`;
      if (recent.title) userContent += ` — ${recent.title}`;
      userContent += `\n${recent.body.slice(0, 200)}${recent.body.length > 200 ? '...' : ''}\n`;
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
  recentDreams?: DreamEntry[],
): { system: string; messages: ClaudeMessage[] } {
  const frameworks = settings?.preferred_frameworks || ['astrology', 'numerology', 'tarot', 'chakra', 'general'];
  const formattedDate = formatDate(dreamEntry.date);

  let system = SOUL_MIRROR_SYSTEM;
  system += `\n\nToday you are interpreting a dream recorded on ${formattedDate}.`;
  system += `\nThe dream date is ${dreamEntry.date} — please search the web for the moon phase and any notable astrological transits for this date, as these can influence dream content.`;
  system += birthContext(settings);

  system += `\n\nPlease structure your response with these sections:\n\n## 🌙 Dream Reflection\nA warm interpretation of the dream's narrative and emotional landscape.\n\n## 🔮 Symbol Analysis\nExplore the key symbols in the dream using spiritual and Jungian dream symbolism. What archetypes are present?\n\n${frameworkInstructions(frameworks)}\n\n## 🌟 Guidance\nA gentle closing thought — what might this dream be inviting the dreamer to explore?`;

  let userContent = `Here is my dream from ${formattedDate}:\n\n`;
  if (dreamEntry.title) userContent += `**${dreamEntry.title}**\n\n`;
  userContent += dreamEntry.body;
  userContent += `\n\nClarity: ${dreamEntry.clarity}/5`;
  if (dreamEntry.is_lucid) userContent += '\nThis was a lucid dream.';
  if (dreamEntry.is_recurring) userContent += '\nThis is a recurring dream.';
  if (dreamEntry.symbol_tags.length > 0) {
    userContent += `\nKey symbols: ${dreamEntry.symbol_tags.join(', ')}`;
  }

  if (recentDreams && recentDreams.length > 0) {
    const matchingDreams = recentDreams.filter((d) => d.id !== dreamEntry.id);
    if (matchingDreams.length > 0) {
      userContent += '\n\n---\nFor context, here are my recent dreams (look for recurring patterns and symbols):\n';
      for (const dream of matchingDreams.slice(0, 3)) {
        userContent += `\n**${formatDate(dream.date)}**`;
        if (dream.title) userContent += ` — ${dream.title}`;
        userContent += `\n${dream.body.slice(0, 200)}${dream.body.length > 200 ? '...' : ''}`;
        if (dream.symbol_tags.length > 0) userContent += `\nSymbols: ${dream.symbol_tags.join(', ')}`;
        userContent += '\n';
      }
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
  weekRange: { start: string; end: string },
): { system: string; messages: ClaudeMessage[] } {
  const frameworks = settings?.preferred_frameworks || ['astrology', 'numerology', 'tarot', 'chakra', 'general'];
  const startFormatted = formatDate(weekRange.start);
  const endFormatted = formatDate(weekRange.end);

  let system = SOUL_MIRROR_SYSTEM;
  system += `\n\nYou are creating a Weekly Soul Review for the week of ${startFormatted} through ${endFormatted}.`;
  system += `\nPlease search the web for major astrological transits and moon phases during this week (${weekRange.start} to ${weekRange.end}).`;
  system += birthContext(settings);
  system += `\n\nThis is a special, expansive reflection that weaves together the person's daily journal entries and dreams from the entire week. Look for patterns, synchronicities, and spiritual themes across all entries.\n\nPlease structure your response with these sections:\n\n## ✨ Week at a Glance\nA brief, warm overview of the week's emotional and spiritual landscape.\n\n## 🔮 Patterns & Synchronicities\nWhat themes, symbols, or patterns appear across the daily entries and dreams? Are there meaningful connections?\n\n${frameworkInstructions(frameworks)}\n\n## 🌟 Week Ahead Guidance\nA gentle, encouraging message for the week ahead — what to carry forward, what to release.`;

  let userContent = `Here is my week in review (${startFormatted} – ${endFormatted}):\n\n`;

  if (dailyEntries.length > 0) {
    userContent += '### Daily Journal Entries\n\n';
    for (const entry of dailyEntries) {
      userContent += `**${formatDate(entry.date)}** — Mood: ${moodLabel(entry.mood)}`;
      if (entry.title) userContent += ` — ${entry.title}`;
      userContent += `\n${entry.body}\n`;
      if (entry.tags.length > 0) userContent += `Tags: ${entry.tags.join(', ')}\n`;
      userContent += '\n';
    }
  } else {
    userContent += '*No daily journal entries this week.*\n\n';
  }

  if (dreamEntries.length > 0) {
    userContent += '### Dream Journal Entries\n\n';
    for (const dream of dreamEntries) {
      userContent += `**${formatDate(dream.date)}**`;
      if (dream.title) userContent += ` — ${dream.title}`;
      userContent += `\nClarity: ${dream.clarity}/5`;
      if (dream.is_lucid) userContent += ' | Lucid';
      if (dream.is_recurring) userContent += ' | Recurring';
      userContent += `\n${dream.body}\n`;
      if (dream.symbol_tags.length > 0) userContent += `Symbols: ${dream.symbol_tags.join(', ')}\n`;
      userContent += '\n';
    }
  } else {
    userContent += '*No dream entries this week.*\n\n';
  }

  return {
    system,
    messages: [{ role: 'user', content: userContent }],
  };
}
