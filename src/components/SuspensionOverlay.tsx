"use client"

import React from 'react';
import { AlertTriangle } from 'lucide-react';

export function SuspensionOverlay() {
  return (
    <div className="session-suspended animate-in fade-in duration-500">
      <div className="flex flex-col items-center gap-6">
        <AlertTriangle size={80} className="text-white" />
        <h1>Séance Suspendue</h1>
        <p className="text-xl opacity-90">Veuillez patienter la reprise officielle du comité.</p>
      </div>
    </div>
  );
}