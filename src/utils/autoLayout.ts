import { Goal } from '../store/gameStore';

const NODE_WIDTH = 240; // Card width (220) + gap (20)
const NODE_HEIGHT = 200; // Card height (~150) + gap (50)
const LEVEL_HEIGHT = 250; // Vertical gap between levels

interface TreeNode {
    id: string;
    children: TreeNode[];
    width: number;
    x: number;
    y: number;
    offset: number; // For shifting
}

export const calculateTreeLayout = (goals: Goal[]): { id: string, position: { x: number, y: number } }[] => {
    if (goals.length === 0) return [];

    // 1. Build Tree Structure (Using primary parent only for layout structure)
    const nodeMap = new Map<string, TreeNode>();
    
    // Initialize nodes
    goals.forEach(g => {
        nodeMap.set(g.id, {
            id: g.id,
            children: [],
            width: NODE_WIDTH,
            x: 0,
            y: 0,
            offset: 0
        });
    });

    // Build hierarchy
    const roots: TreeNode[] = [];
    const processedIds = new Set<string>();

    // First pass: link children to primary parents
    goals.forEach(g => {
        const node = nodeMap.get(g.id)!;
        // If has parents, add to the first parent's children
        // Check if parent exists in current set (it should)
        const parentId = g.parentIds && g.parentIds.length > 0 ? g.parentIds[0] : null;
        
        if (parentId && nodeMap.has(parentId)) {
            const parent = nodeMap.get(parentId)!;
            parent.children.push(node);
        } else {
            roots.push(node);
        }
    });

    // 2. Calculate Layout (Recursive)
    let nextX = 0;

    // Helper to calculate subtree width and positions
    const layoutNode = (node: TreeNode, depth: number) => {
        node.y = depth * LEVEL_HEIGHT;

        if (node.children.length === 0) {
            // Leaf node
            node.x = nextX;
            nextX += NODE_WIDTH;
        } else {
            // Branch node
            node.children.forEach(child => layoutNode(child, depth + 1));
            
            // Center parent over children
            const firstChild = node.children[0];
            const lastChild = node.children[node.children.length - 1];
            const childrenCenter = (firstChild.x + lastChild.x) / 2;
            
            // Check if we need to shift right (if nextX is ahead of calculated center)
            // Actually, in this simple DFS order (left-to-right), nextX is always updated by children.
            // So if we just finished children, nextX is at the right edge of the last child.
            // But we need to ensure the parent doesn't overlap with previous siblings' subtrees if the children are narrow but parent is wide?
            // Since NODE_WIDTH is fixed and we use nextX, overlap is handled by nextX increment.
            
            // However, we want to center the parent.
            // If childrenCenter < nextX, it means the children are "to the left" of where a new node would start.
            // But since we just laid them out, they are exactly where they should be.
            // The only issue is if the children are too compacted to the left, and the parent needs to be further right? 
            // No, parent is centered.
            
            // What if the parent collides with a previous neighbor at the same level?
            // Since we process left-to-right, we only care about left neighbors.
            // But wait, `nextX` tracks the right-most edge of the *entire* layout so far (at the deepest level usually).
            // This is a simplification. Standard Reingold-Tilford uses contours.
            
            // Let's stick to a simpler logic:
            // 1. Place children.
            // 2. Place parent at center of children.
            // 3. If parent.x < nextX_at_this_level, shift parent and children?
            //    This gets complicated.
            
            // Alternative Simple Strategy:
            // Just use the accumulated nextX.
            // If children center is to the right of nextX, great.
            // If children center is to the left of nextX (impossible in this DFS?), we might need to shift.
            
            // Actually, let's just use the children's center.
            node.x = childrenCenter;
            
            // BUT, if this node is a second child, and its children are few, 
            // its calculated X might be too close to the previous sibling.
            // We need to ensure node.x >= nextX_of_current_level.
            
            // To solve this simply:
            // We just ensure that for every leaf, we increment global nextX.
            // Parent is centered. This might cause parent to overlap if parents are wide?
            // Goals are fixed width. So if children don't overlap, parents (centered) won't overlap usually,
            // unless a parent has 1 child and the neighbor has 1 child, distance is 1 node width.
            
            // Let's add a safe gap between subtrees.
            // After processing a node and its children, we ensure nextX is at least past this node?
            // The `nextX` variable in this recursive function acts as a global cursor for the "frontier".
            
            // Improvement: Shift subtree if needed.
            const limit = nextX - NODE_WIDTH; // Previous node's right edge roughly
            if (node.x < limit) {
                // This shouldn't happen with the leaf-driven nextX approach 
                // unless we manually moved x left.
                // But since x is average of children, and children are placed at current nextX...
                // x will always be >= children[0].x >= old_nextX.
            }
        }
    };
    
    // Handle multiple roots
    const result: { id: string, position: { x: number, y: number } }[] = [];
    
    // Sort roots by some criteria if needed (e.g., creation time or current X) to prevent random jumping
    // Let's sort by current X position to keep relative order roughly similar
    // We need to access original goal data for this.
    const rootGoals = roots.map(r => ({ node: r, goal: goals.find(g => g.id === r.id)! }));
    rootGoals.sort((a, b) => a.goal.position.x - b.goal.position.x);

    rootGoals.forEach(({ node }) => {
        layoutNode(node, 0);
        // Add a gap between separate trees
        nextX += 100;
    });

    // Flatten to result
    const addToResult = (node: TreeNode) => {
        result.push({
            id: node.id,
            position: { x: node.x, y: node.y }
        });
        node.children.forEach(addToResult);
    };

    roots.forEach(addToResult);

    return result;
};
