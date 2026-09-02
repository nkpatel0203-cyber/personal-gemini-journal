import { JournalEntry, MoodConfig, MoodType } from '../types';

export const MOOD_CONFIGS: Record<MoodType, MoodConfig> = {
  serene: {
    id: 'serene',
    label: 'Serene',
    emoji: '🌿',
    badgeBg: 'bg-emerald-50 border-emerald-200 text-emerald-800',
    textColor: 'text-emerald-700',
    dotColor: 'bg-emerald-500',
    description: 'Tranquil, peaceful, and centered',
  },
  grateful: {
    id: 'grateful',
    label: 'Grateful',
    emoji: '✨',
    badgeBg: 'bg-amber-50 border-amber-200 text-amber-800',
    textColor: 'text-amber-700',
    dotColor: 'bg-amber-500',
    description: 'Thankful for small joys and warmth',
  },
  reflective: {
    id: 'reflective',
    label: 'Reflective',
    emoji: '🪞',
    badgeBg: 'bg-indigo-50 border-indigo-200 text-indigo-800',
    textColor: 'text-indigo-700',
    dotColor: 'bg-indigo-500',
    description: 'Looking inward, seeking deeper clarity',
  },
  energized: {
    id: 'energized',
    label: 'Energized',
    emoji: '⚡',
    badgeBg: 'bg-orange-50 border-orange-200 text-orange-800',
    textColor: 'text-orange-700',
    dotColor: 'bg-orange-500',
    description: 'Motivated, dynamic, full of momentum',
  },
  creative: {
    id: 'creative',
    label: 'Creative',
    emoji: '🎨',
    badgeBg: 'bg-purple-50 border-purple-200 text-purple-800',
    textColor: 'text-purple-700',
    dotColor: 'bg-purple-500',
    description: 'Imagination sparked, ideas flowing',
  },
  hopeful: {
    id: 'hopeful',
    label: 'Hopeful',
    emoji: '🌱',
    badgeBg: 'bg-teal-50 border-teal-200 text-teal-800',
    textColor: 'text-teal-700',
    dotColor: 'bg-teal-500',
    description: 'Looking forward with gentle optimism',
  },
  grounded: {
    id: 'grounded',
    label: 'Grounded',
    emoji: '🪵',
    badgeBg: 'bg-stone-100 border-stone-300 text-stone-800',
    textColor: 'text-stone-700',
    dotColor: 'bg-stone-500',
    description: 'Present, stable, rooted in reality',
  },
  overwhelmed: {
    id: 'overwhelmed',
    label: 'Overwhelmed',
    emoji: '🌊',
    badgeBg: 'bg-rose-50 border-rose-200 text-rose-800',
    textColor: 'text-rose-700',
    dotColor: 'bg-rose-500',
    description: 'Carrying too much, needing space to exhale',
  },
  melancholic: {
    id: 'melancholic',
    label: 'Melancholic',
    emoji: '🌧️',
    badgeBg: 'bg-slate-100 border-slate-300 text-slate-700',
    textColor: 'text-slate-600',
    dotColor: 'bg-slate-400',
    description: 'A soft, tender sadness seeking acknowledgment',
  },
};

export const INITIAL_JOURNAL_ENTRIES: JournalEntry[] = [
  {
    id: 'entry-1',
    title: 'Morning stillness and unhurried coffee',
    date: new Date(Date.now() - 1000 * 60 * 60 * 20).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 20).toISOString(),
    mood: 'serene',
    tags: ['mindfulness', 'morning-routine', 'slowness'],
    location: 'Balcony Corner',
    weather: 'Crisp morning sunshine, 16°C',
    dailyIntention: 'Give undivided attention to one thing at a time.',
    gratitudes: [
      'The diagonal light cutting across the wooden table',
      'The scent of fresh ground Ethiopian roast',
      'Having 30 unhurried minutes before checking notifications',
    ],
    content: `Woke up before the alarm today. Instead of immediately picking up my phone and drowning in news feeds, I kept it face down on the bedside table and walked straight to the balcony with a warm mug.

There is a distinct quiet right around 6:45 AM when the birds start tuning their morning calls, but the traffic hasn't started yet. I noticed my mind wanting to race ahead to the 2 PM presentation, rehearsing bullet points that don't need rehearsing anymore.

When I felt that familiar tightness in the chest, I took three deep belly breaths and reminded myself: *the day will arrive in its own time. Right now, this steam rising from the cup is my only reality.*

It's astonishing how much friction dissolves when you refuse to borrow tomorrow's worries today.`,
    isFavorite: true,
    aiReflection: {
      summary: 'A mindful morning transition marked by an intentional refusal to surrender early hours to premature anxiety.',
      emotionalTone: 'Serene and anchored, balancing natural anticipatory nerves with mindful self-regulation.',
      keyThemes: ['Boundary with technology', 'Savoring the micro-present', 'Pre-empting performance anxiety'],
      insights: [
        'You have developed a keen somatic awareness—catching the chest tightness before it spirals into compulsive over-preparation.',
        'Protecting the morning threshold acts as an anchor for your entire nervous system throughout demanding afternoons.',
      ],
      growthOpportunities: [
        'Notice if the midday rush tries to undo this morning stillness, and use the same 3-breath anchor right before your 2 PM meeting.',
      ],
      socraticQuestion: 'What other everyday routines could become sacred rituals if you gave them your full, unhurried presence?',
      reframing: 'Your mind rehearsing the presentation was merely its protective impulse trying to keep you secure; thank it gently and let the moment breathe.',
      generatedAt: new Date(Date.now() - 1000 * 60 * 60 * 19).toISOString(),
    },
    aiChatHistory: [
      {
        id: 'msg-1',
        role: 'assistant',
        content: 'I loved how you caught the chest tightness and grounded yourself with the morning light. How did the 2 PM presentation end up feeling after you cultivated this morning stillness?',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString(),
      },
      {
        id: 'msg-2',
        role: 'user',
        content: 'It went surprisingly smooth. I felt much more centered and listened better instead of just waiting for my turn to speak.',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 17).toISOString(),
      },
      {
        id: 'msg-3',
        role: 'assistant',
        content: 'That is the subtle magic of an uncluttered morning—it doesn’t just help you relax, it amplifies your executive presence and empathy.',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 16).toISOString(),
      },
    ],
  },
  {
    id: 'entry-2',
    title: 'The unexpected beauty of letting go of a plan',
    date: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    mood: 'reflective',
    tags: ['flexibility', 'creativity', 'growth'],
    location: 'Study Desk',
    weather: 'Overcast & gentle drizzle',
    dailyIntention: 'Hold plans lightly.',
    gratitudes: [
      'A candid conversation with Maya',
      'The sound of rain against the windowpane',
      'Allowing a mistake to be a detour rather than a catastrophe',
    ],
    content: `Everything I had planned for the weekend sprint fell apart by Saturday noon. The design files had to be overhauled, an unexpected bug cropped up, and for two hours I was genuinely frustrated.

Why do I treat every deviation from a schedule like a personal failure?

Instead of forcing a 10-hour marathon to fix everything, I closed my laptop, put on my rain boots, and walked through the park. Seeing the fallen leaves and the way the rain softened the edges of everything reminded me that nature never rushes, yet everything gets accomplished.

When I came back, the solution to the bug was obvious within 15 minutes. Stepping away gave me the perspective that brute force never could.`,
    isFavorite: false,
    aiReflection: {
      summary: 'An exploration of perfectionism and the counter-intuitive wisdom of psychological detachment during roadblocks.',
      emotionalTone: 'Thoughtful, evolving from initial exasperation into philosophical composure.',
      keyThemes: ['Rigidity vs. Adaptability', 'Incubation effect in problem solving', 'Self-forgiveness'],
      insights: [
        'You recognized that high friction is often a signal for rest and perspective rather than doubling down on strain.',
        'Your question "Why do I treat every deviation like a failure?" is a pivotal awareness step towards untangling self-worth from linear productivity.',
      ],
      growthOpportunities: [
        'When schedules derail in the future, institute a mandatory 20-minute physical reset before taking compensatory action.',
      ],
      socraticQuestion: 'If plans are maps rather than promises, what freedom does that give you when entering uncharted territory?',
      reframing: 'The detour was not lost time; it was the exact space your unconscious mind needed to formulate the 15-minute solution.',
      generatedAt: new Date(Date.now() - 1000 * 60 * 60 * 47).toISOString(),
    },
  },
  {
    id: 'entry-3',
    title: 'Creative flow state in the pottery studio',
    date: new Date(Date.now() - 1000 * 60 * 60 * 96).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 96).toISOString(),
    mood: 'creative',
    tags: ['pottery', 'flow', 'sensory'],
    location: 'Artisan Clay Studio',
    weather: 'Warm breeze, golden hour',
    dailyIntention: 'Embrace imperfection with my hands.',
    gratitudes: [
      'The cool tactile sensation of wet clay',
      'Laughter shared with fellow workshop participants',
      'Making a lopsided vase that has genuine personality',
    ],
    content: `Spent 3 hours at the wheel today. When you're centering clay, you can't be anywhere else in your head. If your mind wanders to an email, the clay immediately wobbles off-center.

There is a profound humility in physical crafts. You cannot talk your way into a centered bowl; you have to balance firmness and tenderness simultaneously.

My final vase is slightly asymmetrical on the rim, but my pottery teacher said: "That is where the light will catch it." I love that idea. Perfection is sterile; character lives in the slight wobble.`,
    isFavorite: true,
  },
];
