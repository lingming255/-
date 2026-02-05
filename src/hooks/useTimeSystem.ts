import { useState, useEffect } from 'react';

export type Season = 'spring' | 'summer' | 'autumn' | 'winter';

export interface TimeSystem {
  time: number; // 0-24 float
  season: Season;
  formattedTime: string;
}

const getSeason = (month: number): Season => {
  if (month >= 2 && month <= 4) return 'spring';
  if (month >= 5 && month <= 7) return 'summer';
  if (month >= 8 && month <= 10) return 'autumn';
  return 'winter';
};

export const useTimeSystem = (): TimeSystem => {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000 * 60); // Update every minute is enough for logic, animations use requestAnimationFrame
    return () => clearInterval(timer);
  }, []);

  const time = now.getHours() + now.getMinutes() / 60;
  const season = getSeason(now.getMonth());
  const formattedTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return { time, season, formattedTime };
};
