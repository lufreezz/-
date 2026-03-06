import { Piece, Position, Move, Player, BOARD_WIDTH, BOARD_HEIGHT } from './types';

export function isValidPos(p: Position): boolean {
  return p.x >= 0 && p.x < BOARD_WIDTH && p.y >= 0 && p.y < BOARD_HEIGHT;
}

export function isSamePos(p1: Position, p2: Position): boolean {
  return p1.x === p2.x && p1.y === p2.y;
}

export function getPiece(board: (Piece | null)[][], p: Position): Piece | null {
  if (!isValidPos(p)) return null;
  return board[p.y][p.x];
}

export function cloneBoard(board: (Piece | null)[][]): (Piece | null)[][] {
  return board.map(row => row.map(piece => (piece ? { ...piece } : null)));
}

export function makeMove(board: (Piece | null)[][], move: Move): (Piece | null)[][] {
  const newBoard = cloneBoard(board);
  const piece = getPiece(newBoard, move.from);
  if (!piece) return newBoard;

  newBoard[move.to.y][move.to.x] = piece;
  newBoard[move.from.y][move.from.x] = null;
  return newBoard;
}

// Check if a position is within the palace
function isInPalace(p: Position, player: Player): boolean {
  if (p.x < 3 || p.x > 5) return false;
  if (player === 'red') return p.y >= 7 && p.y <= 9;
  return p.y >= 0 && p.y <= 2;
}

// Check if a position is on the player's side of the river
function isHomeSide(p: Position, player: Player): boolean {
  if (player === 'red') return p.y >= 5;
  return p.y <= 4;
}

export function getValidMoves(board: (Piece | null)[][], player: Player): Move[] {
  const moves: Move[] = [];
  for (let y = 0; y < BOARD_HEIGHT; y++) {
    for (let x = 0; x < BOARD_WIDTH; x++) {
      const piece = board[y][x];
      if (piece && piece.player === player) {
        const from = { x, y };
        const potentialMoves = getPieceMoves(board, from, piece);
        // Filter out moves that leave the general in check (suicide)
        for (const move of potentialMoves) {
            // Optimization: We can do a quick check here, but full check validation is expensive.
            // For now, let's include all pseudo-legal moves and filter for check later if needed,
            // or implement a fast "isCheck" check.
            // In Xiangqi, you cannot leave your general facing the other general directly.
            // And you cannot make a move that leaves your general under attack.
            
            const nextBoard = makeMove(board, move);
            if (!isCheck(nextBoard, player)) {
                moves.push(move);
            }
        }
      }
    }
  }
  return moves;
}

function getPieceMoves(board: (Piece | null)[][], from: Position, piece: Piece): Move[] {
  const moves: Move[] = [];
  const { x, y } = from;

  const addMove = (tx: number, ty: number) => {
    const to = { x: tx, y: ty };
    if (!isValidPos(to)) return;
    const target = getPiece(board, to);
    if (target && target.player === piece.player) return; // Cannot capture own piece
    moves.push({ from, to, captured: target || undefined });
  };

  switch (piece.type) {
    case 'general': // King
      [[0, 1], [0, -1], [1, 0], [-1, 0]].forEach(([dx, dy]) => {
        const tx = x + dx;
        const ty = y + dy;
        if (isInPalace({ x: tx, y: ty }, piece.player)) {
          addMove(tx, ty);
        }
      });
      break;

    case 'advisor': // Guard
      [[1, 1], [1, -1], [-1, 1], [-1, -1]].forEach(([dx, dy]) => {
        const tx = x + dx;
        const ty = y + dy;
        if (isInPalace({ x: tx, y: ty }, piece.player)) {
          addMove(tx, ty);
        }
      });
      break;

    case 'elephant': // Bishop
      [[2, 2], [2, -2], [-2, 2], [-2, -2]].forEach(([dx, dy]) => {
        const tx = x + dx;
        const ty = y + dy;
        if (isValidPos({ x: tx, y: ty }) && isHomeSide({ x: tx, y: ty }, piece.player)) {
          // Check for blocking "eye"
          const eyeX = x + dx / 2;
          const eyeY = y + dy / 2;
          if (!getPiece(board, { x: eyeX, y: eyeY })) {
            addMove(tx, ty);
          }
        }
      });
      break;

    case 'horse': // Knight
      [[1, 2], [1, -2], [-1, 2], [-1, -2], [2, 1], [2, -1], [-2, 1], [-2, -1]].forEach(([dx, dy]) => {
        const tx = x + dx;
        const ty = y + dy;
        if (isValidPos({ x: tx, y: ty })) {
          // Check for blocking "leg"
          // If moving 2 vertically, leg is at (0, 1) relative direction
          // If moving 2 horizontally, leg is at (1, 0) relative direction
          const legX = x + (Math.abs(dx) === 2 ? dx / 2 : 0);
          const legY = y + (Math.abs(dy) === 2 ? dy / 2 : 0);
          if (!getPiece(board, { x: legX, y: legY })) {
            addMove(tx, ty);
          }
        }
      });
      break;

    case 'chariot': // Rook
      [[0, 1], [0, -1], [1, 0], [-1, 0]].forEach(([dx, dy]) => {
        let i = 1;
        while (true) {
          const tx = x + dx * i;
          const ty = y + dy * i;
          if (!isValidPos({ x: tx, y: ty })) break;
          const target = getPiece(board, { x: tx, y: ty });
          if (!target) {
            addMove(tx, ty);
          } else {
            if (target.player !== piece.player) addMove(tx, ty);
            break;
          }
          i++;
        }
      });
      break;

    case 'cannon':
      [[0, 1], [0, -1], [1, 0], [-1, 0]].forEach(([dx, dy]) => {
        let i = 1;
        let jumped = false;
        while (true) {
          const tx = x + dx * i;
          const ty = y + dy * i;
          if (!isValidPos({ x: tx, y: ty })) break;
          const target = getPiece(board, { x: tx, y: ty });
          if (!jumped) {
            if (!target) {
              addMove(tx, ty);
            } else {
              jumped = true;
            }
          } else {
            if (target) {
              if (target.player !== piece.player) addMove(tx, ty);
              break;
            }
          }
          i++;
        }
      });
      break;

    case 'soldier': // Pawn
      const forward = piece.player === 'red' ? -1 : 1;
      // Move forward
      const tx = x;
      const ty = y + forward;
      if (isValidPos({ x: tx, y: ty })) addMove(tx, ty);

      // If crossed river, can move sideways
      if (!isHomeSide(from, piece.player)) {
        [[1, 0], [-1, 0]].forEach(([dx, dy]) => {
          const sx = x + dx;
          const sy = y + dy; // dy is 0
          if (isValidPos({ x: sx, y: sy })) addMove(sx, sy);
        });
      }
      break;
  }

  return moves;
}

export function findGeneral(board: (Piece | null)[][], player: Player): Position | null {
  for (let y = 0; y < BOARD_HEIGHT; y++) {
    for (let x = 0; x < BOARD_WIDTH; x++) {
      const piece = board[y][x];
      if (piece && piece.type === 'general' && piece.player === player) {
        return { x, y };
      }
    }
  }
  return null;
}

// Check if the player is currently in check
export function isCheck(board: (Piece | null)[][], player: Player): boolean {
  const generalPos = findGeneral(board, player);
  if (!generalPos) return true; // Should not happen, but if general is missing, it's lost

  // 1. Check for "Flying General" rule
  // Generals cannot face each other without pieces in between
  const opponent = player === 'red' ? 'black' : 'red';
  const opponentGeneral = findGeneral(board, opponent);
  if (opponentGeneral && generalPos.x === opponentGeneral.x) {
    let hasBlocker = false;
    const minY = Math.min(generalPos.y, opponentGeneral.y);
    const maxY = Math.max(generalPos.y, opponentGeneral.y);
    for (let y = minY + 1; y < maxY; y++) {
      if (board[y][generalPos.x]) {
        hasBlocker = true;
        break;
      }
    }
    if (!hasBlocker) return true; // Flying general kill
  }

  // 2. Check if any opponent piece can attack the general
  // We can reverse logic: pretend the general is a piece of each type and see if it hits an enemy of that type
  // Or just iterate all enemy pieces. Iterating enemies is safer for complex logic like Cannon/Horse.
  
  for (let y = 0; y < BOARD_HEIGHT; y++) {
    for (let x = 0; x < BOARD_WIDTH; x++) {
      const piece = board[y][x];
      if (piece && piece.player !== player) {
        // Get pseudo-valid moves for this enemy piece (ignoring self-check for the enemy)
        // We need a raw move generator that doesn't call isCheck recursively
        const moves = getPieceMoves(board, { x, y }, piece);
        for (const move of moves) {
          if (isSamePos(move.to, generalPos)) return true;
        }
      }
    }
  }

  return false;
}

// Determine game status: 'playing', 'checkmate', 'stalemate'
// In Xiangqi, having no legal moves is a LOSS (Stalemate = Loss), unlike Western Chess.
export function getGameStatus(board: (Piece | null)[][], player: Player): 'playing' | 'loss' {
    const moves = getValidMoves(board, player);
    if (moves.length === 0) {
        return 'loss'; // Checkmate OR Stalemate (both are loss)
    }
    return 'playing';
}

export function isCheckmate(board: (Piece | null)[][], player: Player): boolean {
    return getGameStatus(board, player) === 'loss';
}
