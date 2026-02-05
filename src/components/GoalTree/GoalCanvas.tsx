import React, { useState, useRef, useMemo } from 'react';
import { useGameStore, Goal } from '../../store/gameStore';
import { GoalNode } from './GoalNode';
import { X, Plus, Locate } from 'lucide-react';

interface GoalCanvasProps {
  onClose: () => void;
}

export const GoalCanvas: React.FC<GoalCanvasProps> = ({ onClose }) => {
  const { 
    goals, 
    updateGoal, 
    activeGoalId, 
    setActiveGoal, 
    toggleGoalToday, 
    addGoal, 
    deleteGoal 
  } = useGameStore();

  const [view, setView] = useState({ x: window.innerWidth / 2, y: 100, scale: 1 });
  const [isPanning, setIsPanning] = useState(false);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [connectingId, setConnectingId] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 }); // Screen coords
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 }); // Screen coords for line
  
  const [hoveredTargetId, setHoveredTargetId] = useState<string | null>(null);
  
  const containerRef = useRef<HTMLDivElement>(null);

  // Helper to convert screen to world coordinates
  const screenToWorld = (sx: number, sy: number) => {
    return {
      x: (sx - view.x) / view.scale,
      y: (sy - view.y) / view.scale
    };
  };

  const handleWheel = (e: React.WheelEvent) => {
    // Zoom
    e.stopPropagation();
    const zoomSensitivity = 0.001;
    const newScale = Math.min(Math.max(view.scale - e.deltaY * zoomSensitivity, 0.2), 3);
    setView(v => ({ ...v, scale: newScale }));
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    // Centralized Event Handling
    const target = e.target as HTMLElement;
    const nodeEl = target.closest('[data-type="node"]');
    const handleEl = target.closest('[data-type="handle"]');
    
    // Always capture pointer on the container to ensure we receive move/up events
    containerRef.current?.setPointerCapture(e.pointerId);

    if (e.button === 0 && handleEl) {
        // Start Connecting
        const id = handleEl.getAttribute('data-id');
        if (id) {
            setConnectingId(id);
            setCursorPos({ x: e.clientX, y: e.clientY });
            e.preventDefault();
            e.stopPropagation(); // Stop propagation to prevent panning start
        }
    } else if (e.button === 0 && nodeEl) {
        // Start Dragging Node
        const id = nodeEl.getAttribute('data-id');
        if (id) {
            setDraggingId(id);
            setDragStart({ x: e.clientX, y: e.clientY });
            e.preventDefault();
        }
    } else if (e.button === 1 || e.button === 2 || e.button === 0) {
        // Pan
        setIsPanning(true);
        setDragStart({ x: e.clientX, y: e.clientY });
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (draggingId) {
      const dx = (e.clientX - dragStart.x) / view.scale;
      const dy = (e.clientY - dragStart.y) / view.scale;
      
      const goal = goals.find(g => g.id === draggingId);
      if (goal) {
        updateGoal(draggingId, {
          position: {
            x: goal.position.x + dx,
            y: goal.position.y + dy
          }
        });
      }
      setDragStart({ x: e.clientX, y: e.clientY });
    } else if (connectingId) {
       // Force re-render for line update
       setCursorPos({ x: e.clientX, y: e.clientY });
       
       // Hit Test for highlighting
       const worldPos = screenToWorld(e.clientX, e.clientY);
       const target = goals.find(g => {
         if (g.id === connectingId) return false;
         return (
           worldPos.x >= g.position.x && 
           worldPos.x <= g.position.x + 220 &&
           worldPos.y >= g.position.y &&
           worldPos.y <= g.position.y + 150
         );
       });
       setHoveredTargetId(target ? target.id : null);
    } else if (isPanning) {
      const dx = e.clientX - dragStart.x;
      const dy = e.clientY - dragStart.y;
      setView(v => ({ ...v, x: v.x + dx, y: v.y + dy }));
      setDragStart({ x: e.clientX, y: e.clientY });
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    // Only handle context menu if not dragging or connecting
    if (connectingId) {
        setConnectingId(null);
        setHoveredTargetId(null);
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    containerRef.current?.releasePointerCapture(e.pointerId);
    
    if (draggingId) {
      setDraggingId(null);
    } else if (connectingId) {
      // Hit Test
      const worldPos = screenToWorld(e.clientX, e.clientY);
      // We check all nodes to see if we dropped on one
      const target = goals.find(g => {
        if (g.id === connectingId) return false; // Can't link to self
        return (
          worldPos.x >= g.position.x && 
          worldPos.x <= g.position.x + 220 &&
          worldPos.y >= g.position.y &&
          worldPos.y <= g.position.y + 150 // Increased hit area height
        );
      });

      if (target) {
        // We are dragging FROM connectingId TO target.id
        // So target.id should be the PARENT of connectingId?
        // OR connectingId should be the PARENT of target.id?
        
        // Visual Logic: "Drag to link to child" tooltip on handle.
        // So we are dragging FROM Parent Handle TO Child Node.
        // connectingId = Parent
        // target.id = Child
        
        // Check if connection already exists to avoid duplicates
        if (!target.parentIds.includes(connectingId)) {
            const newParentIds = [...target.parentIds, connectingId];
            updateGoal(target.id, { parentIds: newParentIds });
        }
      }
      setConnectingId(null);
      setHoveredTargetId(null);
    } else if (isPanning) {
      setIsPanning(false);
    }
  };

  const handleAddGoal = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent event from bubbling to canvas
    console.log("handleAddGoal clicked");
    
    try {
        let content: string | null = null;
        try {
            content = prompt("Enter goal content:");
        } catch (err) {
            console.warn("Prompt failed, using default:", err);
            content = "New Goal";
        }

        if (content) {
            // Safe center calculation
            const cx = window.innerWidth / 2;
            const cy = window.innerHeight / 2;
            let pos = { x: 0, y: 0 };
            
            try {
                const center = screenToWorld(cx, cy);
                pos = { x: center.x - 110, y: center.y - 40 };
            } catch (err) {
                console.warn("screenToWorld failed, using zero:", err);
            }

            const newId = addGoal(content, null, pos);
            console.log("Goal added:", newId);
            
            // Optional: Set as active immediately?
            // setActiveGoal(newId); 
        }
    } catch (error) {
        console.error("Critical error in handleAddGoal:", error);
        alert("Error creating goal. Check console.");
    }
  };
  
  const centerOnActive = () => {
      const active = goals.find(g => g.id === activeGoalId);
      if (active) {
          setView({
              x: window.innerWidth / 2 - active.position.x * view.scale - 110 * view.scale,
              y: window.innerHeight / 2 - active.position.y * view.scale - 50 * view.scale,
              scale: 1
          });
      }
  };

  // Draw Lines
  const connections = useMemo(() => {
    return goals.flatMap(g => {
      if (!g.parentIds || g.parentIds.length === 0) return [];
      return g.parentIds.map(parentId => {
          const parent = goals.find(p => p.id === parentId);
          if (!parent) return null;
          return { from: parent, to: g };
      }).filter(Boolean);
    }) as { from: Goal, to: Goal }[];
  }, [goals]);

  return (
    <div className="fixed inset-0 z-50 bg-[#0f172a] overflow-hidden text-white font-sans animate-in fade-in duration-300">
      {/* Toolbar */}
      <div className="absolute top-4 left-4 z-50 flex gap-2">
        <button onClick={onClose} className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition">
          <X size={24} />
        </button>
        <button onClick={handleAddGoal} className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition flex items-center gap-2" title="Add New Goal">
          <Plus size={24} />
          <span className="text-sm font-medium pr-2">New Goal</span>
        </button>
        <button onClick={centerOnActive} className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition" title="Locate Active">
            <Locate size={24} />
        </button>
        <div className="bg-black/40 px-4 py-2 rounded-full text-xs text-white/50 border border-white/5 pointer-events-none select-none">
            Drag background to pan • Scroll to zoom • Drag handles to link
        </div>
      </div>

      {/* Canvas Area */}
      <div 
        ref={containerRef}
        className="w-full h-full cursor-grab active:cursor-grabbing touch-none"
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
          {/* SVG Layer for Connections */}
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
             
             {/* Temporary Connection Line */}
             {connectingId && (
                (() => {
                   const startNode = goals.find(g => g.id === connectingId);
                   if (!startNode) return null;
                   
                   const startX = startNode.position.x + 110;
                   const startY = startNode.position.y + 80; // Approximate handle position (bottom center)
                   const worldCursor = screenToWorld(cursorPos.x, cursorPos.y);
                   
                   return (
                      <line 
                        x1={startX} 
                        y1={startY} 
                        x2={worldCursor.x} 
                        y2={worldCursor.y} 
                        stroke="#fbbf24" 
                        strokeWidth="2" 
                        strokeDasharray="5,5" 
                        pointerEvents="none"
                      />
                   );
                })()
             )}
          </svg>

          {/* Nodes Layer */}
          <div className="pointer-events-auto">
              {goals.map(goal => (
                <GoalNode
                  key={goal.id}
                  goal={goal}
                  isActive={goal.id === activeGoalId}
                  isSelected={false}
                  isTarget={goal.id === hoveredTargetId}
                  onToggleToday={() => toggleGoalToday(goal.id)}
                  onSetActive={() => setActiveGoal(goal.id)}
                  onDelete={() => deleteGoal(goal.id)}
                  onUnlink={() => useGameStore.getState().unlinkGoal(goal.id)}
                />
              ))}
          </div>
        </div>
      </div>
    </div>
  );
};
