export type WeatherType = 'clear' | 'cloudy' | 'rain' | 'snow';
export type TimePhase = 'morning' | 'noon' | 'afternoon' | 'dusk' | 'night';

export interface SubGoal {
  id: string;
  content: string;
  isCompleted: boolean;
}

export type Priority = 'P0' | 'P1' | 'P2';

export interface Goal {
  id: string;
  content: string;
  parentIds: string[];
  isCompleted: boolean;
  priority: Priority;
  completedAt?: string;
  createdAt: string;
  isToday: boolean;
  subGoals: SubGoal[];
  position: { x: number; y: number };
}
