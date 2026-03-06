import { Piece, Move, Player, BOARD_WIDTH, BOARD_HEIGHT } from './types';
import { getValidMoves, makeMove, isCheck, isCheckmate, findGeneral } from './rules';

// Piece values for evaluation
const PIECE_VALUES: Record<string, number> = {
  general: 10000,
  chariot: 1000,
  cannon: 500,
  horse: 450,
  elephant: 250,
  advisor: 250,
  soldier: 100,
};

function evaluate(board: (Piece | null)[][], player: Player): number {
  let score = 0;
  
  // Material and Position
  for (let y = 0; y < BOARD_HEIGHT; y++) {
    for (let x = 0; x < BOARD_WIDTH; x++) {
      const piece = board[y][x];
      if (piece) {
        let val = PIECE_VALUES[piece.type] || 0;
        
        // Simple position bonus for soldiers
        if (piece.type === 'soldier') {
             // Flip Y for black (AI)
             // If player is red, y=0 is top (Black base). 
             // If piece is red, small y is good.
             // If piece is black, large y is good.
             
             const isRedPiece = piece.player === 'red';
             const relativeY = isRedPiece ? y : 9 - y;
             
             // 0-4 is opponent side for Red (y starts at 0)
             // Wait, standard board: 0-4 is Black side, 5-9 is Red side.
             // Red soldier at y=3 is across river.
             
             // Logic:
             // Red Soldier: y < 5 is good.
             // Black Soldier: y > 4 is good.
             
             const crossedRiver = isRedPiece ? y <= 4 : y >= 5;
             const deep = isRedPiece ? y <= 2 : y >= 7;
             
             if (crossedRiver) val += 30;
             if (deep) val += 20;
             
             // Bonus for being close to general column (3-5)
             if (crossedRiver && x >= 3 && x <= 5) val += 20;
        }

        // Central Cannon bonus
        if (piece.type === 'cannon') {
            if (x === 4) val += 20;
        }

        if (piece.player === player) {
          score += val;
        } else {
          score -= val;
        }
      }
    }
  }

  return score;
}

export async function getBestMove(
  board: (Piece | null)[][], 
  player: Player, 
  depth: number
): Promise<Move | null> {
  const moves = getValidMoves(board, player);

  if (moves.length === 0) return null;

  // Sort moves to improve pruning (captures first)
  moves.sort((a, b) => {
      const valA = a.captured ? PIECE_VALUES[a.captured.type] : 0;
      const valB = b.captured ? PIECE_VALUES[b.captured.type] : 0;
      return valB - valA;
  });

  let bestMove: Move | null = null;
  let maxEval = -Infinity;
  let alpha = -Infinity;
  let beta = Infinity;

  // Iterate root moves with async yield to keep UI responsive
  for (const move of moves) {
      // Yield to event loop
      await new Promise(resolve => setTimeout(resolve, 0));

      const nextBoard = makeMove(board, move);
      // We are maximizing, so next is minimizing
      const evalResult = minimax(nextBoard, depth - 1, alpha, beta, false, player);
      
      if (evalResult > maxEval) {
          maxEval = evalResult;
          bestMove = move;
      }
      alpha = Math.max(alpha, evalResult);
      // Beta cutoff at root? No, beta is Infinity initially.
  }

  return bestMove;
}

function minimax(
  board: (Piece | null)[][], 
  depth: number, 
  alpha: number, 
  beta: number, 
  isMaximizing: boolean,
  player: Player
): number {
  if (depth === 0) {
    return evaluate(board, player);
  }

  const currentPlayer = isMaximizing ? player : (player === 'red' ? 'black' : 'red');
  const moves = getValidMoves(board, currentPlayer);

  if (moves.length === 0) {
    // Checkmate or Stalemate
    // If we are minimizing (opponent turn) and they have no moves, it means we won (Checkmate/Stalemate)
    // If we are maximizing (our turn) and we have no moves, we lost.
    return isMaximizing ? -100000 : 100000;
  }

  // Move ordering (captures first)
  // Optimization: Only sort at higher depths to save time? 
  // For now, simple sort.
  if (depth > 1) {
    moves.sort((a, b) => {
        const valA = a.captured ? PIECE_VALUES[a.captured.type] : 0;
        const valB = b.captured ? PIECE_VALUES[b.captured.type] : 0;
        return valB - valA;
    });
  }

  if (isMaximizing) {
    let maxEval = -Infinity;
    for (const move of moves) {
      const nextBoard = makeMove(board, move);
      const evalResult = minimax(nextBoard, depth - 1, alpha, beta, false, player);
      maxEval = Math.max(maxEval, evalResult);
      alpha = Math.max(alpha, evalResult);
      if (beta <= alpha) break;
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (const move of moves) {
      const nextBoard = makeMove(board, move);
      const evalResult = minimax(nextBoard, depth - 1, alpha, beta, true, player);
      minEval = Math.min(minEval, evalResult);
      beta = Math.min(beta, evalResult);
      if (beta <= alpha) break;
    }
    return minEval;
  }
}
