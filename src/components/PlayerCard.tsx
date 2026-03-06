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
    <div className="relative w-full max-w-[400px] mx-auto">
      {/* Wooden Plank Container */}
      <div className={`
        relative bg-[#e3c08d] rounded-xl p-2 flex items-center shadow-lg border-b-4 border-r-4 border-[#b08d55]
        ${isActive ? 'ring-2 ring-yellow-400' : ''}
      `}
      style={{
        boxShadow: '0 4px 6px rgba(0,0,0,0.3), inset 0 2px 4px rgba(255,255,255,0.3)'
      }}
      >
        {/* Wood Grain Texture Overlay (Optional, simplified with CSS) */}
        
        {/* Left: Avatar Group */}
        <div className="flex flex-col items-center mr-3 z-10 -ml-1">
          <div className="w-14 h-14 rounded-lg bg-[#a3c2e0] border-2 border-[#5c3a1e] flex items-center justify-center overflow-hidden shadow-inner">
             {/* Simple Avatar Graphic */}
             {avatar.length > 2 ? (
                 <img src={avatar} alt={name} className="w-full h-full object-cover" />
             ) : (
                 <span className="text-2xl">👤</span>
             )}
          </div>
          <div className="bg-[#e3c08d] border border-[#8b5a2b] px-2 rounded-full -mt-2 z-20 text-[10px] font-bold text-[#5c3a1e] shadow-sm">
            {name}
          </div>
        </div>

        {/* Right: Info Area */}
        <div className="flex-1 flex items-center justify-between gap-2">
            
            {/* Rank / Title Box - REMOVED, replaced with simple spacer or status */}
            <div 
                onClick={onRankClick}
                className={`flex-1 bg-[#bc9e6c] rounded-lg h-10 flex items-center justify-center shadow-inner border-b border-white/20 border-t border-black/10 ${onRankClick ? 'cursor-pointer hover:bg-[#c4a674] active:scale-95 transition-all' : ''}`}
            >
                {isThinking ? (
                    <div className="flex items-center justify-center gap-2 text-[#5c3a1e] font-bold animate-pulse">
                        <Brain size={16} />
                        <span>思考中...</span>
                    </div>
                ) : (
                    <span className="text-[#5c3a1e] font-bold text-lg tracking-widest opacity-80">{rank}</span>
                )}
            </div>

            {/* Timer Box */}
            <div className="w-24 bg-[#8b5a2b] rounded-lg h-10 flex items-center justify-center shadow-inner border-b border-white/10 border-t border-black/20">
                <span className="text-[#f0d0a0] font-mono text-xl font-bold tracking-wider">
                    {formatTime(timer)}
                </span>
            </div>
        </div>
      </div>

      {/* Controls (Hanging below the plank for human player) */}
      {showControls && (
        <div className="flex justify-center gap-4 mt-2">
            <button 
                onClick={onUndo}
                className="bg-[#f4e4bc] text-[#8b5a2b] text-xs font-bold py-1 px-4 rounded-full shadow-md border-b-2 border-[#d4c49c] active:translate-y-0.5 active:border-b-0 transition-all"
            >
                撤销
            </button>
            <button 
                onClick={onHint}
                className="bg-[#f4e4bc] text-[#8b5a2b] text-xs font-bold py-1 px-4 rounded-full shadow-md border-b-2 border-[#d4c49c] active:translate-y-0.5 active:border-b-0 transition-all"
            >
                提示
            </button>
        </div>
      )}
    </div>
  );
};
