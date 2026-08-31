export interface GameRow {
  id: string;
  title: string;
  short: string;
  long: string;
  cat: 'ARCADE' | 'PUZZLE' | 'SHOOTER';
  cover: string;
  color: 'cyan' | 'magenta' | 'yellow' | 'green';
  created_at: string;
}

export interface ScoreRow {
  id: string;
  game_id: string;
  player_name: string;
  score: number;
  user_id: string | null;
  created_at: string;
}
