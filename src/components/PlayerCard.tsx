import React from 'react';
import { PieceType, Player } from '../game/types';
import { Brain } from 'lucide-react';

interface PlayerCardProps {
  name: string;
  avatar: string; // URL or text
  timer: number;
  isActive: boolean;
  capturedPieces: PieceType[];
  playerColor: Player;
  isAi?: boolean;
  onUndo?: () => void;
  onHint?: () => void;
  showControls?: boolean;
  rank?: string; // e.g. "宗师"
  onRankClick?: () => void;
  isThinking?: boolean;
  thinkingTime?: number;
}

export const PlayerCard: React.FC<PlayerCardProps> = ({
  name,
  avatar,
  timer,
  isActive,
  capturedPieces,
  playerColor,
  isAi,
  onUndo,
  onHint,
  showControls,
  rank = "宗师",
  onRankClick,
  isThinking,
  thinkingTime = 0
}) => {
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="relative w-full">
      {/* Wooden Plank Container */}
      <div className={`
        relative bg-[#e3c08d] rounded-xl p-1.5 flex items-center shadow-lg border-b-4 border-r-4 border-[#b08d55]
        ${isActive ? 'ring-2 ring-yellow-400' : ''}
      `}
      style={{
        boxShadow: '0 4px 6px rgba(0,0,0,0.3), inset 0 2px 4px rgba(255,255,255,0.3)'
      }}
      >
        {/* Left: Avatar Group */}
        <div className="flex flex-col items-center mr-2 z-10 -ml-1">
          <div className="w-10 h-10 rounded-lg bg-[#a3c2e0] border-2 border-[#5c3a1e] flex items-center justify-center overflow-hidden shadow-inner">
             {/* Simple Avatar Graphic */}
             {avatar.length > 2 ? (
                 <img src={avatar} alt={name} className="w-full h-full object-cover" />
             ) : (
                 <span className="text-xl">👤</span>
             )}
          </div>
          <div className="bg-[#e3c08d] border border-[#8b5a2b] px-1.5 rounded-full -mt-1.5 z-20 text-[8px] font-bold text-[#5c3a1e] shadow-sm whitespace-nowrap">
            {name}
          </div>
        </div>

        {/* Right: Info Area */}
        <div className="flex-1 flex flex-col gap-1">
            
            {/* Rank / Title Box */}
            <div 
                onClick={onRankClick}
                className={`w-full bg-[#bc9e6c] rounded h-6 flex items-center justify-center shadow-inner border-b border-white/20 border-t border-black/10 ${onRankClick ? 'cursor-pointer hover:bg-[#c4a674] active:scale-95 transition-all' : ''}`}
            >
                {isThinking ? (
                    <div className="flex items-center justify-center gap-1 text-[#5c3a1e] font-bold animate-pulse text-[10px]">
                        <Brain size={12} />
                        <span>思考中...</span>
                    </div>
                ) : (
                    <span className="text-[#5c3a1e] font-bold text-xs tracking-widest opacity-80">{rank}</span>
                )}
            </div>

            {/* Timer Box */}
            <div className="w-full bg-[#8b5a2b] rounded h-6 flex items-center justify-center shadow-inner border-b border-white/10 border-t border-black/20">
                <span className="text-[#f0d0a0] font-mono text-sm font-bold tracking-wider">
                    {formatTime(timer)}
                </span>
            </div>
        </div>
      </div>

      {/* Controls (Hanging below the plank for human player) */}
      {showControls && (
        <div className="flex justify-center gap-2 mt-1">
            <button 
                onClick={onUndo}
                className="bg-[#f4e4bc] text-[#8b5a2b] text-[10px] font-bold py-0.5 px-3 rounded-full shadow-md border-b-2 border-[#d4c49c] active:translate-y-0.5 active:border-b-0 transition-all"
            >
                撤销
            </button>
            <button 
                onClick={onHint}
                className="bg-[#f4e4bc] text-[#8b5a2b] text-[10px] font-bold py-0.5 px-3 rounded-full shadow-md border-b-2 border-[#d4c49c] active:translate-y-0.5 active:border-b-0 transition-all"
            >
                提示
            </button>
        </div>
      )}
    </div>
  );
};
