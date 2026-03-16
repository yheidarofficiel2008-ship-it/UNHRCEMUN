
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
      {/* UN Official Laurel Leaves */}
      <path 
        d="M50 85C32 85 18 72 15 50C15 40 20 30 28 22M50 85C68 85 82 72 85 50C85 40 80 30 72 22" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2.5" 
        strokeLinecap="round" 
      />
      <path d="M22 75L15 78M18 65L10 67M20 55L12 54M80 75L87 78M84 65L92 67M82 55L90 54" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      
      {/* World Map Grid (UN Style) */}
      <circle cx="50" cy="50" r="32" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="50" cy="50" r="22" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.6" />
      <circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.6" />
      
      {/* Longitudinal lines */}
      <path d="M50 18V82" stroke="currentColor" strokeWidth="1" />
      <path d="M18 50H82" stroke="currentColor" strokeWidth="1" />
      <path d="M28 28L72 72" stroke="currentColor" strokeWidth="1" opacity="0.4" />
      <path d="M28 72L72 28" stroke="currentColor" strokeWidth="1" opacity="0.4" />
      
      {/* Latitude Ellipses */}
      <ellipse cx="50" cy="50" rx="10" ry="32" fill="none" stroke="currentColor" strokeWidth="1" />
      <ellipse cx="50" cy="50" rx="20" ry="32" fill="none" stroke="currentColor" strokeWidth="1" />
      <ellipse cx="50" cy="50" rx="32" ry="10" fill="none" stroke="currentColor" strokeWidth="1" />
      <ellipse cx="50" cy="50" rx="32" ry="20" fill="none" stroke="currentColor" strokeWidth="1" />
    </svg>
  );
}
