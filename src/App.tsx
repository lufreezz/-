import React, { useState, useEffect, useRef } from 'react';
import { Board } from './components/Board';
import { PlayerCard } from './components/PlayerCard';
import { INITIAL_BOARD, Piece, Position, Move, Player, PieceType } from './game/types';
import { getValidMoves, makeMove, isCheck, getGameStatus, cloneBoard, getPiece } from './game/rules';
import { getBestMove } from './game/ai';
import { RotateCcw, Trophy, AlertTriangle, BookOpen, Settings, Brain, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Difficulty levels map to search depth
const LEVELS = {
  1: 2, // Very fast, shallow
  2: 3, // Standard
  3: 4, // Stronger
  4: 5, // Very strong
  5: 6, // Grandmaster (might be slow)
};

type GameStatus = 'playing' | 'checkmate' | 'draw';

export default function App() {
  const [board, setBoard] = useState<(Piece | null)[][]>(INITIAL_BOARD);
  const [turn, setTurn] = useState<Player>('red'); // Red usually starts
  const [selectedPos, setSelectedPos] = useState<Position | null>(null);
  const [validMoves, setValidMoves] = useState<Move[]>([]);
  const [lastMove, setLastMove] = useState<{ from: Position; to: Position } | null>(null);
  const [gameStatus, setGameStatus] = useState<GameStatus>('playing');
  const [winner, setWinner] = useState<Player | null>(null);
  
  // New State for UI
  const [history, setHistory] = useState<(Piece | null)[][][]>([]); // For Undo
  const [redTimer, setRedTimer] = useState(0); // Count up from 0
  const [blackTimer, setBlackTimer] = useState(0); // Count up from 0
  const [capturedRed, setCapturedRed] = useState<PieceType[]>([]); // Red pieces captured by Black
  const [capturedBlack, setCapturedBlack] = useState<PieceType[]>([]); // Black pieces captured by Red

  // AI Settings
  const [aiLevel, setAiLevel] = useState<number>(3);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [aiThinkingTime, setAiThinkingTime] = useState(0);
  const [checkWarning, setCheckWarning] = useState<string | null>(null);
  const [showRules, setShowRules] = useState(false);
  const [showGameOverModal, setShowGameOverModal] = useState(false);

  const aiWorkerRef = useRef<Worker | null>(null);
  const handleMoveRef = useRef<(move: Move) => void>(() => {});

  const LEVEL_NAMES: Record<number, string> = {
      1: "新手",
      2: "入门",
      3: "熟练",
      4: "大师",
      5: "宗师"
  };

  // Refs for timers
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const thinkingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize Worker
  useEffect(() => {
    aiWorkerRef.current = new Worker(new URL('./game/ai.worker.ts', import.meta.url), { type: 'module' });
    
    aiWorkerRef.current.onmessage = (e) => {
        const move = e.data;
        if (move) {
            handleMoveRef.current(move);
        } else {
            console.log("AI Resigns (No moves)");
            setGameStatus('checkmate');
            setWinner('red');
            setShowGameOverModal(true);
        }
        setIsAiThinking(false);
    };

    return () => {
        aiWorkerRef.current?.terminate();
    };
  }, []);

  // Update handleMoveRef whenever handleMove changes
  useEffect(() => {
      handleMoveRef.current = handleMove;
  }, [board, turn, history]); // Add dependencies that handleMove uses

  // Timer Logic
  useEffect(() => {
    if (gameStatus !== 'playing') {
        if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
        return;
    }

    // Clear existing intervals
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);

    timerIntervalRef.current = setInterval(() => {
        if (turn === 'red') {
            setRedTimer(prev => prev + 1);
        } else {
            setBlackTimer(prev => prev + 1);
        }
    }, 1000);

    return () => {
        if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [turn, gameStatus]);

  // Check for game over or check status
  useEffect(() => {
    const inCheck = isCheck(board, turn);
    const status = getGameStatus(board, turn);

    if (status === 'loss') {
      setGameStatus('checkmate'); // We use 'checkmate' state for any loss
      setWinner(turn === 'red' ? 'black' : 'red');
    } else if (inCheck) {
      setCheckWarning(turn === 'red' ? '将军! (Check!)' : 'AI is in check!');
    } else {
      setCheckWarning(null);
    }
  }, [board, turn]);

  // AI Turn Handler
  useEffect(() => {
    if (gameStatus !== 'playing') return;
    if (turn === 'black' && !isAiThinking) {
      // AI is Black
      makeAiMove();
    }
  }, [turn, gameStatus]);

  const makeAiMove = () => {
    setIsAiThinking(true);
    setAiThinkingTime(0); // Reset thinking time for new move
    
    // Use worker
    if (aiWorkerRef.current) {
        const depth = LEVELS[aiLevel as keyof typeof LEVELS] || 3;
        aiWorkerRef.current.postMessage({ board, player: 'black', depth });
    }
  };

  const handleSquareClick = (pos: Position) => {
    if (gameStatus !== 'playing' || turn === 'black' || isAiThinking) return;

    const piece = getPiece(board, pos);
    
    // If selecting own piece
    if (piece && piece.player === turn) {
      setSelectedPos(pos);
      // Calculate valid moves for this piece
      const allMoves = getValidMoves(board, turn);
      const pieceMoves = allMoves.filter(m => m.from.x === pos.x && m.from.y === pos.y);
      setValidMoves(pieceMoves);
      return;
    }

    // If moving to a valid square
    if (selectedPos) {
      const move = validMoves.find(m => m.to.x === pos.x && m.to.y === pos.y);
      if (move) {
        handleMove(move);
        setSelectedPos(null);
        setValidMoves([]);
      }
    }
  };

  const handleMove = (move: Move) => {
    // Save history before moving
    setHistory(prev => [...prev, cloneBoard(board)]);

    const newBoard = makeMove(board, move);
    
    // Handle Capture
    const capturedPiece = getPiece(board, move.to);
    if (capturedPiece) {
        if (capturedPiece.player === 'red') {
            setCapturedRed(prev => [...prev, capturedPiece.type]);
        } else {
            setCapturedBlack(prev => [...prev, capturedPiece.type]);
        }
    }

    setBoard(newBoard);
    setLastMove({ from: move.from, to: move.to });
    setTurn(prev => prev === 'red' ? 'black' : 'red');
  };

  const handleUndo = () => {
      if (history.length === 0 || turn === 'black' || isAiThinking) return;
      
      if (history.length >= 2) {
          const previousBoard = history[history.length - 2];
          setBoard(previousBoard);
          setHistory(prev => prev.slice(0, prev.length - 2));
          setTurn('red');
          setLastMove(null); 
          // Note: Captured pieces visual state is not reverted here for simplicity
      }
  };
  
  const handleHint = async () => {
      if (turn !== 'red' || isAiThinking) return;
      const move = await getBestMove(board, 'red', 3);
      if (move) {
          setSelectedPos(move.from);
          setValidMoves([move]);
      }
  };

  const resetGame = () => {
    setBoard(INITIAL_BOARD);
    setTurn('red');
    setGameStatus('playing');
    setWinner(null);
    setLastMove(null);
    setSelectedPos(null);
    setValidMoves([]);
    setCheckWarning(null);
    setIsAiThinking(false);
    setHistory([]);
    setRedTimer(0);
    setBlackTimer(0);
    setCapturedRed([]);
    setCapturedBlack([]);
  };

  return (
    <div className="min-h-screen relative overflow-hidden font-sans text-[#4a4a4a] select-none flex flex-col items-center justify-center">
      
      {/* Background - Park Scene */}
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-[#87CEEB] to-[#90EE90]">
         {/* Simple CSS shapes for trees/grass could go here, but gradient is a safe start */}
         <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-[#7CFC00] opacity-50 rounded-t-[50%] scale-150 translate-y-20"></div>
         <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-[#32CD32] opacity-60 rounded-t-[30%] scale-125 translate-y-10"></div>
      </div>

      {/* Main Content Container */}
      <div className="relative z-10 w-full max-w-[600px] h-full flex flex-col py-6 px-4">
         
         {/* Top: Players Area (Side by side) */}
         <div className="flex flex-row gap-2 mb-6">
            <div className="flex-1">
                <PlayerCard 
                    name="李老师" 
                    avatar="https://api.dicebear.com/7.x/avataaars/svg?seed=TeacherLi" 
                    timer={blackTimer} 
                    isActive={turn === 'black'} 
                    capturedPieces={capturedRed} 
                    playerColor="black"
                    isAi={true}
                    rank={LEVEL_NAMES[aiLevel]}
                    onRankClick={() => setShowRules(true)}
                    isThinking={isAiThinking}
                />
            </div>
            <div className="flex-1">
                <PlayerCard 
                    name="我" 
                    avatar="https://api.dicebear.com/7.x/avataaars/svg?seed=Player" 
                    timer={redTimer} 
                    isActive={turn === 'red'} 
                    capturedPieces={capturedBlack} 
                    playerColor="red"
                    showControls={true}
                    onUndo={handleUndo}
                    onHint={handleHint}
                />
            </div>
         </div>

         {/* Middle: Board */}
         <div className="flex-1 flex items-center justify-center">
            <Board 
                board={board} 
                onSquareClick={handleSquareClick}
                selectedPos={selectedPos}
                validMoves={validMoves.map(m => m.to)}
                lastMove={lastMove}
            />
         </div>

      </div>

      {/* Settings/Reset Floating Button (Top Right) */}
      <div className="absolute top-4 right-4 z-20 flex gap-2">
         <button onClick={() => setShowRules(true)} className="p-2 bg-white/80 rounded-full shadow-md hover:bg-white text-gray-700 transition-colors">
             <Settings size={20} />
         </button>
         <button onClick={resetGame} className="p-2 bg-white/80 rounded-full shadow-md hover:bg-white text-gray-700 transition-colors">
             <RotateCcw size={20} />
         </button>
      </div>

      {/* Check Warning Overlay */}
      <AnimatePresence>
        {checkWarning && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="fixed bottom-32 left-1/2 -translate-x-1/2 z-50 pointer-events-none"
          >
             <div className="bg-[#b91c1c] text-white text-lg font-bold px-6 py-2 rounded-full shadow-lg flex items-center gap-2 border-2 border-white">
                <AlertTriangle size={20} />
                {checkWarning}
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Settings / Rules Modal */}
      <AnimatePresence>
        {showRules && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm"
            onClick={() => setShowRules(false)}
          >
            <motion.div 
              initial={{ scale: 0.95, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 10 }}
              className="bg-[#fdf6e3] rounded-2xl p-6 max-w-sm w-full shadow-2xl border-4 border-[#8b5a2b] max-h-[80vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-[#5c3a1e]">设置 & 规则</h2>
                <button onClick={() => setShowRules(false)} className="p-2 hover:bg-[#e6c288] rounded-full text-[#5c3a1e] transition-colors">
                  <X size={24} />
                </button>
              </div>

              {/* Difficulty Settings */}
              <div className="mb-6">
                <h3 className="text-lg font-bold text-[#8b5a2b] mb-3 flex items-center gap-2">
                    <Brain size={18} />
                    AI 难度
                </h3>
                <div className="flex justify-between gap-2 bg-[#e6c288] p-2 rounded-xl shadow-inner">
                    {[1, 2, 3, 4, 5].map(lvl => (
                        <button
                            key={lvl}
                            onClick={() => setAiLevel(lvl)}
                            className={`
                                w-10 h-10 rounded-lg flex items-center justify-center font-bold text-lg transition-all
                                ${aiLevel === lvl 
                                    ? 'bg-[#b91c1c] text-white shadow-md scale-110' 
                                    : 'text-[#5c3a1e] hover:bg-[#d4b078]'
                                }
                            `}
                        >
                            {lvl}
                        </button>
                    ))}
                </div>
                <p className="text-xs text-[#8b5a2b]/80 mt-2 text-center font-bold">
                    {LEVEL_NAMES[aiLevel]}
                </p>
              </div>
              
              {/* Rules Text */}
              <div className="space-y-3 text-sm text-[#5c3a1e]/90 bg-[#e6c288]/30 p-4 rounded-xl border border-[#8b5a2b]/20">
                <h3 className="font-bold text-[#8b5a2b] flex items-center gap-2">
                    <BookOpen size={16} />
                    规则简介
                </h3>
                <ul className="list-disc pl-4 space-y-1">
                    <li><strong>红方先行</strong>，以将死对方"帅/将"为胜。</li>
                    <li><strong>马</strong>走日，<strong>象</strong>走田(不过河)。</li>
                    <li><strong>车</strong>直行，<strong>炮</strong>隔山打。</li>
                    <li><strong>兵</strong>过河前只能进，过河后可左右。</li>
                </ul>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Game Over Modal - Non-blocking */}
      <AnimatePresence>
        {showGameOverModal && (
          <motion.div 
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="fixed bottom-0 left-0 right-0 z-50 p-4 flex justify-center pointer-events-none"
          >
            <div className="bg-[#fdf6e3] rounded-2xl p-6 w-full max-w-sm shadow-2xl border-4 border-[#8b5a2b] pointer-events-auto flex flex-col items-center relative">
              
              {/* Close Button to view board */}
              <button 
                onClick={() => setShowGameOverModal(false)}
                className="absolute top-2 right-2 text-[#8b5a2b] hover:bg-[#e6c288] rounded-full p-1"
                title="查看棋局"
              >
                 <X size={20} />
              </button>

              <div className="w-16 h-16 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center mb-3 border-2 border-yellow-300">
                <Trophy size={32} />
              </div>
              
              <h2 className="text-xl font-bold text-[#5c3a1e] mb-1">
                {winner === 'red' ? '恭喜! 你赢了!' : '遗憾! AI 赢了!'}
              </h2>
              
              <div className="flex gap-3 w-full mt-4">
                  <button 
                    onClick={() => setShowGameOverModal(false)}
                    className="flex-1 py-2 bg-[#e6c288] text-[#5c3a1e] font-bold rounded-lg hover:bg-[#d4b078] transition-colors"
                  >
                    查看棋局
                  </button>
                  <button 
                    onClick={resetGame}
                    className="flex-1 py-2 bg-[#b91c1c] text-white font-bold rounded-lg hover:bg-[#991b1b] transition-colors shadow-md border-b-4 border-[#7f1d1d] active:border-b-0 active:translate-y-1"
                  >
                    再来一局
                  </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
