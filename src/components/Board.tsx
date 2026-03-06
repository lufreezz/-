import React from 'react';
import { Piece, Position } from '../game/types';
import { motion } from 'motion/react';

interface PieceProps {
  piece: Piece;
  selected: boolean;
  lastMoveDest?: boolean;
}

const PIECE_LABELS: Record<string, Record<string, string>> = {
  red: {
    general: '帅', advisor: '仕', elephant: '相', horse: '马', chariot: '车', cannon: '炮', soldier: '兵',
  },
  black: {
    general: '将', advisor: '士', elephant: '象', horse: '马', chariot: '车', cannon: '炮', soldier: '卒',
  },
};

const PieceComponent: React.FC<PieceProps> = ({ piece, selected, lastMoveDest }) => {
  const isRed = piece.player === 'red';
  const ringColor = isRed ? '#b91c1c' : '#2c3e50'; // Red or Dark Blue/Black
  const textColor = isRed ? '#b91c1c' : '#000000';
  
  return (
    <div
      className={`
        w-full h-full rounded-full flex items-center justify-center relative
        ${selected ? 'z-20 scale-110' : ''} 
      `}
      style={{
          // Main Body (Outer Ring)
          backgroundColor: ringColor,
          boxShadow: '0 4px 6px rgba(0,0,0,0.4), 0 1px 2px rgba(0,0,0,0.5)',
          transition: 'transform 0.1s'
      }}
    >
      {/* Inner Wood Face */}
      <div 
        className="absolute rounded-full flex items-center justify-center"
        style={{
            top: '8%', left: '8%', right: '8%', bottom: '8%', // Creates the ring thickness
            backgroundColor: '#eecfa1', // Light wood color
            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3)', // Inset shadow for depth
            border: '1px solid rgba(0,0,0,0.1)'
        }}
      >
          {/* Character */}
          <span 
              className="font-bold font-serif select-none leading-none"
              style={{ 
                  fontFamily: '"KaiTi", "STKaiti", "SimKai", "MingLiU", serif',
                  fontSize: 'clamp(16px, 5vw, 28px)', // Responsive font size
                  color: textColor,
                  textShadow: '0 1px 0 rgba(255,255,255,0.5)'
              }}
          >
            {PIECE_LABELS[piece.player][piece.type]}
          </span>
      </div>

      {/* Selection Glow */}
      {selected && (
          <div className="absolute inset-0 rounded-full ring-4 ring-yellow-400 animate-pulse"></div>
      )}
      
      {/* Last Move Marker - Subtle Highlight instead of green dot */}
      {lastMoveDest && !selected && (
          <div className="absolute inset-0 rounded-full ring-2 ring-blue-400/70 shadow-[0_0_10px_rgba(96,165,250,0.6)]"></div>
      )}
    </div>
  );
};

interface BoardProps {
  board: (Piece | null)[][];
  onSquareClick: (pos: Position) => void;
  selectedPos: Position | null;
  validMoves: Position[];
  lastMove: { from: Position; to: Position } | null;
}

export const Board: React.FC<BoardProps> = ({ board, onSquareClick, selectedPos, validMoves, lastMove }) => {
  const VIEW_WIDTH = 900;
  const VIEW_HEIGHT = 1000;
  const MARGIN_X = 50;
  const MARGIN_Y = 50;
  const CELL_SIZE = 100;

  const getPosStyle = (x: number, y: number) => {
    const posX = MARGIN_X + x * CELL_SIZE;
    const posY = MARGIN_Y + y * CELL_SIZE;
    return {
      left: `${(posX / VIEW_WIDTH) * 100}%`,
      top: `${(posY / VIEW_HEIGHT) * 100}%`,
    };
  };

  return (
    <div className="relative w-full max-w-[450px] aspect-[9/10] mx-auto select-none p-2">
      
      {/* Board Container (The Wooden Slab) */}
      <div className="absolute inset-0 bg-[#deb887] rounded-xl shadow-2xl overflow-hidden border-b-8 border-r-8 border-[#8b5a2b]">
         {/* Wood Texture Pattern */}
         <div className="absolute inset-0 opacity-20" 
              style={{ 
                  backgroundImage: `repeating-linear-gradient(45deg, #cd853f 0, #cd853f 1px, transparent 0, transparent 50%)`,
                  backgroundSize: '20px 20px'
              }}>
         </div>
         {/* Inner Bevel */}
         <div className="absolute inset-2 border-2 border-[#8b5a2b]/30 rounded-lg pointer-events-none"></div>
      </div>

      {/* Grid Lines (SVG) */}
      <svg viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`} className="absolute inset-0 w-full h-full pointer-events-none z-0">
        <g stroke="#5c3a1e" strokeWidth="4" strokeLinecap="round">
          {/* Horizontal Lines */}
          {Array.from({ length: 10 }).map((_, i) => {
            const y = MARGIN_Y + i * CELL_SIZE;
            return <line key={`h-${i}`} x1={MARGIN_X} y1={y} x2={VIEW_WIDTH - MARGIN_X} y2={y} />;
          })}
          
          {/* Vertical Lines */}
          {Array.from({ length: 9 }).map((_, i) => {
            const x = MARGIN_X + i * CELL_SIZE;
            // Full lines for edges
            if (i === 0 || i === 8) {
                return <line key={`v-${i}`} x1={x} y1={MARGIN_Y} x2={x} y2={VIEW_HEIGHT - MARGIN_Y} />;
            } else {
                return (
                    <React.Fragment key={`v-${i}`}>
                        <line x1={x} y1={MARGIN_Y} x2={x} y2={MARGIN_Y + 4 * CELL_SIZE} />
                        <line x1={x} y1={MARGIN_Y + 5 * CELL_SIZE} x2={x} y2={VIEW_HEIGHT - MARGIN_Y} />
                    </React.Fragment>
                );
            }
          })}

          {/* Palaces */}
          <line x1={MARGIN_X + 3 * CELL_SIZE} y1={MARGIN_Y} x2={MARGIN_X + 5 * CELL_SIZE} y2={MARGIN_Y + 2 * CELL_SIZE} />
          <line x1={MARGIN_X + 5 * CELL_SIZE} y1={MARGIN_Y} x2={MARGIN_X + 3 * CELL_SIZE} y2={MARGIN_Y + 2 * CELL_SIZE} />
          <line x1={MARGIN_X + 3 * CELL_SIZE} y1={VIEW_HEIGHT - MARGIN_Y} x2={MARGIN_X + 5 * CELL_SIZE} y2={VIEW_HEIGHT - MARGIN_Y - 2 * CELL_SIZE} />
          <line x1={MARGIN_X + 5 * CELL_SIZE} y1={VIEW_HEIGHT - MARGIN_Y} x2={MARGIN_X + 3 * CELL_SIZE} y2={VIEW_HEIGHT - MARGIN_Y - 2 * CELL_SIZE} />
        </g>

        {/* River Text - Stylized */}
        <text x={VIEW_WIDTH * 0.25} y={VIEW_HEIGHT * 0.5} textAnchor="middle" dominantBaseline="middle" fontSize="50" fontFamily="serif" fill="#5c3a1e" fontWeight="bold" letterSpacing="10">相帅</text>
        <text x={VIEW_WIDTH * 0.75} y={VIEW_HEIGHT * 0.5} textAnchor="middle" dominantBaseline="middle" fontSize="50" fontFamily="serif" fill="#5c3a1e" fontWeight="bold" letterSpacing="10">榜座</text>

        {/* Intersection Markers (The little corner bits) */}
        <g stroke="#5c3a1e" strokeWidth="3" fill="none">
           {[
             [0, 3], [2, 3], [4, 3], [6, 3], [8, 3],
             [0, 6], [2, 6], [4, 6], [6, 6], [8, 6],
             [1, 2], [7, 2], [1, 7], [7, 7]
           ].map(([x, y], idx) => {
             const cx = MARGIN_X + x * CELL_SIZE;
             const cy = MARGIN_Y + y * CELL_SIZE;
             const gap = 8;
             const len = 15;
             
             const paths = [];
             if (x > 0) paths.push(`M ${cx - gap - len} ${cy - gap} L ${cx - gap} ${cy - gap} L ${cx - gap} ${cy - gap - len}`);
             if (x < 8) paths.push(`M ${cx + gap + len} ${cy - gap} L ${cx + gap} ${cy - gap} L ${cx + gap} ${cy - gap - len}`);
             if (x > 0) paths.push(`M ${cx - gap - len} ${cy + gap} L ${cx - gap} ${cy + gap} L ${cx - gap} ${cy + gap + len}`);
             if (x < 8) paths.push(`M ${cx + gap + len} ${cy + gap} L ${cx + gap} ${cy + gap} L ${cx + gap} ${cy + gap + len}`);
             
             return <path key={idx} d={paths.join(' ')} />;
           })}
        </g>
      </svg>

      {/* Interactive Layer */}
      <div className="absolute inset-0 z-10">
        {Array.from({ length: 10 }).map((_, y) => (
          Array.from({ length: 9 }).map((_, x) => {
            const posStyle = getPosStyle(x, y);
            const piece = board[y][x];
            const isValidMove = validMoves.some(p => p.x === x && p.y === y);
            
            return (
              <div
                key={`${x}-${y}`}
                className="absolute flex items-center justify-center"
                style={{
                  ...posStyle,
                  width: '13%', // Slightly larger touch target
                  height: '12%',
                  transform: 'translate(-50%, -50%)',
                  cursor: 'pointer',
                  zIndex: piece ? 20 : 10,
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  onSquareClick({ x, y });
                }}
              >
                {/* Valid Move Indicator - Simple Dot */}
                {isValidMove && !piece && (
                  <div className="w-4 h-4 bg-[#2ecc71] rounded-full shadow-sm ring-2 ring-white/50"></div>
                )}
                
                {/* Capture Indicator - Ring */}
                {isValidMove && piece && (
                   <div className="absolute inset-0 rounded-full border-4 border-[#e74c3c] animate-pulse z-30 scale-95"></div>
                )}

                {/* Piece */}
                {piece && (
                  <motion.div
                    className="w-[90%] h-[90%]"
                    layout
                    transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                  >
                    <PieceComponent 
                      piece={piece} 
                      selected={selectedPos?.x === x && selectedPos?.y === y}
                      lastMoveDest={lastMove?.to.x === x && lastMove?.to.y === y}
                    />
                  </motion.div>
                )}
              </div>
            );
          })
        ))}
      </div>
    </div>
  );
};
