
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
  // Sécurisation de la durée initiale
  const safeDuration = Number(durationMinutes) || 0;
  const [timeLeft, setTimeLeft] = useState<number>(safeDuration * 60);
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
    const currentSafeDuration = Number(durationMinutes) || 0;

    if (status === 'launched') {
      setTimeLeft(currentSafeDuration * 60);
      hasPlayedAlarm.current = false;
      return;
    }

    if (status === 'completed') {
      setTimeLeft(0);
      return;
    }

    const interval = setInterval(() => {
      let elapsed = Number(totalElapsedSeconds) || 0;
      
      if (status === 'started' && startedAt) {
        const start = new Date(startedAt).getTime();
        const now = new Date().getTime();
        if (!isNaN(start)) {
          elapsed += Math.floor((now - start) / 1000);
        }
      }

      const remaining = (currentSafeDuration * 60) - elapsed;
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

  // Sécurisation de l'affichage pour éviter NaN
  const displayMinutes = isNaN(minutes) ? "00" : String(minutes).padStart(2, '0');
  const displaySeconds = isNaN(seconds) ? "00" : String(seconds).padStart(2, '0');

  const isWarning = timeLeft < 60 && timeLeft > 0;
  const isFinished = timeLeft === 0 && status !== 'launched';

  return (
    <div className={`flex flex-col items-center p-3 md:p-6 rounded-2xl border-2 md:border-4 transition-all duration-500 ${
      isFinished ? 'border-destructive bg-destructive/10' : 
      isWarning ? 'border-orange-500 bg-orange-50 animate-pulse' :
      status === 'paused' ? 'border-amber-400 bg-amber-50' : 'border-primary bg-primary/5'
    }`}>
      <div className="flex items-center gap-1.5 md:gap-3 text-muted-foreground mb-1 md:mb-2">
        {status === 'paused' ? <Pause className="size-3.5 md:size-5 text-amber-500" /> : <Clock className="size-3.5 md:size-5" />}
        <span className="font-semibold uppercase tracking-wider text-[7px] md:text-xs">
          {status === 'paused' ? 'Minuteur en Pause' : 'Temps Restant'}
        </span>
      </div>
      <div className={`text-3xl md:text-5xl lg:text-6xl font-black font-code tabular-nums transition-colors leading-none ${
        isFinished ? 'text-destructive' : 
        status === 'paused' ? 'text-amber-600' : 'text-primary'
      }`}>
        {displayMinutes}:{displaySeconds}
      </div>
    </div>
  );
}
