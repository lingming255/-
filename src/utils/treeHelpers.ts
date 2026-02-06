import { Goal } from '../types';

export const getRootGoals = (goals: Goal[]): Goal[] => {
  return goals.filter(g => !g.parentIds || g.parentIds.length === 0);
};

export const getSubTreeIds = (rootId: string, goals: Goal[]): Set<string> => {
  const result = new Set<string>();
  const queue = [rootId];
  
  while (queue.length > 0) {
    const currentId = queue.shift()!;
    if (result.has(currentId)) continue;
    
    result.add(currentId);
    
    // Find children
    const children = goals.filter(g => g.parentIds?.includes(currentId));
    children.forEach(c => queue.push(c.id));
  }
  
  return result;
};

export const getAncestors = (nodeId: string, goals: Goal[]): Goal[] => {
  // Simple path finding up to a root. 
  // Since it's a DAG, there might be multiple paths. We just take the first parent for breadcrumbs.
  const path: Goal[] = [];
  let currentId: string | undefined = nodeId;
  
  while (currentId) {
    const node = goals.find(g => g.id === currentId);
    if (!node) break;
    
    path.unshift(node);
    
    if (node.parentIds && node.parentIds.length > 0) {
      currentId = node.parentIds[0]; // Naive parent selection for breadcrumbs
    } else {
      currentId = undefined;
    }
  }
  
  return path;
};

export const getGoalRoot = (nodeId: string, goals: Goal[]): Goal | null => {
  const ancestors = getAncestors(nodeId, goals);
  return ancestors.length > 0 ? ancestors[0] : null;
};
