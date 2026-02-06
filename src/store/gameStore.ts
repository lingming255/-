import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { generateId } from '../utils/helpers';

export interface DailyLog {
  id: string;
  date: string;
  content: string;
  stepIndex: number;
  targetGoalContent?: string | null; // Snapshot for history
  linkedGoalId?: string | null; // Link to the specific goal ID
}

export interface SubGoal {
  id: string;
  content: string;
  isCompleted: boolean;
}

export interface Goal {
  id: string;
  content: string;
  parentIds: string[];
  isCompleted: boolean;
  completedAt?: string;
  createdAt: string;
  isToday: boolean;
  subGoals: SubGoal[];
  position: { x: number; y: number };
}

export type ViewMode = 'diagonal' | 'vertical';
export type StairStyle = 'minimal' | 'ethereal' | 'solid';
export type EnvironmentType = 'countryside' | 'city' | 'mountain' | 'desert' | 'beach' | 'rainforest';
export type ColorTheme = 'midnight' | 'bamboo' | 'sunset';

export interface GameState {
  goals: Goal[];
  activeGoalId: string | null;
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
  completeGoal: (id: string) => void;
  toggleGoalToday: (id: string) => void;
  
  // SubGoal Actions
  addSubGoal: (goalId: string, content: string) => void;
  toggleSubGoal: (goalId: string, subGoalId: string) => void;
  deleteSubGoal: (goalId: string, subGoalId: string) => void;
  
  // Legacy Wrappers (to maintain compatibility with some UI calls if needed, though we'll update UI)
  // We'll update the UI to use the new actions.

  addDailyLog: (content: string) => void;
  setWeatherOverride: (weather: string | null) => void;
  setViewMode: (mode: ViewMode) => void;
  setStairStyle: (style: StairStyle) => void;
  setEnvironment: (env: EnvironmentType) => void;
  setColorTheme: (theme: ColorTheme) => void;
  
  updateDailyLog: (id: string, content: string) => void;
  deleteDailyLog: (id: string) => void;

  exportData: () => void;
}

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      goals: [],
      activeGoalId: null,
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

      completeGoal: (id) => {
        const { goals, activeGoalId } = get();
        set({
          goals: goals.map(g => g.id === id ? { 
            ...g, 
            isCompleted: true, 
            completedAt: new Date().toISOString() 
          } : g),
          activeGoalId: activeGoalId === id ? null : activeGoalId // Clear active goal if it's the one being completed
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
    }),
    {
      name: 'ascension-storage',
      storage: createJSONStorage(() => localStorage),
      version: 3,
      migrate: (persistedState: any, version) => {
        if (version === 0 || version === 1 || version === 2 || !version) {
          // Migration from version 1 or 2 (or unversioned)
          const oldState = persistedState as any;
          
          // Pre-process for v2->v3: Convert parentId to parentIds
          // If we are coming from v2, goals might already exist.
          // If we are coming from v0/v1, we do the migration logic below, BUT we need to adapt it to produce parentIds.
          
          let goals: Goal[] = [];
          let activeGoalId: string | null = null;
          
          // If we have goals from v2 state, use them but convert parentId
          if (oldState.goals && Array.isArray(oldState.goals)) {
              goals = oldState.goals.map((g: any) => ({
                  ...g,
                  parentIds: g.parentIds || (g.parentId ? [g.parentId] : []),
                  parentId: undefined,
                  subGoals: g.subGoals || []
              }));
              activeGoalId = oldState.activeGoalId;
          } else {
              // v0/v1 Migration Logic (Legacy)
              // 1. Migrate currentGoal
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
                     position: { x: 0, y: 0 }
                 });
                 activeGoalId = newId;
              }
              
              // 2. Migrate completedGoals
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
                          position: { x: (index + 1) * 200, y: 0 }
                      });
                  });
              }
          }
          
          return {
              ...oldState,
              goals,
              activeGoalId,
              version: 3
          };
        }
        return persistedState as GameState;
      }
    }
  )
);
