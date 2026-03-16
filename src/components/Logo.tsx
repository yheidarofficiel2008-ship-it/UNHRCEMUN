
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
      {/* Laurels */}
      <path d="M50 85C35 85 20 75 15 55C15 45 20 35 25 30M50 85C65 85 80 75 85 55C85 45 80 35 75 30" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M20 70L15 72M18 60L12 61M22 50L16 49M80 70L85 72M82 60L88 61M78 50L84 49" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      
      {/* Globe Grid */}
      <circle cx="50" cy="50" r="30" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <ellipse cx="50" cy="50" rx="15" ry="30" fill="none" stroke="currentColor" strokeWidth="1" />
      <line x1="20" y1="50" x2="80" y2="50" stroke="currentColor" strokeWidth="1" />
      <path d="M24 35C30 38 40 40 50 40C60 40 70 38 76 35" fill="none" stroke="currentColor" strokeWidth="1" />
      <path d="M24 65C30 62 40 60 50 60C60 60 70 62 76 65" fill="none" stroke="currentColor" strokeWidth="1" />
      
      {/* UNHRC Text */}
      <text x="50" y="98" textAnchor="middle" fontSize="8" fontWeight="900" letterSpacing="0.1em">UNHRC</text>
    </svg>
  );
}
