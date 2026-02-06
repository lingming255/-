import { useMemo } from 'react';
import { useGameStore, Goal } from '../store/gameStore';
import { getGoalRoot } from '../utils/treeHelpers';

export interface TaskItem {
  goal: Goal;
  root: Goal | null;
}

export const useTaskQueue = () => {
  const { goals, taskOrder, setTaskOrder } = useGameStore();

  const taskQueue = useMemo(() => {
    // 1. Get all incomplete goals
    const incompleteGoals = goals.filter(g => !g.isCompleted);
    const incompleteMap = new Map(incompleteGoals.map(g => [g.id, g]));

    // 2. Build ordered list based on taskOrder
    const orderedItems: TaskItem[] = [];
    const processedIds = new Set<string>();

    // First, add items present in taskOrder (if they are still valid and incomplete)
    taskOrder.forEach(id => {
      const goal = incompleteMap.get(id);
      if (goal) {
        orderedItems.push({
          goal,
          root: getGoalRoot(goal.id, goals)
        });
        processedIds.add(id);
      }
    });

    // 3. Append remaining items (newly created or not yet ordered)
    // Sort them by creation time or priority as a default fallback
    const remaining = incompleteGoals.filter(g => !processedIds.has(g.id));
    
    // Sort remaining by priority (P0 > P1 > P2) then createdAt
    remaining.sort((a, b) => {
       if (a.priority !== b.priority) {
           return a.priority.localeCompare(b.priority); // P0 < P1 < P2 string wise? P0 comes first? 'P0' < 'P1' is true.
       }
       return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(); // Newest first
    });

    remaining.forEach(goal => {
      orderedItems.push({
        goal,
        root: getGoalRoot(goal.id, goals)
      });
    });

    return orderedItems;
  }, [goals, taskOrder]);

  const updateOrder = (newItems: TaskItem[]) => {
      const newOrderIds = newItems.map(item => item.goal.id);
      setTaskOrder(newOrderIds);
  };

  return { taskQueue, updateOrder };
};
