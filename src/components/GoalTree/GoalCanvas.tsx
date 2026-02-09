import React, { useState, useRef, useMemo, useEffect } from 'react';
import { useGameStore, Goal } from '../../store/gameStore';
import { GoalNode } from './GoalNode';
import { CustomPrompt } from '../CustomPrompt';
import { ProjectSidebar } from './ProjectSidebar';
import { getSubTreeIds, getAncestors } from '../../utils/treeHelpers';
import { calculateTreeLayout } from '../../utils/autoLayout';
import { X, Plus, Locate, Home, ChevronRight as ChevronRightIcon, LayoutTemplate } from 'lucide-react';

interface GoalCanvasProps {
  onClose: () => void;
}

// Helper: Check if line segments intersect
const segmentsIntersect = (
    a: {x: number, y: number}, b: {x: number, y: number},
    c: {x: number, y: number}, d: {x: number, y: number}
) => {
    const det = (b.x - a.x) * (d.y - c.y) - (d.x - c.x) * (b.y - a.y);
    if (det === 0) return false;
    const lambda = ((d.y - c.y) * (d.x - a.x) + (c.x - d.x) * (d.y - a.y)) / det;
    const gamma = ((a.y - b.y) * (d.x - a.x) + (b.x - a.x) * (d.y - a.y)) / det;
    return (0 < lambda && lambda < 1) && (0 < gamma && gamma < 1);
};

export const GoalCanvas: React.FC<GoalCanvasProps> = ({ onClose }) => {
  const { 
    goals, 
    updateGoal, 
    updateGoals,
    activeGoalId, 
    setActiveGoal, 
    toggleGoalToday, 
    addGoal, 
    deleteGoal,
    deleteGoals,
    focusedGoalId,
    setFocusedGoalId,
    scrollToId,
    setScrollToId,
    selectedGoalIds,
    setSelectedGoalIds,
    disconnectGoal,
    unlinkGoal,
    undo,
    redo,
    snapshot
  } = useGameStore();

  // View State
  const [view, setView] = useState({ x: window.innerWidth / 2, y: 100, scale: 1 });
  
  // Interaction State
  type InteractionMode = 'none' | 'pan' | 'select' | 'drag' | 'connect' | 'cut';
  const [mode, setMode] = useState<InteractionMode>('none');
  
  // Interaction Data
  const [startPos, setStartPos] = useState({ x: 0, y: 0 }); // Screen coords at start
  const [currentPos, setCurrentPos] = useState({ x: 0, y: 0 }); // Screen coords current
  
  // Selection
  const [selectionBox, setSelectionBox] = useState<{start: {x:number, y:number}, current: {x:number, y:number}} | null>(null);
  
  // Cutting
  const [cutLine, setCutLine] = useState<{start: {x:number, y:number}, end: {x:number, y:number}} | null>(null);
  
  // Connecting
  const [connectingId, setConnectingId] = useState<string | null>(null);
  const [hoveredTargetId, setHoveredTargetId] = useState<string | null>(null);

  const [isPromptOpen, setIsPromptOpen] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);

  // Global Shortcuts (Undo/Redo/Delete)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        // Ignore if typing in an input
        if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
        
        // Undo/Redo
        if (e.ctrlKey && (e.key === 'z' || e.key === 'Z')) {
            e.preventDefault();
            if (e.shiftKey) {
                redo();
            } else {
                undo();
            }
        }
        
        // Delete
        if (e.key === 'Delete' || e.key === 'Backspace') {
            if (selectedGoalIds.length > 0) {
                deleteGoals(selectedGoalIds);
            }
        }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, selectedGoalIds, deleteGoals]);

  // Focus Mode Logic
  const visibleGoals = useMemo(() => {
    if (!focusedGoalId) return goals;
    const ids = getSubTreeIds(focusedGoalId, goals);
    return goals.filter(g => ids.has(g.id));
  }, [goals, focusedGoalId]);

  const breadcrumbs = useMemo(() => {
    if (!focusedGoalId) return [];
    return getAncestors(focusedGoalId, goals);
  }, [focusedGoalId, goals]);

  // Handle ScrollToId
  useEffect(() => {
    if (scrollToId) {
        const target = goals.find(g => g.id === scrollToId);
        if (target) {
            const targetX = target.position.x;
            const targetY = target.position.y;
            setView({
                x: window.innerWidth / 2 - targetX * view.scale - 110 * view.scale,
                y: window.innerHeight / 2 - targetY * view.scale - 50 * view.scale,
                scale: view.scale
            });
            setScrollToId(null);
        }
    }
  }, [scrollToId, goals, view.scale, setScrollToId]);

  // Coordinate Helpers
  const screenToWorld = (sx: number, sy: number) => ({
      x: (sx - view.x) / view.scale,
      y: (sy - view.y) / view.scale
  });

  const worldToScreen = (wx: number, wy: number) => ({
      x: wx * view.scale + view.x,
      y: wy * view.scale + view.y
  });

  // Event Handlers
  const handleWheel = (e: React.WheelEvent) => {
    e.stopPropagation();
    const zoomSensitivity = 0.001;
    const newScale = Math.min(Math.max(view.scale - e.deltaY * zoomSensitivity, 0.2), 3);
    setView(v => ({ ...v, scale: newScale }));
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    const target = e.target as HTMLElement;
    const nodeEl = target.closest('[data-type="node"]');
    const handleEl = target.closest('[data-type="handle"]');
    
    containerRef.current?.setPointerCapture(e.pointerId);
    setStartPos({ x: e.clientX, y: e.clientY });
    setCurrentPos({ x: e.clientX, y: e.clientY });

    // Middle Mouse -> PAN
    if (e.button === 1) {
        setMode('pan');
        return;
    }

    // Right Mouse -> CUT
    if (e.button === 2) {
        setMode('cut');
        setCutLine({ 
            start: screenToWorld(e.clientX, e.clientY), 
            end: screenToWorld(e.clientX, e.clientY) 
        });
        return;
    }

    // Left Mouse
    if (e.button === 0) {
        if (handleEl) {
            // Start Connection
            const id = handleEl.getAttribute('data-id');
            if (id) {
                setConnectingId(id);
                setMode('connect');
                e.stopPropagation();
            }
        } else if (nodeEl) {
            // Start Dragging Node
            const id = nodeEl.getAttribute('data-id');
            if (id) {
                // Selection Logic
                let newSelection = [...selectedGoalIds];
                if (e.shiftKey) {
                    if (newSelection.includes(id)) {
                        newSelection = newSelection.filter(sid => sid !== id);
                    } else {
                        newSelection.push(id);
                    }
                } else {
                    if (!newSelection.includes(id)) {
                        newSelection = [id];
                    }
                }
                setSelectedGoalIds(newSelection);
                
                // SNAPSHOT for Undo History (Atomic Drag)
                snapshot();

                setMode('drag');
                e.stopPropagation();
            }
        } else {
            // Background Click -> Start Selection Box
            setMode('select');
            setSelectionBox({ 
                start: { x: e.clientX, y: e.clientY }, 
                current: { x: e.clientX, y: e.clientY } 
            });
            // Clear selection if not holding shift? 
            // User requested: "Left click box select". Usually implies clearing unless Shift.
            if (!e.shiftKey) {
                setSelectedGoalIds([]);
            }
        }
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    const dx = e.clientX - currentPos.x;
    const dy = e.clientY - currentPos.y;
    setCurrentPos({ x: e.clientX, y: e.clientY });

    if (mode === 'pan') {
        setView(v => ({ ...v, x: v.x + dx, y: v.y + dy }));
    } 
    else if (mode === 'drag') {
        // Move all selected nodes
        const worldDx = dx / view.scale;
        const worldDy = dy / view.scale;
        
        const updates = selectedGoalIds.map(id => {
            const goal = goals.find(g => g.id === id);
            if (!goal) return null;
            return {
                id,
                changes: {
                    position: {
                        x: goal.position.x + worldDx,
                        y: goal.position.y + worldDy
                    }
                }
            };
        }).filter(Boolean) as {id: string, changes: Partial<Goal>}[];
        
        if (updates.length > 0) {
            // IMPORTANT: Skip history snapshot during drag updates to avoid spamming history stack
            updateGoals(updates, true);
        }
    }
    else if (mode === 'select' && selectionBox) {
        setSelectionBox({ ...selectionBox, current: { x: e.clientX, y: e.clientY } });
    }
    else if (mode === 'connect' && connectingId) {
        // Hit Test
        const worldPos = screenToWorld(e.clientX, e.clientY);
        const target = visibleGoals.find(g => {
            if (g.id === connectingId) return false;
            return (
                worldPos.x >= g.position.x && 
                worldPos.x <= g.position.x + 220 &&
                worldPos.y >= g.position.y &&
                worldPos.y <= g.position.y + 150
            );
        });
        setHoveredTargetId(target ? target.id : null);
    }
    else if (mode === 'cut') {
        const worldPos = screenToWorld(e.clientX, e.clientY);
        const prevWorldPos = screenToWorld(e.clientX - dx, e.clientY - dy); // Approx previous frame world pos
        
        // Update visual line
        setCutLine({ start: prevWorldPos, end: worldPos });
        
        // Check intersections with all connections
        visibleGoals.forEach(child => {
            child.parentIds.forEach(parentId => {
                const parent = goals.find(g => g.id === parentId);
                if (!parent) return;
                
                // Connection Line Segment
                // Simplified: Start (Parent Center Bottom) -> End (Child Center Top)
                const pStart = { x: parent.position.x + 110, y: parent.position.y + 80 }; // Handle
                const pEnd = { x: child.position.x + 110, y: child.position.y }; // Top center
                
                // Cut Line Segment (Previous frame mouse -> Current mouse)
                // We use the movement vector as the blade
                if (segmentsIntersect(prevWorldPos, worldPos, pStart, pEnd)) {
                    disconnectGoal(child.id, parent.id);
                }
            });
        });
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    containerRef.current?.releasePointerCapture(e.pointerId);

    if (mode === 'select' && selectionBox) {
        // Calculate selection
        // Normalize box
        const x1 = Math.min(selectionBox.start.x, selectionBox.current.x);
        const x2 = Math.max(selectionBox.start.x, selectionBox.current.x);
        const y1 = Math.min(selectionBox.start.y, selectionBox.current.y);
        const y2 = Math.max(selectionBox.start.y, selectionBox.current.y);
        
        const newSelected = visibleGoals.filter(g => {
            const screenPos = worldToScreen(g.position.x, g.position.y);
            // Check if center or any part is in box? Let's check center point for simplicity + size
            // Let's use the node center
            const cx = screenPos.x + 110 * view.scale;
            const cy = screenPos.y + 75 * view.scale;
            return cx >= x1 && cx <= x2 && cy >= y1 && cy <= y2;
        }).map(g => g.id);
        
        // Merge if shift?
        if (e.shiftKey) {
            const set = new Set([...selectedGoalIds, ...newSelected]);
            setSelectedGoalIds(Array.from(set));
        } else {
            setSelectedGoalIds(newSelected);
        }
        setSelectionBox(null);
    }
    else if (mode === 'connect' && connectingId) {
         // Finalize connection
         const worldPos = screenToWorld(e.clientX, e.clientY);
         const target = visibleGoals.find(g => {
             if (g.id === connectingId) return false;
             return (
                 worldPos.x >= g.position.x && 
                 worldPos.x <= g.position.x + 220 &&
                 worldPos.y >= g.position.y &&
                 worldPos.y <= g.position.y + 150
             );
         });
         
         if (target) {
             if (!target.parentIds.includes(connectingId)) {
                 updateGoal(target.id, { parentIds: [...target.parentIds, connectingId] });
             }
         }
         setConnectingId(null);
         setHoveredTargetId(null);
    }
    
    setMode('none');
    setCutLine(null);
  };

  const handleContextMenu = (e: React.MouseEvent) => {
      e.preventDefault();
      // Right click is now used for CUT, so we suppress context menu
  };

  const handleSelectProject = (id: string) => {
    setFocusedGoalId(null); // Exit focus mode
    const node = goals.find(g => g.id === id);
    if (node) {
        setView({
           x: window.innerWidth / 2 - node.position.x * view.scale - 110 * view.scale,
           y: 100, // Top align
           scale: 1
        });
    }
  };

  // Auto Layout
  const handleAutoLayout = () => {
      // updateGoals will snapshot by default, making this atomic
      const updates = calculateTreeLayout(goals);
      const goalUpdates = updates.map(u => ({
          id: u.id,
          changes: { position: u.position }
      }));
      updateGoals(goalUpdates);
  };

  // Render Helpers
  const connections = useMemo(() => {
    return visibleGoals.flatMap(g => {
      if (!g.parentIds || g.parentIds.length === 0) return [];
      return g.parentIds.map(parentId => {
          const parent = visibleGoals.find(p => p.id === parentId);
          if (!parent) return null;
          return { from: parent, to: g };
      }).filter(Boolean);
    }) as { from: Goal, to: Goal }[];
  }, [visibleGoals]);

  return (
    <div className="fixed inset-0 z-50 bg-[#0f172a] overflow-hidden text-white font-sans animate-in fade-in duration-300">
      
      <ProjectSidebar goals={goals} onSelectProject={handleSelectProject} />

      {/* Breadcrumbs */}
      {focusedGoalId && (
        <div className="absolute top-0 left-0 right-0 h-14 bg-slate-900/80 backdrop-blur-md border-b border-white/10 z-40 flex items-center px-4 md:pl-72 animate-in slide-in-from-top">
            <button 
                onClick={() => setFocusedGoalId(null)}
                className="p-1 hover:bg-white/10 rounded mr-2 text-white/50 hover:text-white transition"
            >
                <Home size={18} />
            </button>
            <div className="flex items-center gap-1 text-sm overflow-hidden">
                {breadcrumbs.map((crumb, i) => (
                    <React.Fragment key={crumb.id}>
                        {i > 0 && <ChevronRightIcon size={14} className="text-white/30" />}
                        <button 
                            onClick={() => setFocusedGoalId(crumb.id)}
                            className="hover:text-white text-white/70 truncate max-w-[150px] transition"
                        >
                            {crumb.content}
                        </button>
                    </React.Fragment>
                ))}
            </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="absolute top-4 right-4 z-50 flex gap-2">
        <button onClick={handleAutoLayout} className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition" title="Auto Layout">
            <LayoutTemplate size={24} />
        </button>
        <button onClick={(e) => { e.stopPropagation(); setIsPromptOpen(true); }} className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition flex items-center gap-2" title="Add New Goal">
          <Plus size={24} />
          <span className="text-sm font-medium pr-2">New Goal</span>
        </button>
        <button onClick={() => {
            const active = visibleGoals.find(g => g.id === activeGoalId);
            if (active) {
                setView({
                    x: window.innerWidth / 2 - active.position.x * view.scale - 110 * view.scale,
                    y: window.innerHeight / 2 - active.position.y * view.scale - 50 * view.scale,
                    scale: 1
                });
            }
        }} className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition" title="Locate Active">
            <Locate size={24} />
        </button>
        <button onClick={onClose} className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition">
          <X size={24} />
        </button>
      </div>
      
      <div className="absolute bottom-4 right-4 bg-black/40 px-4 py-2 rounded-full text-xs text-white/50 border border-white/5 pointer-events-none select-none z-40">
            Left: Box Select/Drag • Middle: Pan • Right: Cut Links • Scroll: Zoom • Undo: Ctrl+Z
      </div>

      <CustomPrompt 
        isOpen={isPromptOpen}
        title="Create New Goal"
        onConfirm={(content) => {
            if (content && content.trim()) {
                const center = screenToWorld(window.innerWidth/2, window.innerHeight/2);
                addGoal(content, focusedGoalId, { x: center.x - 110, y: center.y - 40 });
            }
            setIsPromptOpen(false);
        }}
        onCancel={() => setIsPromptOpen(false)}
      />

      {/* Canvas */}
      <div 
        ref={containerRef}
        className={`w-full h-full touch-none outline-none ${mode === 'pan' ? 'cursor-grabbing' : mode === 'cut' ? 'cursor-crosshair' : 'cursor-default'}`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onWheel={handleWheel}
        onContextMenu={handleContextMenu}
      >
        <div 
          style={{ 
            transform: `translate(${view.x}px, ${view.y}px) scale(${view.scale})`,
            transformOrigin: '0 0',
            width: '100%',
            height: '100%',
            position: 'absolute',
            pointerEvents: 'none' 
          }}
        >
          {/* Connections Layer */}
          <svg className="absolute top-0 left-0 w-full h-full overflow-visible pointer-events-none">
             <defs>
                <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
                  <polygon points="0 0, 10 3.5, 0 7" fill="#475569" />
                </marker>
             </defs>
             {connections.map((conn, i) => {
                const startX = conn.from.position.x + 110; 
                const startY = conn.from.position.y + 80; 
                const endX = conn.to.position.x + 110;
                const endY = conn.to.position.y;
                const cp1y = startY + 50;
                const cp2y = endY - 50;
                
                return (
                   <path 
                     key={i}
                     d={`M ${startX} ${startY} C ${startX} ${cp1y}, ${endX} ${cp2y}, ${endX} ${endY}`}
                     stroke="#475569"
                     strokeWidth="2"
                     fill="none"
                     markerEnd="url(#arrowhead)"
                   />
                );
             })}
             
             {/* Connecting Line */}
             {mode === 'connect' && connectingId && (
                (() => {
                   const startNode = visibleGoals.find(g => g.id === connectingId);
                   if (!startNode) return null;
                   const startX = startNode.position.x + 110;
                   const startY = startNode.position.y + 80;
                   const worldCursor = screenToWorld(currentPos.x, currentPos.y);
                   return (
                      <line 
                        x1={startX} y1={startY} x2={worldCursor.x} y2={worldCursor.y} 
                        stroke="#fbbf24" strokeWidth="2" strokeDasharray="5,5" 
                      />
                   );
                })()
             )}
             
             {/* Cut Line Trail */}
             {mode === 'cut' && cutLine && (
                 <line 
                    x1={cutLine.start.x} y1={cutLine.start.y}
                    x2={cutLine.end.x} y2={cutLine.end.y}
                    stroke="#ef4444" strokeWidth="3" strokeLinecap="round"
                 />
             )}
          </svg>

          {/* Nodes Layer */}
          <div className="pointer-events-auto">
              {visibleGoals.map(goal => (
                <GoalNode
                  key={goal.id}
                  goal={goal}
                  isActive={goal.id === activeGoalId}
                  isSelected={selectedGoalIds.includes(goal.id)}
                  isTarget={goal.id === hoveredTargetId}
                  onToggleToday={() => toggleGoalToday(goal.id)}
                  onSetActive={() => setActiveGoal(goal.id)}
                  onDelete={() => {
                      if (selectedGoalIds.includes(goal.id)) {
                          deleteGoals(selectedGoalIds);
                      } else {
                          deleteGoal(goal.id);
                      }
                  }}
                  onUnlink={() => unlinkGoal(goal.id)}
                  onFocus={() => setFocusedGoalId(goal.id)}
                />
              ))}
          </div>
        </div>

        {/* UI Overlay for Selection Box */}
        {mode === 'select' && selectionBox && (
            <div 
                className="absolute border border-blue-500 bg-blue-500/20 pointer-events-none z-50"
                style={{
                    left: Math.min(selectionBox.start.x, selectionBox.current.x),
                    top: Math.min(selectionBox.start.y, selectionBox.current.y),
                    width: Math.abs(selectionBox.current.x - selectionBox.start.x),
                    height: Math.abs(selectionBox.current.y - selectionBox.start.y),
                }}
            />
        )}
      </div>
    </div>
  );
};
