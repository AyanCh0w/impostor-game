export interface GameData {
  word: string;
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
