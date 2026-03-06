export type Player = 'red' | 'black';

export type PieceType = 'general' | 'advisor' | 'elephant' | 'horse' | 'chariot' | 'cannon' | 'soldier';

export interface Piece {
  type: PieceType;
  player: Player;
}

export interface Position {
  x: number; // 0-8 (File)
  y: number; // 0-9 (Rank)
}

export interface Move {
  from: Position;
  to: Position;
  captured?: Piece; // For undoing
  score?: number;
}

export const BOARD_WIDTH = 9;
export const BOARD_HEIGHT = 10;

// Initial Board Setup
export const INITIAL_BOARD: (Piece | null)[][] = [
  // Black side (Top, y=0 to 4)
  [
    { type: 'chariot', player: 'black' },
    { type: 'horse', player: 'black' },
    { type: 'elephant', player: 'black' },
    { type: 'advisor', player: 'black' },
    { type: 'general', player: 'black' },
    { type: 'advisor', player: 'black' },
    { type: 'elephant', player: 'black' },
    { type: 'horse', player: 'black' },
    { type: 'chariot', player: 'black' },
  ],
  [null, null, null, null, null, null, null, null, null],
  [
    null,
    { type: 'cannon', player: 'black' },
    null,
    null,
    null,
    null,
    null,
    { type: 'cannon', player: 'black' },
    null,
  ],
  [
    { type: 'soldier', player: 'black' },
    null,
    { type: 'soldier', player: 'black' },
    null,
    { type: 'soldier', player: 'black' },
    null,
    { type: 'soldier', player: 'black' },
    null,
    { type: 'soldier', player: 'black' },
  ],
  [null, null, null, null, null, null, null, null, null],
  // River
  [null, null, null, null, null, null, null, null, null],
  [
    { type: 'soldier', player: 'red' },
    null,
    { type: 'soldier', player: 'red' },
    null,
    { type: 'soldier', player: 'red' },
    null,
    { type: 'soldier', player: 'red' },
    null,
    { type: 'soldier', player: 'red' },
  ],
  [
    null,
    { type: 'cannon', player: 'red' },
    null,
    null,
    null,
    null,
    null,
    { type: 'cannon', player: 'red' },
    null,
  ],
  [null, null, null, null, null, null, null, null, null],
  [
    { type: 'chariot', player: 'red' },
    { type: 'horse', player: 'red' },
    { type: 'elephant', player: 'red' },
    { type: 'advisor', player: 'red' },
    { type: 'general', player: 'red' },
    { type: 'advisor', player: 'red' },
    { type: 'elephant', player: 'red' },
    { type: 'horse', player: 'red' },
    { type: 'chariot', player: 'red' },
  ],
];
