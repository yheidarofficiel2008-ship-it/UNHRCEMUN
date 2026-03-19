
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
  // Sécurisation de la durée initiale pour éviter NaN ou 0 immédiat
  const safeDurationMinutes = Number(durationMinutes) || 0;
  const safeTotalElapsed = Number(totalElapsedSeconds) || 0;
  
  const [timeLeft, setTimeLeft] = useState<number>(safeDurationMinutes * 60);
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
      console.warn("Audio Context non supporté ou bloqué.");
    }
  };

  useEffect(() => {
    // Fonction de mise à jour du temps restant
    const updateTimer = () => {
      let elapsed = Number(totalElapsedSeconds) || 0;
      
      if (status === 'started' && startedAt) {
        const start = new Date(startedAt).getTime();
        const now = new Date().getTime();
        if (!isNaN(start)) {
          elapsed += Math.floor((now - start) / 1000);
        }
      }

      const totalDurationSeconds = (Number(durationMinutes) || 0) * 60;
      const remaining = totalDurationSeconds - elapsed;
      const finalRemaining = remaining > 0 ? remaining : 0;
      
      setTimeLeft(finalRemaining);

      if (finalRemaining === 0 && !hasPlayedAlarm.current && status === 'started') {
        playAlarm();
        hasPlayedAlarm.current = true;
      }
    };

    // Mise à jour immédiate lors du changement de props
    updateTimer();

    // Si la session est en cours, on lance l'intervalle
    if (status === 'started') {
      const interval = setInterval(updateTimer, 1000);
      return () => clearInterval(interval);
    }
  }, [status, startedAt, totalElapsedSeconds, durationMinutes]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  const displayMinutes = String(minutes).padStart(2, '0');
  const displaySeconds = String(seconds).padStart(2, '0');

  const isWarning = timeLeft < 60 && timeLeft > 0 && status !== 'launched';
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
