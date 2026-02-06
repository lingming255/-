import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft, Folder, Layout } from 'lucide-react';
import { Goal } from '../../types';
import { getRootGoals } from '../../utils/treeHelpers';

interface ProjectSidebarProps {
  goals: Goal[];
  onSelectProject: (id: string) => void;
}

export const ProjectSidebar: React.FC<ProjectSidebarProps> = ({ goals, onSelectProject }) => {
  const [isOpen, setIsOpen] = useState(true);
  const rootGoals = getRootGoals(goals);

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: -250, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -250, opacity: 0 }}
            className="absolute top-16 left-4 bottom-4 w-64 bg-slate-900/90 backdrop-blur-md border border-white/10 rounded-2xl shadow-xl z-40 overflow-hidden flex flex-col"
          >
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <h2 className="text-white font-medium flex items-center gap-2">
                <Layout size={18} className="text-blue-400" />
                Projects
              </h2>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-white/50 hover:text-white transition"
              >
                <ChevronLeft size={18} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {rootGoals.length === 0 ? (
                <div className="text-white/30 text-sm text-center py-8 italic">
                  No projects found.<br/>Create a root goal to start.
                </div>
              ) : (
                rootGoals.map(goal => (
                  <button
                    key={goal.id}
                    onClick={() => onSelectProject(goal.id)}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/5 text-white/80 hover:text-white transition flex items-center gap-2 group"
                  >
                    <Folder size={16} className="text-indigo-400 group-hover:text-indigo-300" />
                    <span className="truncate">{goal.content}</span>
                  </button>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!isOpen && (
        <motion.button
          initial={{ x: -50 }}
          animate={{ x: 0 }}
          onClick={() => setIsOpen(true)}
          className="absolute top-20 left-0 bg-slate-800 p-2 rounded-r-lg border-y border-r border-white/10 text-white/70 hover:text-white z-40 shadow-lg"
        >
          <ChevronRight size={20} />
        </motion.button>
      )}
    </>
  );
};
