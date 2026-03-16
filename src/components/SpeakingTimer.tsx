
"use client"

import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
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
    sm: 'text-lg font-bold px-3 py-1',
    md: 'text-2xl font-black px-4 py-2',
    lg: 'text-4xl font-black px-6 py-3'
  };

  return (
    <div className={cn(
      "inline-flex items-center gap-2 rounded-full border shadow-sm transition-all duration-300",
      status === 'started' ? (isOverTime ? "bg-destructive text-white border-destructive animate-pulse" : "bg-primary/10 text-primary border-primary/20") : "bg-muted text-muted-foreground opacity-50",
      sizeClasses[size]
    )}>
      <Timer className={cn("h-4 w-4", status === 'started' && "animate-spin-slow")} />
      <span className="font-code tabular-nums tracking-tighter">
        {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
      </span>
    </div>
  );
}
