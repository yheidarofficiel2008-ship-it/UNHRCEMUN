"use client"

import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

interface GlobalTimerProps {
  startedAt: string | null;
  durationMinutes: number;
}

export function GlobalTimer({ startedAt, durationMinutes }: GlobalTimerProps) {
  const [timeLeft, setTimeLeft] = useState<number>(0);

  useEffect(() => {
    if (!startedAt) {
      setTimeLeft(durationMinutes * 60);
      return;
    }

    const interval = setInterval(() => {
      const start = new Date(startedAt).getTime();
      const now = new Date().getTime();
      const elapsed = Math.floor((now - start) / 1000);
      const remaining = (durationMinutes * 60) - elapsed;
      
      setTimeLeft(remaining > 0 ? remaining : 0);
    }, 1000);

    return () => clearInterval(interval);
  }, [startedAt, durationMinutes]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <div className={`flex flex-col items-center p-6 rounded-2xl border-4 ${timeLeft === 0 && startedAt ? 'border-destructive bg-destructive/10' : 'border-primary bg-primary/5'}`}>
      <div className="flex items-center gap-3 text-muted-foreground mb-2">
        <Clock size={20} />
        <span className="font-semibold uppercase tracking-wider text-xs">Temps Restant</span>
      </div>
      <div className="text-6xl font-black font-code tabular-nums text-primary">
        {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
      </div>
    </div>
  );
}