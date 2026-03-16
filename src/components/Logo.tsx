
"use client"

import React from 'react';
import { cn } from '@/lib/utils';

interface LogoProps {
  className?: string;
}

/**
 * Composant Logo utilisant l'asset EMUN.svg fourni par l'utilisateur.
 * L'asset doit être présent dans le dossier public/ pour être accessible via /EMUN.svg.
 */
export function Logo({ className }: LogoProps) {
  return (
    <img 
      src="/EMUN.svg" 
      alt="EMUN UNHRC Logo" 
      className={cn("h-auto w-auto object-contain", className)}
    />
  );
}
