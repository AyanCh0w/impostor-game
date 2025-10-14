export interface GameData extends Record<string, unknown> {
  wordIndex: number;
  users: string[];
  creator: string;
  impostor: string;
  start: boolean;
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
