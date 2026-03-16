"use client"

import { useState, useEffect, useRef } from 'react';
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
  const hasPlayedAlarm = useRef(false);

  const playAlarm = () => {
    try {
      const context = new (window.AudioContext || (window as any).webkitAudioContext)();
      const playBeep = (time: number) => {
        const osc = context.createOscillator();
        const gain = context.createGain();
        osc.connect(gain);
        gain.connect(context.destination);
        osc.frequency.value = 880; // A5
        gain.gain.setValueAtTime(0.1, time);
        gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.4);
        osc.start(time);
        osc.stop(time + 0.4);
      };
      playBeep(context.currentTime);
      playBeep(context.currentTime + 0.3);
    } catch (e) {
      console.warn("Audio bloqué.");
    }
  };

  useEffect(() => {
    if (status === 'stopped') {
      setTimeLeft(limitSeconds);
      hasPlayedAlarm.current = false;
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
      const finalRemaining = remaining > 0 ? remaining : 0;
      
      setTimeLeft(finalRemaining);

      if (finalRemaining === 0 && !hasPlayedAlarm.current && status === 'started') {
        playAlarm();
        hasPlayedAlarm.current = true;
      }
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