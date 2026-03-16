
"use client"

import React from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface LogoProps {
  className?: string;
}

/**
 * Composant Logo utilisant l'asset mun.png.
 * IMPORTANT : Le fichier mun.png doit être déposé dans le dossier 'public/' à la racine du projet.
 * Si l'image ne s'affiche pas, vérifiez que le fichier est bien présent dans 'public/mun.png'.
 */
export function Logo({ className }: LogoProps) {
  return (
    <div className={cn("relative flex items-center justify-center overflow-hidden", className)}>
      <Image 
        src="/mun.png" 
        alt="EMUN UNHRC Logo" 
        fill
        className="object-contain"
        priority
        unoptimized // Utile si le fichier est un PNG simple sans besoin de redimensionnement serveur
      />
    </div>
  );
}
