import React from 'react';
import { motion } from 'framer-motion';
import { useTaskQueue } from '../../hooks/useTaskQueue';
import { ListTodo, ArrowRight, CheckSquare, Square } from 'lucide-react';
import { useGameStore } from '../../store/gameStore';

interface TaskHUDProps {
  onOpenDashboard: () => void;
}

export const TaskHUD: React.FC<TaskHUDProps> = ({ onOpenDashboard }) => {
  const { taskQueue } = useTaskQueue();
  const { completeGoal, toggleSubGoal } = useGameStore();
  
  // HUD Context Logic:
  // 1. Take top 3 priority goals
  // 2. If a goal has sub-goals, show its sub-goals instead of just the main goal title (or expand it)
  // To keep it simple but contextual:
  // Show Goal Title. If it has unfinished sub-goals, list top 2 unifinished sub-goals under it.
  
  const topTasks = taskQueue.slice(0, 3);

  if (topTasks.length === 0) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed bottom-6 right-6 z-40 flex flex-col items-end pointer-events-none"
    >
      <div className="bg-slate-900/90 backdrop-blur-md border border-white/10 rounded-2xl shadow-2xl p-4 w-80 pointer-events-auto">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-white font-bold text-sm flex items-center gap-2">
            <ListTodo size={16} className="text-indigo-400" />
            Next Objectives
          </h3>
          <button 
            onClick={onOpenDashboard}
            className="text-xs text-white/50 hover:text-white flex items-center gap-1 transition"
          >
            View All <ArrowRight size={12} />
          </button>
        </div>

        <div className="space-y-3">
          {topTasks.map((item, index) => {
            const unfinishedSub = item.goal.subGoals?.filter(s => !s.isCompleted) || [];
            const hasSub = unfinishedSub.length > 0;

            return (
                <div key={item.goal.id} className="group">
                    {/* Main Goal Header */}
                    <div className="flex items-start gap-2 mb-1">
                        {!hasSub && (
                            <button 
                                onClick={() => completeGoal(item.goal.id)}
                                className="mt-0.5 text-white/20 hover:text-green-400 transition shrink-0"
                            >
                                <div className="w-4 h-4 rounded-sm border border-current flex items-center justify-center">
                                    {/* Checkbox */}
                                </div>
                            </button>
                        )}
                        <div className="min-w-0">
                            <div className={`text-sm font-medium leading-tight ${hasSub ? 'text-indigo-200' : 'text-white/90'}`}>
                                {item.goal.content}
                            </div>
                            {item.root && (
                                <div className="text-[10px] text-white/40 truncate mt-0.5">
                                {item.root.content}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Contextual Sub-tasks */}
                    {hasSub && (
                        <div className="pl-6 space-y-1">
                            {unfinishedSub.slice(0, 3).map(sg => (
                                <div key={sg.id} className="flex items-center gap-2 text-xs text-white/70">
                                    <button 
                                        onClick={() => toggleSubGoal(item.goal.id, sg.id)}
                                        className="hover:text-white transition shrink-0"
                                    >
                                        <Square size={12} />
                                    </button>
                                    <span className="truncate">{sg.content}</span>
                                </div>
                            ))}
                            {unfinishedSub.length > 3 && (
                                <div className="text-[10px] text-white/30 pl-5">
                                    + {unfinishedSub.length - 3} more...
                                </div>
                            )}
                        </div>
                    )}
                </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
};
