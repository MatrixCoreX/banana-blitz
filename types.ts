
export enum GameStatus {
  IDLE = 'IDLE',
  STARTING = 'STARTING',
  PLAYING = 'PLAYING',
  LEVEL_COMPLETE = 'LEVEL_COMPLETE',
  FINISHED = 'FINISHED'
}

export type Language = 'zh' | 'en';

export interface GameState {
  score: number;
  timeLeft: number;
  status: GameStatus;
  level: number;
  language: Language;
}
