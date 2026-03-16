
"use client"

import { useState, useEffect } from 'react';
import { Timer } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SpeakingTimerProps {
  status: 'started' | 'stopped';
  startedAt: string | null;
  totalElapsedSeconds: number;
  limitSeconds: number;
  size?: 'sm' | 'md' | 'lg';
}

export function SpeakingTimer({ status, startedAt, totalElapsedSeconds, limitSeconds, size = 'md' }: SpeakingTimerProps) {
  const [timeLeft, setTimeLeft] = useState<number>(limitSeconds);

  useEffect(() => {
    if (status === 'stopped') {
      setTimeLeft(limitSeconds);
      return;
    }

    const interval = setInterval(() => {
      let currentElapsed = totalElapsedSeconds;
      if (status === 'started' && startedAt) {
        const start = new Date(startedAt).getTime();
        const now = new Date().getTime();
        currentElapsed += Math.floor((now - start) / 1000);
      }
      
      const remaining = limitSeconds - currentElapsed;
      setTimeLeft(remaining > 0 ? remaining : 0);
    }, 1000);

    return () => clearInterval(interval);
  }, [status, startedAt, totalElapsedSeconds, limitSeconds]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const isOverTime = timeLeft === 0 && status === 'started';

  const sizeClasses = {
    sm: 'text-xs font-bold px-2 py-0.5 gap-1',
    md: 'text-xl font-black px-4 py-1.5 gap-2',
    lg: 'text-3xl font-black px-6 py-3 gap-3'
  };

  return (
    <div className={cn(
      "inline-flex items-center rounded-full border shadow-sm transition-all duration-300 tabular-nums",
      status === 'started' ? (isOverTime ? "bg-destructive text-white border-destructive animate-pulse" : "bg-primary/5 text-primary border-primary/20") : "bg-muted/50 text-muted-foreground opacity-40",
      sizeClasses[size]
    )}>
      <Timer className={cn(size === 'sm' ? "h-3 w-3" : "h-4 w-4", status === 'started' && !isOverTime && "animate-pulse")} />
      <span className="font-code tracking-tighter">
        {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
      </span>
    </div>
  );
}
