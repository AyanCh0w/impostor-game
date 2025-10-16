export interface GameData extends Record<string, unknown> {
  wordIndex: number;
  users: string[];
  creator: string;
  impostor: string;
  impostors: string[]; // Support for multiple impostors
  impostorCount: number; // Number of impostors (1, 2, or 3)
  theme: string; // Game theme (random, clashroyale, fortnite, teachers, etc.)
  start: boolean;
  lastWord?: string;
  userNames: Record<string, string>; // Map of userId to display name
}

export interface GameDocument {
  id: string;
  data: GameData;
}

export interface GamePageProps {
  params: Promise<{
    gameid: string;
  }>;
}
