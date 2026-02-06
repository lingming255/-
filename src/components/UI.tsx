import React, { useState } from 'react';
import { useGameStore, Goal } from '../store/gameStore';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Download, Cloud, Sun, CloudRain, Snowflake, CheckCircle, Book, ArrowUp, X, Palette, Globe, Paintbrush, Edit2, Trash2, Save, Map, Plus, Square, CheckSquare } from 'lucide-react';
import { EnvironmentType, ColorTheme } from '../store/gameStore';

interface UIProps {
  onWeatherToggle: () => void;
  currentWeather: string;
  onOpenMap: () => void;
}

const UI: React.FC<UIProps> = ({ onWeatherToggle, currentWeather, onOpenMap }) => {
  const { 
    goals, activeGoalId, addGoal, completeGoal,
    addDailyLog, exportData, dailyLogs,
    viewMode, setViewMode, stairStyle, setStairStyle,
    environment, setEnvironment,
    colorTheme, setColorTheme,
    updateDailyLog, deleteDailyLog,
    updateGoal, deleteGoal,
    addSubGoal, toggleSubGoal, deleteSubGoal
  } = useGameStore();
  
  const activeGoal = goals.find(g => g.id === activeGoalId);
  const completedGoals = goals.filter(g => g.isCompleted);

  const [goalInput, setGoalInput] = useState('');
  const [logInput, setLogInput] = useState('');
  const [showLogInput, setShowLogInput] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  
  // Edit States
  const [editingLogId, setEditingLogId] = useState<string | null>(null);
  const [editLogContent, setEditLogContent] = useState('');
  
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [editGoalContent, setEditGoalContent] = useState('');

  // Subgoal input for Modal
  const [modalSubInput, setModalSubInput] = useState('');

  const triggerCelebration = () => {
    // 方案 1: 经典的抛洒庆祝 (Confetti)
    const count = 200;
    const defaults = {
      origin: { y: 0.7 },
      zIndex: 9999, // Ensure it's on top of everything
    };

    function fire(particleRatio: number, opts: confetti.Options) {
      confetti({
        ...defaults,
        ...opts,
        particleCount: Math.floor(count * particleRatio),
      });
    }

    fire(0.25, {
      spread: 26,
      startVelocity: 55,
    });
    fire(0.2, {
      spread: 60,
    });
    fire(0.35, {
      spread: 100,
      decay: 0.91,
      scalar: 0.8,
    });
    fire(0.1, {
      spread: 120,
      startVelocity: 25,
      decay: 0.92,
      scalar: 1.2,
    });
    fire(0.1, {
      spread: 120,
      startVelocity: 45,
    });
  };

  const handleCompleteGoal = (id: string) => {
      triggerCelebration();
      completeGoal(id);
  };

  const handleSetGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (goalInput.trim()) {
      const newId = addGoal(goalInput);
      // If we are setting a goal from the main screen (which usually means "I want to work on this now")
      // We should probably make it active.
      // But if there was no active goal, addGoal might have done it.
      // If there was no active goal, we are here.
      // So let's force set it active to be sure/responsive.
      useGameStore.getState().setActiveGoal(newId);
      setGoalInput('');
    }
  };

  const handleLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (logInput.trim()) {
      addDailyLog(logInput);
      setLogInput('');
      setShowLogInput(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
      // Ctrl+Enter or Cmd+Enter to submit
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
          handleLog(e);
      }
      // Esc to close
      if (e.key === 'Escape') {
          setShowLogInput(false);
      }
  };

  const toggleStyle = () => {
      const styles: ('minimal' | 'ethereal' | 'solid')[] = ['minimal', 'ethereal', 'solid'];
      const nextIndex = (styles.indexOf(stairStyle) + 1) % styles.length;
      setStairStyle(styles[nextIndex]);
  };

  const toggleEnvironment = () => {
      const envs: EnvironmentType[] = ['countryside', 'city', 'mountain', 'desert', 'beach', 'rainforest'];
      const nextIndex = (envs.indexOf(environment) + 1) % envs.length;
      setEnvironment(envs[nextIndex]);
  };

  const toggleColorTheme = () => {
    const themes: ColorTheme[] = ['midnight', 'bamboo', 'sunset'];
    const nextIndex = (themes.indexOf(colorTheme) + 1) % themes.length;
    setColorTheme(themes[nextIndex]);
  };

  const startEditLog = (log: { id: string, content: string }) => {
      setEditingLogId(log.id);
      setEditLogContent(log.content);
  };

  const saveEditLog = () => {
      if (editingLogId && editLogContent.trim()) {
          updateDailyLog(editingLogId, editLogContent);
          setEditingLogId(null);
          setEditLogContent('');
      }
  };

  const cancelEditLog = () => {
      setEditingLogId(null);
      setEditLogContent('');
  };

  const handleDeleteLog = (id: string) => {
      if (window.confirm('Delete this chronicle?')) {
          deleteDailyLog(id);
      }
  };
  
  const handleStoneClick = (goal: Goal) => {
      setSelectedGoal(goal);
      setEditGoalContent(goal.content);
      setIsEditingGoal(false);
  };

  const saveEditGoal = () => {
      if (selectedGoal && editGoalContent.trim()) {
          updateGoal(selectedGoal.id, { content: editGoalContent });
          setSelectedGoal({ ...selectedGoal, content: editGoalContent });
          setIsEditingGoal(false);
      }
  };

  const handleDeleteGoal = () => {
      if (selectedGoal) {
          deleteGoal(selectedGoal.id);
          setSelectedGoal(null);
      }
  };

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-6 z-10">
      {/* Top Bar: Goal & Settings */}
      <div className="flex justify-between items-start pointer-events-auto">
        {/* Goal Section */}
        <div className="flex-1 flex justify-center">
          <AnimatePresence mode="wait">
          {activeGoal ? (
            <motion.div 
              key="active-goal"
              initial={{ opacity: 0, y: -20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, filter: 'blur(10px)' }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.95 }}
              className={`bg-black/40 backdrop-blur-md px-6 py-3 rounded-full border border-white/10 text-white cursor-pointer hover:bg-white/10 transition group flex items-center gap-2 ${activeGoal.isToday ? 'border-amber-400/50 shadow-[0_0_15px_rgba(251,191,36,0.1)]' : ''}`}
              onClick={() => handleCompleteGoal(activeGoal.id)}
              title="Click to complete"
            >
              {activeGoal.isToday && <Sun size={14} className="text-amber-400 fill-amber-400/20" />}
              <span className="text-lg font-light tracking-wider drop-shadow-sm">{activeGoal.content}</span>
              <span className="hidden group-hover:inline ml-2 text-green-400 opacity-0 group-hover:opacity-100 transition">
                <CheckCircle className="inline w-4 h-4" />
              </span>
            </motion.div>
          ) : (
            <motion.form 
              key="goal-form"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              onSubmit={handleSetGoal} 
              className="pointer-events-auto flex gap-2"
            >
               <button 
                type="button"
                onClick={onOpenMap}
                className="bg-black/40 backdrop-blur-md px-4 py-3 rounded-full border border-white/10 text-white hover:bg-white/10 transition flex items-center gap-2"
              >
                <Map size={18} />
                <span>Select Goal</span>
              </button>
              <input
                type="text"
                value={goalInput}
                onChange={(e) => setGoalInput(e.target.value)}
                placeholder="Or create new..."
                className="bg-black/40 backdrop-blur-md px-6 py-3 rounded-full border border-white/10 text-white placeholder-white/70 focus:outline-none focus:ring-1 focus:ring-white/30 text-center w-60 transition"
              />
            </motion.form>
          )}
          </AnimatePresence>
        </div>

        {/* Tools */}
        <div className="flex gap-2">
           {activeGoal && (
             <>
               <button 
                 onClick={onOpenMap}
                 className="p-2 rounded-full bg-black/40 hover:bg-black/60 border border-white/10 backdrop-blur-sm text-white transition shadow-sm"
                 title="Open Goal Map"
               >
                 <Map size={20} />
               </button>
               <div className="w-px h-8 bg-white/10 mx-1" /> {/* Divider */}
             </>
           )}
           <button 
             onClick={toggleEnvironment}
             className="p-2 rounded-full bg-black/40 hover:bg-black/60 border border-white/10 backdrop-blur-sm text-white transition shadow-sm"
             title={`Change Environment (Current: ${environment})`}
           >
             <Globe size={20} />
           </button>
           <button 
             onClick={toggleColorTheme}
             className="p-2 rounded-full bg-black/40 hover:bg-black/60 border border-white/10 backdrop-blur-sm text-white transition shadow-sm"
             title={`Change Theme (Current: ${colorTheme})`}
           >
             <Paintbrush size={20} />
           </button>
           <button 
             onClick={toggleStyle}
             className="p-2 rounded-full bg-black/20 hover:bg-white/10 text-white transition"
             title={`Change Stair Style (Current: ${stairStyle})`}
           >
             <Palette size={20} />
           </button>
           <button 
             onClick={() => setViewMode(viewMode === 'diagonal' ? 'vertical' : 'diagonal')}
             className="p-2 rounded-full bg-black/20 hover:bg-white/10 text-white transition"
             title={viewMode === 'diagonal' ? "Switch to Vertical View" : "Switch to Diagonal View"}
           >
             <ArrowUp size={20} className={viewMode === 'diagonal' ? 'rotate-45' : ''} />
           </button>
           <button onClick={onWeatherToggle} className="p-2 rounded-full bg-black/20 hover:bg-white/10 text-white transition">
            {currentWeather === 'clear' && <Sun size={20} />}
            {currentWeather === 'cloudy' && <Cloud size={20} />}
            {currentWeather === 'rain' && <CloudRain size={20} />}
            {currentWeather === 'snow' && <Snowflake size={20} />}
          </button>
          <button onClick={() => setShowHistory(true)} className="p-2 rounded-full bg-black/20 hover:bg-white/10 text-white transition" title="View History">
            <Book size={20} />
          </button>
          <button onClick={exportData} className="p-2 rounded-full bg-black/20 hover:bg-white/10 text-white transition" title="Export Data">
            <Download size={20} />
          </button>
        </div>
      </div>

      {/* History Modal */}
      {showHistory && (
        <div className="absolute inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center pointer-events-auto z-50">
          <div className="bg-white/10 border border-white/20 p-8 rounded-2xl w-[500px] max-h-[80vh] flex flex-col relative text-white">
            <button onClick={() => setShowHistory(false)} className="absolute top-4 right-4 text-white/50 hover:text-white">
              <X size={24} />
            </button>
            <h2 className="text-2xl font-light mb-6 tracking-widest text-center border-b border-white/10 pb-4">CHRONICLE</h2>
            <div className="overflow-y-auto flex-1 space-y-4 pr-2 custom-scrollbar">
              {dailyLogs.length === 0 ? (
                <div className="text-center text-white/30 italic py-10">No records yet. Engrave your first step.</div>
              ) : (
                dailyLogs.slice().reverse().map((log) => (
                  <div key={log.id} className="bg-black/20 p-4 rounded-lg border border-white/5 group relative">
                    <div className="text-xs text-white/40 mb-1 font-mono flex justify-between">
                        <span>{new Date(log.date).toLocaleDateString()}</span>
                        <div className="hidden group-hover:flex gap-2">
                             <button onClick={() => startEditLog(log)} className="text-white/30 hover:text-white transition"><Edit2 size={12}/></button>
                             <button onClick={() => handleDeleteLog(log.id)} className="text-white/30 hover:text-red-400 transition"><Trash2 size={12}/></button>
                        </div>
                    </div>
                    {editingLogId === log.id ? (
                        <div className="flex flex-col gap-2">
                            <textarea 
                                value={editLogContent} 
                                onChange={(e) => setEditLogContent(e.target.value)}
                                className="bg-black/40 text-white w-full p-2 rounded border border-white/20 focus:outline-none"
                                autoFocus
                            />
                            <div className="flex justify-end gap-2">
                                <button onClick={cancelEditLog} className="text-xs text-white/50 hover:text-white">Cancel</button>
                                <button onClick={saveEditLog} className="text-xs bg-white/10 px-2 py-1 rounded hover:bg-white/20">Save</button>
                            </div>
                        </div>
                    ) : (
                        <div className="text-white/90 font-light leading-relaxed whitespace-pre-wrap">{log.content}</div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Goal Detail Modal */}
      {selectedGoal && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center pointer-events-auto z-50">
             <div className="bg-white/10 border border-white/20 p-8 rounded-2xl w-[400px] flex flex-col relative text-white text-center shadow-2xl">
                <button onClick={() => setSelectedGoal(null)} className="absolute top-4 right-4 text-white/50 hover:text-white">
                  <X size={24} />
                </button>
                
                <div className="mb-6 flex justify-center text-green-400">
                    <CheckCircle size={48} className="opacity-80" />
                </div>

                {isEditingGoal ? (
                    <div className="flex flex-col gap-4">
                        <input 
                            type="text" 
                            value={editGoalContent} 
                            onChange={(e) => setEditGoalContent(e.target.value)}
                            className="bg-black/40 text-xl text-center p-2 rounded border border-white/20 focus:outline-none text-white"
                            autoFocus
                        />
                        <div className="flex justify-center gap-3 mt-2">
                             <button onClick={() => setIsEditingGoal(false)} className="px-4 py-2 rounded text-white/50 hover:text-white">Cancel</button>
                             <button onClick={saveEditGoal} className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded flex items-center gap-2"><Save size={16}/> Save</button>
                        </div>
                    </div>
                ) : (
                    <>
                        <h3 className="text-2xl font-light leading-relaxed mb-2">{selectedGoal.content}</h3>
                        <div className="text-white/40 text-sm font-mono mb-8">
                            {selectedGoal.completedAt && (
                                <>Achieved on {new Date(selectedGoal.completedAt).toLocaleDateString()}</>
                            )}
                        </div>
                        <div className="flex justify-center gap-4">
                             <button onClick={() => setIsEditingGoal(true)} className="p-2 text-white/30 hover:text-white transition rounded-full hover:bg-white/5" title="Edit">
                                <Edit2 size={20} />
                             </button>
                             <button onClick={handleDeleteGoal} className="p-2 text-white/30 hover:text-red-400 transition rounded-full hover:bg-white/5" title="Delete">
                                <Trash2 size={20} />
                             </button>
                        </div>
                    </>
                )}
             </div>
        </div>
      )}

      {/* Daily Engrave Modal (New Design) */}
      {showLogInput && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center pointer-events-auto z-50">
             <div className="w-[600px] max-w-[90vw] flex flex-col gap-4 animate-in fade-in zoom-in duration-200 max-h-[90vh]">
                <div className="text-white/60 text-center text-sm font-mono tracking-widest uppercase">
                    Engrave your chronicle
                </div>

                {/* Active Goal Sub-goals Section in Modal */}
                {activeGoal && (
                    <div className="bg-black/40 backdrop-blur-xl p-4 rounded-2xl border border-white/10 flex flex-col gap-2 shrink-0">
                        <div className="flex justify-between items-center text-white/50 text-xs font-mono tracking-widest uppercase border-b border-white/5 pb-2">
                            <span>Daily Targets: <span className="text-white">{activeGoal.content}</span></span>
                            <span>{activeGoal.subGoals?.filter(sg => sg.isCompleted).length || 0}/{activeGoal.subGoals?.length || 0}</span>
                        </div>
                        
                        <div className="flex flex-col gap-1 max-h-[150px] overflow-y-auto pr-1 custom-scrollbar">
                            {(activeGoal.subGoals || []).map(sg => (
                                <div key={sg.id} className="flex items-center gap-3 text-sm group px-2 py-1 rounded hover:bg-white/5 transition">
                                    <button 
                                        onClick={() => toggleSubGoal(activeGoal.id, sg.id)}
                                        className={`transition ${sg.isCompleted ? 'text-green-400' : 'text-white/30 hover:text-white'}`}
                                    >
                                        {sg.isCompleted ? <CheckSquare size={16} /> : <Square size={16} />}
                                    </button>
                                    <span className={`flex-1 ${sg.isCompleted ? 'line-through text-white/30' : 'text-white/80'}`}>
                                        {sg.content}
                                    </span>
                                    <button 
                                        onClick={() => deleteSubGoal(activeGoal.id, sg.id)}
                                        className="opacity-0 group-hover:opacity-100 text-white/20 hover:text-red-400 transition"
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                            ))}
                            {(!activeGoal.subGoals || activeGoal.subGoals.length === 0) && (
                                <div className="text-white/20 text-xs italic text-center py-2">No sub-goals set. Break it down.</div>
                            )}
                        </div>

                        <form 
                            onSubmit={(e) => {
                                e.preventDefault();
                                if (modalSubInput.trim()) {
                                    addSubGoal(activeGoal.id, modalSubInput);
                                    setModalSubInput('');
                                }
                            }}
                            className="flex gap-2 mt-1"
                        >
                            <input 
                                type="text" 
                                value={modalSubInput}
                                onChange={(e) => setModalSubInput(e.target.value)}
                                placeholder="Add a quick task..."
                                className="flex-1 bg-white/5 border border-white/10 rounded px-3 py-1.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-white/30 transition"
                            />
                            <button type="submit" className="p-1.5 rounded bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition">
                                <Plus size={16} />
                            </button>
                        </form>
                    </div>
                )}

                <form onSubmit={handleLog} className="flex flex-col gap-4 flex-1 min-h-0">
                  <textarea
                    value={logInput}
                    onChange={(e) => setLogInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="What steps did you ascend today?..."
                    className="bg-black/40 backdrop-blur-xl p-8 rounded-2xl border border-white/10 text-white text-xl placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-white/20 w-full resize-none shadow-2xl leading-relaxed flex-1 min-h-[150px]"
                    autoFocus
                  />
                  <div className="flex justify-between items-center px-2 shrink-0">
                    <div className="text-xs text-white/30">
                        <span className="bg-white/10 px-1.5 py-0.5 rounded border border-white/5">Ctrl + Enter</span> to save
                        <span className="mx-2">|</span>
                        <span className="bg-white/10 px-1.5 py-0.5 rounded border border-white/5">Esc</span> to cancel
                    </div>
                    <div className="flex gap-3">
                        <button type="button" onClick={() => setShowLogInput(false)} className="text-white/50 hover:text-white px-4 py-2 transition">Discard</button>
                        <button type="submit" className="bg-white text-black px-6 py-2 rounded-full hover:bg-white/90 font-medium transition shadow-[0_0_20px_rgba(255,255,255,0.2)]">Engrave</button>
                    </div>
                  </div>
                </form>
             </div>
          </div>
      )}

      {/* Bottom Section */}
      <div className="flex justify-between items-end pointer-events-auto">
        {/* Stone Pile (Completed Goals) */}
        <div className="flex flex-col gap-1 items-start">
            <div className="text-white/50 text-xs uppercase tracking-widest mb-1 shadow-sm">Completed</div>
            <div className="flex flex-wrap gap-2 max-w-[300px] items-end">
                {completedGoals.map((g) => (
                    <div key={g.id} className="group relative" onClick={() => handleStoneClick(g)}>
                        {/* The Stone */}
                        <div 
                            className="w-4 h-4 bg-stone-400 rounded-sm transform rotate-45 border border-black/20 hover:bg-stone-300 hover:scale-110 transition cursor-pointer shadow-md" 
                        />
                        {/* Custom Tooltip */}
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 hidden group-hover:block w-max max-w-[200px] bg-black/80 backdrop-blur-sm text-white text-xs px-2 py-1 rounded border border-white/10 z-20 pointer-events-none">
                            <div className="font-semibold">{g.content}</div>
                            {g.completedAt && (
                                <div className="text-white/50 text-[10px]">{new Date(g.completedAt).toLocaleDateString()}</div>
                            )}
                            <div className="text-green-400 text-[10px] mt-1">Click to manage</div>
                        </div>
                    </div>
                ))}
            </div>
        </div>

        {/* Daily Engrave Button (Only visible when modal closed) */}
        {!showLogInput && (
            <button 
                onClick={() => setShowLogInput(true)}
                className="group flex items-center gap-2 bg-black/20 hover:bg-white/10 backdrop-blur-md px-5 py-2 rounded-full border border-white/10 text-white transition shadow-sm"
            >
                <Edit2 size={16} className="text-white/70 group-hover:text-white" />
                <span className="text-sm font-light drop-shadow-sm">Engrave Today</span>
            </button>
        )}
      </div>
    </div>
  );
};

export default UI;
