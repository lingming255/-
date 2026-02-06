import { useState, useMemo, useEffect } from 'react';
import AscensionCanvas from './components/AscensionCanvas';
import UI from './components/UI';
import { GoalCanvas } from './components/GoalTree/GoalCanvas';
import { TaskDashboard } from './components/TaskDashboard/TaskDashboard';
import { TaskHUD } from './components/TaskDashboard/TaskHUD';
import { useTimeSystem } from './hooks/useTimeSystem';
import { getTimePhase, getSkyGradient } from './utils/environment';
import { WeatherType } from './types';
import { useGameStore } from './store/gameStore';

function App() {
  const { time, season } = useTimeSystem();
  const { viewMode, stairStyle, environment, colorTheme } = useGameStore();
  const [manualWeather, setManualWeather] = useState<WeatherType | null>(null);
  const [autoWeather, setAutoWeather] = useState<WeatherType>('clear');
  const [showMap, setShowMap] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);
  
  const phase = getTimePhase(time);
  
  // Simulate weather changes based on season and randomness
  useEffect(() => {
    // Only update weather occasionally (every hour in game logic, but here simplified)
    const updateWeather = () => {
      const rand = Math.random();
      let nextWeather: WeatherType = 'clear';

      if (season === 'winter') {
        if (rand > 0.7) nextWeather = 'snow';
        else if (rand > 0.5) nextWeather = 'cloudy';
      } else if (season === 'spring' || season === 'autumn') {
        if (rand > 0.8) nextWeather = 'rain';
        else if (rand > 0.6) nextWeather = 'cloudy';
      } else { // Summer
        if (rand > 0.9) nextWeather = 'rain'; // Summer storm
        else if (rand > 0.8) nextWeather = 'cloudy';
      }
      
      setAutoWeather(nextWeather);
    };

    updateWeather();
    const interval = setInterval(updateWeather, 1000 * 60 * 30); // Change every 30 mins
    return () => clearInterval(interval);
  }, [season]);

  const weather = manualWeather || autoWeather;

  // Re-calculate gradient whenever phase or weather changes
  const bgGradient = useMemo(() => getSkyGradient(phase, weather, colorTheme), [phase, weather, colorTheme]);

  const toggleWeather = () => {
    // If currently manual, cycle through. If auto, start manual cycle from current auto.
    const weathers: WeatherType[] = ['clear', 'cloudy', 'rain', 'snow'];
    const currentBase = manualWeather || autoWeather;
    const nextIndex = (weathers.indexOf(currentBase) + 1) % weathers.length;
    
    // If we cycle back to auto (optional logic, but here let's just cycle manual)
    setManualWeather(weathers[nextIndex]);
  };

  return (
    <div 
      className="relative w-full h-screen overflow-hidden transition-[background] duration-[3000ms] ease-in-out"
      style={{ background: bgGradient }}
    >
      <AscensionCanvas 
        timePhase={phase} 
        weather={weather} 
        viewMode={viewMode} 
        stairStyle={stairStyle}
        environment={environment}
        colorTheme={colorTheme}
      />
      
      <UI 
        onWeatherToggle={toggleWeather} 
        currentWeather={weather} 
        onOpenMap={() => setShowMap(true)} 
      />
      
      {!showMap && !showDashboard && (
        <TaskHUD onOpenDashboard={() => setShowDashboard(true)} />
      )}

      <TaskDashboard isOpen={showDashboard} onClose={() => setShowDashboard(false)} />
      
      {showMap && (
        <GoalCanvas onClose={() => setShowMap(false)} />
      )}
      
      {/* Time Debug/Display (Optional, minimal) */}
      <div className="absolute top-4 left-6 text-white/30 text-xs font-mono tracking-widest pointer-events-none flex gap-2">
        <span>{phase.toUpperCase()}</span>
        <span>|</span>
        <span>{weather.toUpperCase()}</span>
      </div>
    </div>
  );
}

export default App;
