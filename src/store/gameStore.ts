import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { generateId } from '../utils/helpers';
import { Goal, Priority, SubGoal } from '../types';
export type { Goal, Priority, SubGoal };

export interface DailyLog {
  id: string;
  date: string;
  content: string;
  stepIndex: number;
  targetGoalContent?: string | null; // Snapshot for history
  linkedGoalId?: string | null; // Link to the specific goal ID
}

export type ViewMode = 'diagonal' | 'vertical';
export type StairStyle = 'minimal' | 'ethereal' | 'solid';
export type EnvironmentType = 'countryside' | 'city' | 'mountain' | 'desert' | 'beach' | 'rainforest';
export type ColorTheme = 'midnight' | 'bamboo' | 'sunset';

export interface GameState {
  goals: Goal[];
  activeGoalId: string | null;
  focusedGoalId: string | null; // For Focus Mode (Drill-down)
  taskOrder: string[]; // Global custom sort order
  dailyLogs: DailyLog[];
  weatherOverride: string | null;
  viewMode: ViewMode;
  stairStyle: StairStyle;
  environment: EnvironmentType;
  colorTheme: ColorTheme;
  
  // Goal Actions
  addGoal: (content: string, parentId?: string | null, position?: { x: number, y: number }) => string;
  updateGoal: (id: string, updates: Partial<Goal>) => void;
  deleteGoal: (id: string) => void;
  unlinkGoal: (id: string) => void;
  setActiveGoal: (id: string | null) => void;
  setFocusedGoalId: (id: string | null) => void;
  setTaskOrder: (order: string[]) => void;
  setGoalPriority: (id: string, priority: Priority) => void;
  completeGoal: (id: string) => void;
  toggleGoalToday: (id: string) => void;
  
  // SubGoal Actions
  addSubGoal: (goalId: string, content: string) => void;
  toggleSubGoal: (goalId: string, subGoalId: string) => void;
  deleteSubGoal: (goalId: string, subGoalId: string) => void;
  
  addDailyLog: (content: string) => void;
  setWeatherOverride: (weather: string | null) => void;
  setViewMode: (mode: ViewMode) => void;
  setStairStyle: (style: StairStyle) => void;
  setEnvironment: (env: EnvironmentType) => void;
  setColorTheme: (theme: ColorTheme) => void;
  
  updateDailyLog: (id: string, content: string) => void;
  deleteDailyLog: (id: string) => void;

  exportData: () => void;
  importData: (data: any) => boolean;
}

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      goals: [],
      activeGoalId: null,
      focusedGoalId: null,
      taskOrder: [],
      dailyLogs: [],
      weatherOverride: null,
      viewMode: 'diagonal',
      stairStyle: 'minimal',
      environment: 'countryside',
      colorTheme: 'midnight',

      addGoal: (content, parentId = null, position = { x: 0, y: 0 }) => {
        const { goals } = get();
        const newGoal: Goal = {
          id: generateId(),
          content,
          parentIds: parentId ? [parentId] : [],
          isCompleted: false,
          priority: 'P2', // Default priority
          createdAt: new Date().toISOString(),
          isToday: false,
          subGoals: [],
          position,
        };
        // If it's the first goal, make it active automatically
        const shouldActivate = goals.length === 0 && !get().activeGoalId;
        
        set({ 
          goals: [...goals, newGoal],
          activeGoalId: shouldActivate ? newGoal.id : get().activeGoalId
        });
        return newGoal.id;
      },

      addSubGoal: (goalId, content) => {
        const { goals } = get();
        set({
          goals: goals.map(g => {
            if (g.id !== goalId) return g;
            return {
              ...g,
              subGoals: [
                ...(g.subGoals || []),
                {
                  id: generateId(),
                  content,
                  isCompleted: false
                }
              ]
            };
          })
        });
      },

      toggleSubGoal: (goalId, subGoalId) => {
        const { goals } = get();
        set({
          goals: goals.map(g => {
            if (g.id !== goalId) return g;
            return {
              ...g,
              subGoals: (g.subGoals || []).map(sg => 
                sg.id === subGoalId ? { ...sg, isCompleted: !sg.isCompleted } : sg
              )
            };
          })
        });
      },

      deleteSubGoal: (goalId, subGoalId) => {
        const { goals } = get();
        set({
          goals: goals.map(g => {
            if (g.id !== goalId) return g;
            return {
              ...g,
              subGoals: (g.subGoals || []).filter(sg => sg.id !== subGoalId)
            };
          })
        });
      },

      updateGoal: (id, updates) => {
        const { goals } = get();
        set({
          goals: goals.map(g => g.id === id ? { ...g, ...updates } : g)
        });
      },

      deleteGoal: (id) => {
        const { goals, activeGoalId } = get();
        // Remove the deleted goal ID from any parentIds arrays
        const newGoals = goals.filter(g => g.id !== id).map(g => ({
            ...g,
            parentIds: g.parentIds.filter(pid => pid !== id)
        }));
        
        set({
          goals: newGoals,
          activeGoalId: activeGoalId === id ? null : activeGoalId
        });
      },

      unlinkGoal: (id) => {
        const { goals } = get();
        set({
          goals: goals.map(g => g.id === id ? { ...g, parentIds: [] } : g)
        });
      },

      setActiveGoal: (id) => {
        const { goals } = get();
        if (id) {
          set({
            activeGoalId: id,
            goals: goals.map(g => g.id === id ? { ...g, isCompleted: false, completedAt: undefined } : g)
          });
        } else {
          set({ activeGoalId: null });
        }
      },

      setFocusedGoalId: (id) => {
        set({ focusedGoalId: id });
      },

      setTaskOrder: (order) => {
        set({ taskOrder: order });
      },

      setGoalPriority: (id, priority) => {
        const { goals } = get();
        set({
          goals: goals.map(g => g.id === id ? { ...g, priority } : g)
        });
      },

      completeGoal: (id) => {
        const { goals, activeGoalId } = get();
        const goal = goals.find(g => g.id === id);
        
        // Block completion if there are incomplete sub-goals
        if (goal && goal.subGoals && goal.subGoals.some(sg => !sg.isCompleted)) {
            // Visual feedback handled by UI component, but store should also enforce
            return; 
        }

        set({
          goals: goals.map(g => g.id === id ? { 
            ...g, 
            isCompleted: true, 
            completedAt: new Date().toISOString() 
          } : g),
          activeGoalId: activeGoalId === id ? null : activeGoalId 
        });
      },
      
      toggleGoalToday: (id) => {
        const { goals } = get();
        set({
          goals: goals.map(g => g.id === id ? { ...g, isToday: !g.isToday } : g)
        });
      },

      addDailyLog: (content) => {
        const { dailyLogs, goals, activeGoalId } = get();
        const activeGoal = goals.find(g => g.id === activeGoalId);
        
        const newLog: DailyLog = {
          id: generateId(),
          date: new Date().toISOString(),
          content,
          stepIndex: dailyLogs.length,
          targetGoalContent: activeGoal ? activeGoal.content : null,
          linkedGoalId: activeGoalId
        };
        set({ dailyLogs: [...dailyLogs, newLog] });
      },

      setWeatherOverride: (weather) => set({ weatherOverride: weather }),
      setViewMode: (mode) => set({ viewMode: mode }),
      setStairStyle: (style) => set({ stairStyle: style }),
      setEnvironment: (env) => set({ environment: env }),
      setColorTheme: (theme) => set({ colorTheme: theme }),

      updateDailyLog: (id, content) => {
        const { dailyLogs } = get();
        set({
          dailyLogs: dailyLogs.map(log => log.id === id ? { ...log, content } : log)
        });
      },
      deleteDailyLog: (id) => {
        const { dailyLogs } = get();
        set({
          dailyLogs: dailyLogs.filter(log => log.id !== id)
        });
      },

      exportData: () => {
        const state = get();
        const data = {
          version: '2.0',
          goals: state.goals,
          activeGoalId: state.activeGoalId,
          dailyLogs: state.dailyLogs,
          exportedAt: new Date().toISOString(),
          // Legacy fields support (optional)
          currentGoal: state.activeGoalId ? state.goals.find(g => g.id === state.activeGoalId)?.content : null,
          completedGoals: state.goals.filter(g => g.isCompleted).map(g => ({
              id: g.id,
              content: g.content,
              completedAt: g.completedAt
          }))
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ascension_tree_data_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      },

      importData: (data: any) => {
        try {
          // Basic validation
          if (!data || !Array.isArray(data.goals)) {
            console.error('Invalid save data format');
            return false;
          }
          
          set({
            goals: data.goals || [],
            activeGoalId: data.activeGoalId || null,
            dailyLogs: data.dailyLogs || [],
            weatherOverride: data.weatherOverride || null,
            viewMode: data.viewMode || 'diagonal',
            stairStyle: data.stairStyle || 'minimal',
            environment: data.environment || 'countryside',
            colorTheme: data.colorTheme || 'midnight',
          });
          return true;
        } catch (e) {
          console.error('Failed to import data:', e);
          return false;
        }
      },
    }),
    {
      name: 'ascension-storage',
      storage: createJSONStorage(() => localStorage),
      version: 5,
      migrate: (persistedState: any, version) => {
        // Handle migration to version 3 first (existing logic)
        let state = persistedState as any;
        
        if (version === 0 || version === 1 || version === 2 || !version) {
          const oldState = state;
          let goals: Goal[] = [];
          let activeGoalId: string | null = null;
          
          if (oldState.goals && Array.isArray(oldState.goals)) {
              goals = oldState.goals.map((g: any) => ({
                  ...g,
                  parentIds: g.parentIds || (g.parentId ? [g.parentId] : []),
                  parentId: undefined,
                  subGoals: g.subGoals || []
              }));
              activeGoalId = oldState.activeGoalId;
          } else {
              // Legacy migration
              if (oldState.currentGoal) {
                 const newId = generateId();
                 goals.push({
                     id: newId,
                     content: oldState.currentGoal,
                     parentIds: [],
                     isCompleted: false,
                     createdAt: new Date().toISOString(),
                     isToday: true, 
                     subGoals: [],
                     position: { x: 0, y: 0 },
                     priority: 'P2' // Default
                 } as Goal);
                 activeGoalId = newId;
              }
              if (Array.isArray(oldState.completedGoals)) {
                  oldState.completedGoals.forEach((cg: any, index: number) => {
                      goals.push({
                          id: cg.id || generateId(),
                          content: cg.content,
                          parentIds: [],
                          isCompleted: true,
                          completedAt: cg.completedAt,
                          createdAt: cg.completedAt,
                          isToday: false,
                          subGoals: [],
                          position: { x: (index + 1) * 200, y: 0 },
                          priority: 'P2'
                      } as Goal);
                  });
              }
          }
          
          state = {
              ...oldState,
              goals,
              activeGoalId,
              version: 3
          };
        }

        // Migration from v3 to v4 (Add priority)
        if (state.version === 3 || !state.version) {
            state.goals = state.goals.map((g: any) => ({
                ...g,
                priority: g.priority || 'P2'
            }));
            state.version = 4;
            state.focusedGoalId = null;
        }

        // Migration from v4 to v5 (Add taskOrder)
        if (state.version === 4) {
            state.taskOrder = state.taskOrder || [];
            state.version = 5;
        }
        
        return state as GameState;
      }
    }
  )
);
