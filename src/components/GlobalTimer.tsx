"use client"

import { useState, useEffect } from 'react';
import { Clock, Pause, Play } from 'lucide-react';

interface GlobalTimerProps {
  status: 'launched' | 'started' | 'paused' | 'completed';
  startedAt: string | null;
  pausedAt: string | null;
  totalElapsedSeconds: number;
  durationMinutes: number;
}

export function GlobalTimer({ status, startedAt, pausedAt, totalElapsedSeconds, durationMinutes }: GlobalTimerProps) {
  const [timeLeft, setTimeLeft] = useState<number>(durationMinutes * 60);

  useEffect(() => {
    if (status === 'launched') {
      setTimeLeft(durationMinutes * 60);
      return;
    }

    if (status === 'completed') {
      setTimeLeft(0);
      return;
    }

    const interval = setInterval(() => {
      let elapsed = totalElapsedSeconds || 0;
      
      if (status === 'started' && startedAt) {
        const start = new Date(startedAt).getTime();
        const now = new Date().getTime();
        elapsed += Math.floor((now - start) / 1000);
      }

      const remaining = (durationMinutes * 60) - elapsed;
      setTimeLeft(remaining > 0 ? remaining : 0);
    }, 1000);

    return () => clearInterval(interval);
  }, [status, startedAt, pausedAt, totalElapsedSeconds, durationMinutes]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  const isWarning = timeLeft < 60 && timeLeft > 0;
  const isFinished = timeLeft === 0 && status !== 'launched';

  return (
    <div className={`flex flex-col items-center p-6 rounded-2xl border-4 transition-all duration-500 ${
      isFinished ? 'border-destructive bg-destructive/10' : 
      isWarning ? 'border-orange-500 bg-orange-50 animate-pulse' :
      status === 'paused' ? 'border-amber-400 bg-amber-50' : 'border-primary bg-primary/5'
    }`}>
      <div className="flex items-center gap-3 text-muted-foreground mb-2">
        {status === 'paused' ? <Pause size={20} className="text-amber-500" /> : <Clock size={20} />}
        <span className="font-semibold uppercase tracking-wider text-xs">
          {status === 'paused' ? 'Minuteur en Pause' : 'Temps Restant'}
        </span>
      </div>
      <div className={`text-6xl font-black font-code tabular-nums transition-colors ${
        isFinished ? 'text-destructive' : 
        status === 'paused' ? 'text-amber-600' : 'text-primary'
      }`}>
        {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
      </div>
    </div>
  );
}