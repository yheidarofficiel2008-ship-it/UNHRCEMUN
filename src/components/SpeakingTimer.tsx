
"use client"

import { useState, useEffect } from 'react';

interface SpeakingTimerProps {
  status: 'started' | 'stopped';
  startedAt: string | null;
  totalElapsedSeconds: number;
  size?: 'sm' | 'md' | 'lg';
}

export function SpeakingTimer({ status, startedAt, totalElapsedSeconds, size = 'md' }: SpeakingTimerProps) {
  const [elapsed, setElapsed] = useState<number>(totalElapsedSeconds);

  useEffect(() => {
    if (status === 'stopped') {
      setElapsed(0);
      return;
    }

    const interval = setInterval(() => {
      let currentElapsed = totalElapsedSeconds;
      if (status === 'started' && startedAt) {
        const start = new Date(startedAt).getTime();
        const now = new Date().getTime();
        currentElapsed += Math.floor((now - start) / 1000);
      }
      setElapsed(currentElapsed);
    }, 1000);

    return () => clearInterval(interval);
  }, [status, startedAt, totalElapsedSeconds]);

  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;

  const sizeClasses = {
    sm: 'text-2xl font-bold',
    md: 'text-4xl font-black',
    lg: 'text-6xl font-black'
  };

  return (
    <div className={`font-code tabular-nums transition-colors ${status === 'started' ? 'text-primary' : 'text-muted-foreground'} ${sizeClasses[size]}`}>
      {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
    </div>
  );
}
