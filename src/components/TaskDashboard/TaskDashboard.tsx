import React, { useState } from 'react';
import { Reorder, useDragControls, motion, AnimatePresence } from 'framer-motion';
import { useTaskQueue, TaskItem } from '../../hooks/useTaskQueue';
import { X, CheckCircle, GripVertical, ArrowUpCircle, ChevronDown, ChevronRight, CheckSquare, Square, Plus } from 'lucide-react';
import { useGameStore } from '../../store/gameStore';

interface TaskDashboardProps {
  isOpen: boolean;
  onClose: () => void;
}

const PriorityBadge = ({ priority }: { priority: string }) => {
  const colors = {
    'P0': 'bg-red-500/20 text-red-400 border-red-500/50',
    'P1': 'bg-amber-500/20 text-amber-400 border-amber-500/50',
    'P2': 'bg-blue-500/20 text-blue-400 border-blue-500/50',
  };
  return (
    <span className={`px-2 py-0.5 rounded text-xs border ${colors[priority as keyof typeof colors] || colors['P2']}`}>
      {priority}
    </span>
  );
};

const TaskRow = ({ item, onClose }: { item: TaskItem, onClose: () => void }) => {
    const controls = useDragControls();
    const { completeGoal, setGoalPriority, setFocusedGoalId, addSubGoal, toggleSubGoal, deleteSubGoal } = useGameStore();
    const [isExpanded, setIsExpanded] = useState(false);
    const [newSubTask, setNewSubTask] = useState('');

    const handleAddSub = (e: React.FormEvent) => {
        e.preventDefault();
        if (newSubTask.trim()) {
            addSubGoal(item.goal.id, newSubTask);
            setNewSubTask('');
        }
    };

    return (
        <Reorder.Item 
            value={item}
            className="bg-white/5 border border-white/10 rounded-lg flex flex-col group hover:bg-white/10 transition select-none relative overflow-hidden"
            dragListener={false}
            dragControls={controls}
            whileDrag={{ 
                scale: 1.0, 
                boxShadow: "0 8px 15px -3px rgb(0 0 0 / 0.5)",
                zIndex: 50,
                cursor: "grabbing"
            }}
            layout
            transition={{
                type: "spring",
                stiffness: 600,
                damping: 30,
                mass: 0.5
            }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
        >
            <div className="flex items-center gap-4 p-3">
                {/* Drag Handle */}
                <div 
                    className="cursor-grab active:cursor-grabbing p-2 text-white/20 hover:text-white/50 touch-none"
                    onPointerDown={(e) => controls.start(e)}
                >
                    <GripVertical size={18} />
                </div>

                {/* Expand Toggle */}
                <button 
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="text-white/30 hover:text-white transition"
                >
                    {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                </button>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <PriorityBadge priority={item.goal.priority} />
                        {item.root && (
                            <span 
                                className="text-[10px] uppercase tracking-wider font-bold text-white/40 bg-white/5 px-1.5 py-0.5 rounded cursor-pointer hover:bg-white/10 hover:text-white/60 transition"
                                onClick={() => {
                                    setFocusedGoalId(item.root!.id);
                                    onClose();
                                }}
                            >
                                {item.root.content}
                            </span>
                        )}
                        {item.goal.subGoals?.length > 0 && (
                            <span className="text-[10px] text-white/30">
                                {item.goal.subGoals.filter(s => s.isCompleted).length}/{item.goal.subGoals.length}
                            </span>
                        )}
                    </div>
                    <div className="text-white/90 truncate font-medium">
                        {item.goal.content}
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <select 
                        className="bg-black/40 border border-white/10 rounded text-xs text-white/60 px-2 py-1 outline-none focus:border-white/30"
                        value={item.goal.priority}
                        onChange={(e) => setGoalPriority(item.goal.id, e.target.value as any)}
                    >
                        <option value="P0">P0</option>
                        <option value="P1">P1</option>
                        <option value="P2">P2</option>
                    </select>
                </div>
            </div>

            {/* Sub-goals Section */}
            <AnimatePresence>
                {isExpanded && (
                    <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t border-white/5 bg-black/20"
                    >
                        <div className="p-3 pl-12 space-y-2">
                            {(item.goal.subGoals || []).map(sg => (
                                <div key={sg.id} className="flex items-center gap-3 text-sm group/sub">
                                    <button 
                                        onClick={() => toggleSubGoal(item.goal.id, sg.id)}
                                        className={`transition ${sg.isCompleted ? 'text-green-400' : 'text-white/20 hover:text-white'}`}
                                    >
                                        {sg.isCompleted ? <CheckSquare size={16} /> : <Square size={16} />}
                                    </button>
                                    <span className={`flex-1 ${sg.isCompleted ? 'line-through text-white/30' : 'text-white/80'}`}>
                                        {sg.content}
                                    </span>
                                    <button 
                                        onClick={() => deleteSubGoal(item.goal.id, sg.id)}
                                        className="opacity-0 group-hover/sub:opacity-100 text-white/20 hover:text-red-400 transition"
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                            ))}
                            
                            <form onSubmit={handleAddSub} className="flex gap-2 mt-2">
                                <input 
                                    type="text" 
                                    value={newSubTask}
                                    onChange={(e) => setNewSubTask(e.target.value)}
                                    placeholder="Add sub-task..."
                                    className="flex-1 bg-white/5 border border-white/10 rounded px-2 py-1 text-xs text-white placeholder:text-white/20 focus:outline-none focus:border-white/30 transition"
                                />
                                <button type="submit" className="p-1 rounded bg-white/10 hover:bg-white/20 text-white/50 hover:text-white transition">
                                    <Plus size={14} />
                                </button>
                            </form>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </Reorder.Item>
    );
};

export const TaskDashboard: React.FC<TaskDashboardProps> = ({ isOpen, onClose }) => {
  const { taskQueue, updateOrder } = useTaskQueue();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] bg-slate-900/95 backdrop-blur-xl flex flex-col animate-in fade-in duration-200">
      {/* Header */}
      <div className="h-16 border-b border-white/10 flex items-center justify-between px-6 bg-black/20">
        <h2 className="text-xl font-bold text-white flex items-center gap-3">
          <div className="w-2 h-6 bg-indigo-500 rounded-full" />
          Global Mission Control
          <span className="text-sm font-normal text-white/40 ml-2">
            {taskQueue.length} Active Tasks
          </span>
        </h2>
        <button 
          onClick={onClose}
          className="p-2 hover:bg-white/10 rounded-full text-white/50 hover:text-white transition"
        >
          <X size={24} />
        </button>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto">
          <Reorder.Group axis="y" values={taskQueue} onReorder={updateOrder} className="space-y-2">
            {taskQueue.length === 0 ? (
                <div className="text-center text-white/30 py-20 italic">
                    All systems nominal. No active tasks.
                </div>
            ) : (
                taskQueue.map((item) => (
                    <TaskRow key={item.goal.id} item={item} onClose={onClose} />
                ))
            )}
          </Reorder.Group>
        </div>
      </div>
      
      <div className="h-12 border-t border-white/10 bg-black/20 flex items-center justify-center text-xs text-white/30">
         Drag handle to reorder • Priority P0 tasks appear red
      </div>
    </div>
  );
};
