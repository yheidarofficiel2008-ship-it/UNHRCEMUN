
"use client"

import { useState, useEffect, useRef } from 'react';
import { Clock, Pause } from 'lucide-react';

interface GlobalTimerProps {
  status: 'launched' | 'started' | 'paused' | 'completed';
  startedAt: string | null;
  pausedAt: string | null;
  totalElapsedSeconds: number;
  durationMinutes: number;
}

export function GlobalTimer({ status, startedAt, pausedAt, totalElapsedSeconds, durationMinutes }: GlobalTimerProps) {
  const [timeLeft, setTimeLeft] = useState<number>(durationMinutes * 60);
  const hasPlayedAlarm = useRef(false);

  const playAlarm = () => {
    try {
      const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const context = new AudioContextClass();
      const playBeep = (time: number) => {
        const osc = context.createOscillator();
        const gain = context.createGain();
        osc.connect(gain);
        gain.connect(context.destination);
        osc.frequency.value = 523.25; // C5
        gain.gain.setValueAtTime(0.1, time);
        gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.8);
        osc.start(time);
        osc.stop(time + 0.8);
      };
      playBeep(context.currentTime);
      playBeep(context.currentTime + 0.5);
      playBeep(context.currentTime + 1.0);
    } catch (e) {
      console.warn("Audio Context non supporté ou bloqué par le navigateur.");
    }
  };

  useEffect(() => {
    if (status === 'launched') {
      setTimeLeft(durationMinutes * 60);
      hasPlayedAlarm.current = false;
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
      const finalRemaining = remaining > 0 ? remaining : 0;
      
      setTimeLeft(finalRemaining);

      if (finalRemaining === 0 && !hasPlayedAlarm.current && status === 'started') {
        playAlarm();
        hasPlayedAlarm.current = true;
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [status, startedAt, pausedAt, totalElapsedSeconds, durationMinutes]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  const isWarning = timeLeft < 60 && timeLeft > 0;
  const isFinished = timeLeft === 0 && status !== 'launched';

  return (
    <div className={`flex flex-col items-center p-4 md:p-6 rounded-2xl border-2 md:border-4 transition-all duration-500 ${
      isFinished ? 'border-destructive bg-destructive/10' : 
      isWarning ? 'border-orange-500 bg-orange-50 animate-pulse' :
      status === 'paused' ? 'border-amber-400 bg-amber-50' : 'border-primary bg-primary/5'
    }`}>
      <div className="flex items-center gap-2 md:gap-3 text-muted-foreground mb-1 md:mb-2">
        {status === 'paused' ? <Pause className="size-4 md:size-5 text-amber-500" /> : <Clock className="size-4 md:size-5" />}
        <span className="font-semibold uppercase tracking-wider text-[8px] md:text-xs">
          {status === 'paused' ? 'Minuteur en Pause' : 'Temps Restant'}
        </span>
      </div>
      <div className={`text-4xl md:text-6xl font-black font-code tabular-nums transition-colors ${
        isFinished ? 'text-destructive' : 
        status === 'paused' ? 'text-amber-600' : 'text-primary'
      }`}>
        {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
      </div>
    </div>
  );
}
