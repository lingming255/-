import React, { useRef, useEffect } from 'react';
import { TimePhase, WeatherType } from '../types';
import { ViewMode, StairStyle, EnvironmentType, ColorTheme } from '../store/gameStore';

interface AscensionCanvasProps {
  timePhase: TimePhase;
  weather: WeatherType;
  viewMode?: ViewMode;
  stairStyle?: StairStyle;
  environment?: EnvironmentType;
  colorTheme?: ColorTheme;
  className?: string;
}

const AscensionCanvas: React.FC<AscensionCanvasProps> = ({ 
  timePhase, 
  weather, 
  viewMode = 'diagonal', 
  stairStyle = 'minimal',
  environment = 'countryside',
  colorTheme = 'midnight',
  className 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>(0);
  const scrollRef = useRef<number>(0);

  const backgroundSeed = useRef<number[]>([]);
    const farBackgroundSeed = useRef<number[]>([]);

    useEffect(() => {
        // Initialize background seed
        backgroundSeed.current = Array.from({ length: 50 }, () => Math.random());
        farBackgroundSeed.current = Array.from({ length: 50 }, () => Math.random());
    }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let particles: Array<{x: number, y: number, speed: number, size: number}> = [];
    
    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      particles = Array.from({ length: 100 }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        speed: 2 + Math.random() * 5,
        size: Math.random() * 2
      }));
    };
    window.addEventListener('resize', handleResize);
    handleResize();

    const drawLayer = (seed: number[], color: string, parallaxSpeed: number, scaleY: number, offsetY: number = 0) => {
        ctx.fillStyle = color;
        
        // Parallax Offset
        // We use scrollRef.current to shift the background horizontally
        const parallaxOffset = (scrollRef.current * parallaxSpeed) % canvas.width;
        
        ctx.save();
        ctx.translate(-parallaxOffset, offsetY);
        
        // Draw twice to handle seamless looping
        for(let loop = 0; loop < 2; loop++) {
            const loopOffset = loop * canvas.width;
            
            if (environment === 'countryside') {
                ctx.beginPath();
                ctx.moveTo(loopOffset, canvas.height);
                for(let x=0; x<=canvas.width; x+=50) {
                    ctx.lineTo(loopOffset + x, canvas.height - (100 + Math.sin(x/200)*50) * scaleY);
                }
                ctx.lineTo(loopOffset + canvas.width, canvas.height);
                ctx.fill();
            } else if (environment === 'city') {
                ctx.beginPath();
                let x = 0;
                let seedIndex = 0;
                while(x < canvas.width) {
                    const rand1 = seed[seedIndex % seed.length];
                    const rand2 = seed[(seedIndex + 1) % seed.length];
                    seedIndex += 2;
                    
                    const w = (30 + rand1 * 50);
                    const h = (50 + rand2 * 150) * scaleY;
                    ctx.rect(loopOffset + x, canvas.height - h, w, h);
                    x += w + 5;
                }
                ctx.fill();
            } else if (environment === 'mountain') {
                ctx.beginPath();
                ctx.moveTo(loopOffset, canvas.height);
                let seedIndex = 0;
                for(let x=0; x<=canvas.width; x+=100) {
                    const rand = seed[seedIndex % seed.length];
                    seedIndex++;
                    ctx.lineTo(loopOffset + x + 50, canvas.height - (200 + rand*100) * scaleY);
                    ctx.lineTo(loopOffset + x + 100, canvas.height);
                }
                ctx.fill();
            } else if (environment === 'desert') {
                ctx.beginPath();
                ctx.moveTo(loopOffset, canvas.height);
                for(let x=0; x<=canvas.width; x+=10) {
                    ctx.lineTo(loopOffset + x, canvas.height - (50 + Math.sin(x/100)*20 + Math.sin(x/300)*40) * scaleY);
                }
                ctx.lineTo(loopOffset + canvas.width, canvas.height);
                ctx.fill();
            } else if (environment === 'beach') {
                // For beach, maybe just horizon line
                 if (scaleY > 0.8) { // Only draw water for near layer
                    ctx.fillRect(loopOffset, canvas.height - 100 * scaleY, canvas.width, 100 * scaleY);
                 }
            } else if (environment === 'rainforest') {
                ctx.beginPath();
                let seedIndex = 0;
                for(let x=0; x<canvas.width; x+=20) {
                    const rand = seed[seedIndex % seed.length];
                    seedIndex++;
                    const h = (50 + rand * 50) * scaleY;
                    ctx.moveTo(loopOffset + x, canvas.height);
                    ctx.lineTo(loopOffset + x, canvas.height - h);
                    ctx.arc(loopOffset + x, canvas.height - h, 15 * scaleY, 0, Math.PI*2);
                }
                ctx.fill();
            }
        }
        ctx.restore();
    };

    const drawBackground = () => {
        const night = timePhase === 'night';
        // Palette Strategy:
        // Use stair colors as base but shift hue/saturation for background to ensure harmony
        // Stair Front Color is the "Main" color
        
        let bgBaseColor = '#64748b'; // Default Slate-500
        let colorFar = '#94a3b8';

        if (colorTheme === 'bamboo') {
            // Bamboo Theme
            if (stairStyle === 'ethereal') {
                 bgBaseColor = night ? '#064e3b' : '#a7f3d0'; // Emerald-950 : Emerald-200
            } else {
                 bgBaseColor = night ? '#065f46' : '#6ee7b7'; // Emerald-900 : Emerald-300
            }
            colorFar = night ? '#022c22' : '#d1fae5'; // Emerald-950 : Emerald-100
        } else if (colorTheme === 'sunset') {
            // Sunset Theme
            if (stairStyle === 'ethereal') {
                 bgBaseColor = night ? '#450a0a' : '#fed7aa'; // Red-950 : Orange-200
            } else {
                 bgBaseColor = night ? '#7f1d1d' : '#fdba74'; // Red-900 : Orange-300
            }
            colorFar = night ? '#450a0a' : '#ffedd5'; // Red-950 : Orange-100
        } else {
            // Midnight Theme (Default)
            if (stairStyle === 'ethereal') {
                 bgBaseColor = night ? '#1e1b4b' : '#c7d2fe'; // Indigo-950 : Indigo-200
            } else {
                 bgBaseColor = night ? '#0f172a' : '#94a3b8'; // Slate-900 : Slate-400
            }
            colorFar = night ? '#020617' : '#e2e8f0'; // Slate-950 : Slate-200
        }
        
        const colorNear = bgBaseColor;
        
        // Clear background
        ctx.fillStyle = colorFar;
        // Draw sky gradient handled by parent div, so we just draw objects
        
        // 1. Far Layer (Slower, lighter/more transparent, scaled up slightly)
        // Using a lower opacity for "atmospheric perspective"
        ctx.globalAlpha = 0.4;
        drawLayer(farBackgroundSeed.current, colorFar, 0.5, 1.2, -50);
        ctx.globalAlpha = 0.8;

        // 2. Mid Layer (Standard speed, standard color)
        drawLayer(backgroundSeed.current, colorNear, 1.0, 1.0, 0);
        ctx.globalAlpha = 1.0;
    };

    const drawStairs = (scroll: number) => {
      // Dimensions based on style
      let stepWidth = 300;
      let stepHeight = 40;
      let stepDepth = viewMode === 'diagonal' ? 40 : 0;
      
      if (stairStyle === 'ethereal') {
          stepWidth = 500;
          stepHeight = 60;
          stepDepth = viewMode === 'diagonal' ? 50 : 0;
      } else if (stairStyle === 'solid') {
          stepWidth = 400;
          stepHeight = 80;
          stepDepth = viewMode === 'diagonal' ? 60 : 0;
      }

      // 核心算法：利用斜率计算位移向量
      // 1. 定义台阶的几何尺寸（高度与深度）
      const stepH = stepHeight;
      const stepD = stepDepth;
      
      // 2. 计算斜率 (Slope) = dx / dy
      // 当我们向上攀登时，视觉上台阶是向后退的
      // 对于对角线视角，台阶分布在左上方，所以后退方向应为右下方 (+x, +y)
      // const slope = stepH > 0 ? stepD / stepH : 0; (Unused, removed for clean build)

      const centerX = canvas.width / 2;
      const startY = canvas.height - 100;
      const visibleSteps = Math.ceil(canvas.height / stepHeight) + 5;
      
      // 3. 计算相对位移 (无需取模，实现真正无限滚动)
      // scroll / stepH 代表我们当前“爬”到了第几阶（可以是小数）
      const currentStepProgress = scroll / stepH;
      
      // 4. 确定可见范围
      // 我们需要渲染当前进度附近的台阶
      // 向下多渲染2阶，向上多渲染 visibleSteps 阶
      const startStepIndex = Math.floor(currentStepProgress) - 2;
      const endStepIndex = startStepIndex + visibleSteps + 2;

      const night = timePhase === 'night';
      let colorFront = '#64748b';
      let colorTop = '#e2e8f0';
      let colorSide = '#334155';
      let colorMarker = '#f59e0b'; // Amber

      // Define Color Palettes
      if (colorTheme === 'bamboo') {
          // Bamboo: Green/Stone/Nature
          colorMarker = '#10b981'; // Emerald
          if (night) {
             colorFront = '#064e3b'; // Emerald 900
             colorTop = '#065f46'; // Emerald 800
             colorSide = '#022c22'; // Emerald 950
          } else {
             colorFront = '#34d399'; // Emerald 400
             colorTop = '#6ee7b7'; // Emerald 300
             colorSide = '#10b981'; // Emerald 500
          }
      } else if (colorTheme === 'sunset') {
          // Sunset: Red/Orange/Sand
          colorMarker = '#f43f5e'; // Rose
          if (night) {
             colorFront = '#7f1d1d'; // Red 900
             colorTop = '#991b1b'; // Red 800
             colorSide = '#450a0a'; // Red 950
          } else {
             colorFront = '#fb923c'; // Orange 400
             colorTop = '#fdba74'; // Orange 300
             colorSide = '#f97316'; // Orange 500
          }
      } else {
          // Midnight (Default): Blue/Slate
          if (night) {
             colorFront = '#0f172a'; // Slate 900
             colorTop = '#1e293b'; // Slate 800
             colorSide = '#020617'; // Slate 950
          } else {
             colorFront = '#64748b'; // Slate 500
             colorTop = '#94a3b8'; // Slate 400
             colorSide = '#475569'; // Slate 600
          }
      }

      if (stairStyle === 'ethereal') {
          const opacity = night ? 0.1 : 0.15;
          const strokeOp = night ? 0.3 : 0.4;
          
          // Ethereal Overrides (Use base colors but transparent)
          // We need to convert hex to rgb to apply opacity. 
          // For simplicity, I'll hardcode ethereal variations per theme
          
          let r=0, g=0, b=0;
          if (colorTheme === 'bamboo') { r=50; g=200; b=150; } // Teal-ish
          else if (colorTheme === 'sunset') { r=250; g=150; b=100; } // Orange-ish
          else { r=100; g=150; b=255; } // Blue-ish

          colorFront = night ? `rgba(${r}, ${g}, ${b}, ${opacity})` : `rgba(${r}, ${g}, ${b}, ${opacity})`;
          colorTop = night ? `rgba(${r+20}, ${g+20}, ${b+20}, ${opacity})` : `rgba(${r+20}, ${g+20}, ${b+20}, ${opacity})`;
          colorSide = night ? `rgba(${r-20}, ${g-20}, ${b-20}, ${opacity})` : `rgba(${r-20}, ${g-20}, ${b-20}, ${opacity})`;
          
          ctx.lineWidth = 1;
          ctx.strokeStyle = night ? `rgba(255,255,255,${strokeOp})` : `rgba(0,0,0,${strokeOp})`;
      } else if (stairStyle === 'solid') {
           // Solid uses the palette defined above directly
      }

      // 遍历绝对台阶索引 (Absolute Step Index)
      for (let i = startStepIndex; i < endStepIndex; i++) {
        // 计算该台阶相对于当前视角的“相对索引”
        // 如果 i = 10, currentStepProgress = 10.5, 则 relativeIndex = -0.5 (该台阶已过了一半)
        const relativeIndex = i - currentStepProgress;

        // 计算屏幕坐标
        // y: 随着 relativeIndex 减小 (向上爬), y 增大 (向下移)
        // startY 是基准线
        const y = startY - (relativeIndex * stepH);
        
        // x: 随着 relativeIndex 减小, x 增大 (向右移, 模拟向左上方爬)
        const x = centerX - (relativeIndex * stepD); 

        
        const drawFace = (pathFn: () => void, fill: string, _stroke = false) => {
            ctx.beginPath();
            pathFn();
            ctx.closePath();
            ctx.fillStyle = fill;
            ctx.fill();
            if (stairStyle === 'ethereal') ctx.stroke();
            
            // Edge Highlight for definition
            if (stairStyle === 'solid') {
                ctx.strokeStyle = 'rgba(255,255,255,0.1)';
                ctx.lineWidth = 1;
                ctx.stroke();
            }
        };

        if (viewMode === 'vertical') {
            drawFace(() => {
                ctx.rect(centerX - stepWidth/2, y, stepWidth, stepHeight);
            }, colorFront);
            
            const topY = y;
            const perspectiveOffset = stairStyle === 'ethereal' ? 5 : 10;
            drawFace(() => {
                ctx.moveTo(centerX - stepWidth/2, topY);
                ctx.lineTo(centerX + stepWidth/2, topY);
                ctx.lineTo(centerX + stepWidth/2 - perspectiveOffset, topY - (stepHeight * 0.5));
                ctx.lineTo(centerX - stepWidth/2 + perspectiveOffset, topY - (stepHeight * 0.5));
            }, colorTop);

            if (stairStyle === 'ethereal') {
                ctx.beginPath();
                ctx.moveTo(centerX, y + stepHeight);
                ctx.lineTo(centerX, y + stepHeight + 40); 
                ctx.strokeStyle = ctx.strokeStyle; 
                ctx.stroke();
            }

        } else {
            // Diagonal Mode
            
            // Add slight random width variation for "hand-built" feel
            // Hash function based on index i
            const pseudoRandom = Math.sin(i * 9999);
            const widthVar = stairStyle === 'solid' ? pseudoRandom * 10 : 0;
            const currentWidth = stepWidth + widthVar;

            drawFace(() => {
                ctx.rect(x, y, currentWidth, stepHeight);
            }, colorFront);
            
            drawFace(() => {
                ctx.moveTo(x, y);
                ctx.lineTo(x + currentWidth, y);
                ctx.lineTo(x + currentWidth + 20, y - 20);
                ctx.lineTo(x + 20, y - 20);
            }, colorTop);

            // Side Face with Texture
            drawFace(() => {
                ctx.moveTo(x + currentWidth, y);
                ctx.lineTo(x + currentWidth + 20, y - 20);
                ctx.lineTo(x + currentWidth + 20, y - 20 + stepHeight);
                ctx.lineTo(x + currentWidth, y + stepHeight);
            }, colorSide);

            // Procedural Texture (Scratches/Details on Side)
            if (stairStyle === 'solid') {
                ctx.save();
                ctx.beginPath();
                ctx.strokeStyle = 'rgba(0,0,0,0.2)';
                ctx.lineWidth = 2;
                // Draw 3 vertical lines based on random hash
                for(let k=0; k<3; k++) {
                   const lineX = x + currentWidth + 5 + (k*5);
                   const lineY = y + 5 + (pseudoRandom * 20 + k*10) % (stepHeight - 10);
                   ctx.moveTo(lineX, lineY);
                   ctx.lineTo(lineX, lineY + 10);
                }
                ctx.stroke();
                ctx.restore();
            }
        }
        
        if (i % 24 === 0) {
            ctx.fillStyle = colorMarker;
            if (viewMode === 'vertical') {
                ctx.fillRect(centerX + stepWidth/2 - 30, y + 5, 20, stepHeight - 10);
            } else {
                ctx.fillRect(x + stepWidth - 20, y - 40, 10, 30);
            }
        }
      }
    };

    const drawWeather = () => {
        if (weather === 'clear') return;
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 1;

        particles.forEach(p => {
            if (weather === 'rain') {
                ctx.beginPath();
                ctx.moveTo(p.x, p.y);
                ctx.lineTo(p.x, p.y + 10);
                ctx.stroke();
                p.y += p.speed * 2;
            } else if (weather === 'snow') {
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
                p.y += p.speed / 2;
                p.x += Math.sin(p.y / 50);
            } else if (weather === 'cloudy') {
                ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size * 20, 0, Math.PI * 2);
                ctx.fill();
                p.x += p.speed / 10;
            }

            if (p.y > canvas.height) p.y = -10;
            if (p.x > canvas.width) p.x = -10;
            if (p.x < -10) p.x = canvas.width;
        });
    };

    const render = (_time: number) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw layers
      drawBackground();
      
      scrollRef.current += 0.1; // Reduced speed (was 0.5)
      drawStairs(scrollRef.current);
      drawWeather();
      
      requestRef.current = requestAnimationFrame(render);
    };

    requestRef.current = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [timePhase, weather, viewMode, stairStyle, environment]);

  return <canvas ref={canvasRef} className={`absolute top-0 left-0 w-full h-full pointer-events-none ${className}`} />;
};

export default AscensionCanvas;
