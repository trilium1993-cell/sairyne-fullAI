/**
 * Chat Steps Data
 * Определяет последовательность шагов чата для создания трека
 */

export interface ChatStep {
  id: number;
  ai: string;
  isThinking?: boolean;
  options?: string[];
  nextStep: number; // Убираем optional, так как всегда должен быть следующий шаг (кроме последнего)
}

/**
 * Создает массив шагов чата с динамическим именем проекта
 * @param projectName - название проекта из localStorage
 */
export const createChatSteps = (projectName: string): ChatStep[] => [
  {
    id: 0,
    ai: `What you'd like to do with ${projectName}? Select your choice or simply type in what you'd like to do.`,
    options: ["Create new song from scratch", "Help with current song", "Create remix"],
    nextStep: 1
  },
  {
    id: 1,
    ai: "Select the genre of the song or type in.",
    options: ["House", "Techno", "Trance", "Drum & Bass"],
    nextStep: 2
  },
  {
    id: 2,
    ai: "Creating the plan for House creation process...",
    isThinking: true,
    nextStep: 3
  },
  {
    id: 3,
    ai: "Perfect, let's create a track in the House style.\n\nTo make things simple, we'll break the process down into clear steps:\n\n1. Set up the project (tempo, time signature, basic settings).\n2. Build the rhythm (kick, hi-hats, clap).\n3. Create the bassline.\n4. Add chords and pads.\n5. Layer melodic elements and leads.\n6. Enhance with effects and transitions.\n7. Balance levels and shape the full track structure.\n\n💡 At any point, you can ask questions or request extra guidance — I'll provide more details so you fully understand the process.\n\nAre you ready to start with Step 1 — Project Setup?",
    options: ["I'm ready! Let's start!"],
    nextStep: 4
  },
  {
    id: 4,
    ai: "🟢 Step 1 of 7 — Project Setup\n\nIn House music, the foundation is usually a tempo of 120–125 BPM and a 4/4 time signature.\n\nWhy?\n\n1. Tempo (124 BPM): This speed feels energetic but still groovy — perfect for dancing.\n2. Time Signature (4/4): Almost every House track uses this because it creates the steady, driving pulse you hear in clubs.\n\nLet's set your project to:\n\nTempo: 124 BPM\nTime Signature: 4/4\n\nOn the right, you'll see a visual guide highlighting where to adjust these settings in Ableton.\n\nWhen you're ready, type \"done\" and we'll move on to Step 2 — Rhythm. 🎵",
    options: ["Show visual tips"],
    nextStep: 5
  },
  {
    id: 5,
    ai: "🟢 Step 2 of 7 — Kick Drum\n\nThe kick drum is the foundation of any House track - it provides the driving force that makes people move on the dancefloor. In House music, the kick typically hits on every beat (1-2-3-4), creating that signature four-on-the-floor rhythm.\n\nHere's our plan:\n\n1. Add Drum Rack - Set up your drum container\n2. Load kick sample - Find the perfect House kick sound\n3. Create MIDI pattern - Program the classic 4/4 rhythm\n\nEach step builds on the previous one, so we'll take it nice and slow. I'll show you exactly where to click and what to drag.\n\nLet's start by adding the Drum Rack instrument! Check out the visual guide on the right to see exactly how to do it. →\n\nOnce you've added the Drum Rack, let me know and we'll move on to finding the perfect kick sample!",
    options: ["Show visual tips"],
    nextStep: 6
  },
  {
    id: 6,
    ai: "✅ Kick drum setup completed. Proceed to next phase.",
    nextStep: 7 // Добавляем nextStep для совместимости
  }
];

