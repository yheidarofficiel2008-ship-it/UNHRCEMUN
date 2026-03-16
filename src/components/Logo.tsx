
"use client"

import React from 'react';
import { cn } from '@/lib/utils';

interface LogoProps {
  className?: string;
}

export function Logo({ className }: LogoProps) {
  return (
    <svg 
      viewBox="0 0 100 100" 
      className={cn("fill-current", className)}
      xmlns="http://www.w3.org/2000/svg"
    >
      <g>
        {/* UN Emblem Map Grid */}
        <circle cx="50" cy="50" r="32" fill="none" stroke="currentColor" strokeWidth="1" />
        <circle cx="50" cy="50" r="24" fill="none" stroke="currentColor" strokeWidth="0.8" opacity="0.6" />
        <circle cx="50" cy="50" r="16" fill="none" stroke="currentColor" strokeWidth="0.8" opacity="0.6" />
        <circle cx="50" cy="50" r="8" fill="none" stroke="currentColor" strokeWidth="0.8" opacity="0.6" />
        
        {/* Latitude/Longitude lines */}
        <line x1="50" y1="18" x2="50" y2="82" stroke="currentColor" strokeWidth="0.8" />
        <line x1="18" y1="50" x2="82" y2="50" stroke="currentColor" strokeWidth="0.8" />
        
        <path d="M25 35 Q50 20 75 35" fill="none" stroke="currentColor" strokeWidth="0.8" opacity="0.4" />
        <path d="M25 65 Q50 80 75 65" fill="none" stroke="currentColor" strokeWidth="0.8" opacity="0.4" />
        <path d="M35 25 Q20 50 35 75" fill="none" stroke="currentColor" strokeWidth="0.8" opacity="0.4" />
        <path d="M65 25 Q80 50 65 75" fill="none" stroke="currentColor" strokeWidth="0.8" opacity="0.4" />

        {/* Laurel Branches */}
        <path d="M30 80 C20 70 20 30 50 15 M70 80 C80 70 80 30 50 15" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M28 78 L22 82 M22 70 L16 73 M18 60 L12 62 M20 50 L14 50 M22 40 L16 37 M82 78 L78 82 M84 70 L90 73 M86 60 L92 62 M84 50 L90 50 M82 40 L88 37" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </g>
    </svg>
  );
}
