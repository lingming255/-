import React from 'react';
import { Goal } from '../../store/gameStore';
import { Sun, CheckCircle, Crosshair, Trash2 } from 'lucide-react';

interface GoalNodeProps {
  goal: Goal;
  isActive: boolean;
  isSelected: boolean;
  isTarget?: boolean;
  onToggleToday: () => void;
  onSetActive: () => void;
  onDelete: () => void;
  onUnlink: () => void;
}

export const GoalNode: React.FC<GoalNodeProps> = ({
  goal,
  isActive,
  isSelected,
  isTarget,
  onToggleToday,
  onSetActive,
  onDelete,
  onUnlink,
}) => {
  return (
    <div
      className={`absolute flex flex-col items-center group select-none touch-none`}
      style={{
        transform: `translate(${goal.position.x}px, ${goal.position.y}px)`,
        width: 220,
      }}
      data-type="node"
      data-id={goal.id}
      onContextMenu={(e) => {
         e.stopPropagation();
         e.preventDefault();
         if (goal.parentIds && goal.parentIds.length > 0) {
             onUnlink();
         }
      }}
    >
      {/* Node Card */}
      <div 
        className={`
          relative w-full p-4 rounded-xl backdrop-blur-md border transition-all duration-200
          ${goal.isCompleted ? 'bg-stone-800/80 border-stone-600' : 'bg-black/60 border-white/20'}
          ${isActive ? 'ring-2 ring-green-400 shadow-[0_0_20px_rgba(74,222,128,0.2)]' : ''}
          ${isSelected ? 'ring-1 ring-white' : ''}
          ${isTarget ? 'ring-2 ring-amber-400 scale-105 shadow-[0_0_20px_rgba(251,191,36,0.3)] bg-white/10' : ''}
          ${goal.isToday ? 'border-amber-400/80 shadow-[0_0_15px_rgba(251,191,36,0.2)]' : ''}
          hover:bg-black/80 cursor-move
        `}
      >
        {/* Header Icons */}
        <div className="flex justify-between items-start mb-2 opacity-0 group-hover:opacity-100 transition-opacity">
           <button 
             onClick={(e) => { e.stopPropagation(); onToggleToday(); }}
             onPointerDown={(e) => e.stopPropagation()} 
             className={`p-1 rounded-full hover:bg-white/10 transition ${goal.isToday ? 'text-amber-400' : 'text-white/20'}`}
             title="Toggle Today's Focus"
           >
             <Sun size={14} className={goal.isToday ? "fill-amber-400" : ""} />
           </button>
           
           <div className="flex gap-1">
             <button
               onClick={(e) => { 
                 e.stopPropagation(); 
                 // No confirmation as requested
                 onDelete(); 
               }}
               onPointerDown={(e) => e.stopPropagation()}
               className="p-1 rounded-full hover:bg-white/10 transition text-white/20 hover:text-red-400"
               title="Delete Goal"
             >
               <Trash2 size={14} />
             </button>
             {goal.isCompleted && <CheckCircle size={14} className="text-stone-500" />}
             <button
               onClick={(e) => { e.stopPropagation(); onSetActive(); }}
               onPointerDown={(e) => e.stopPropagation()}
               className={`p-1 rounded-full hover:bg-white/10 transition ${isActive ? 'text-green-400' : 'text-white/20'}`}
               title="Set as Active Goal"
             >
               <Crosshair size={14} />
             </button>
           </div>
        </div>
        
        {/* Always show Today icon if active, even if not hovering */}
        {goal.isToday && (
            <div className="absolute top-4 left-4 text-amber-400 pointer-events-none group-hover:opacity-0 transition-opacity">
                <Sun size={12} className="fill-amber-400" />
            </div>
        )}

        {/* Content */}
        <div className={`text-center font-light text-sm py-1 ${goal.isCompleted ? 'text-white/50 line-through' : 'text-white'}`}>
          {goal.content}
        </div>
        
        {/* Connection Handle (Bottom) */}
        <div 
            className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-8 h-8 flex items-center justify-center cursor-crosshair opacity-0 group-hover:opacity-100 transition z-10"
            title="Drag to link to child"
            data-type="handle"
            data-id={goal.id}
        >
            <div className="w-3 h-3 bg-white rounded-full border-2 border-black shadow-sm hover:scale-125 transition pointer-events-none" />
        </div>
        
         {/* Connection Target (Top) - Visual only */}
         <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-white/10 rounded-full" />
      </div>
    </div>
  );
};
