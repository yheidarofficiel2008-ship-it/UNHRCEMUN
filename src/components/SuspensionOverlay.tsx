"use client"

import React from 'react';
import { ShieldAlert } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useFirebase, useDoc } from '@/firebase';
import { useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';

export function SuspensionOverlay() {
  const params = useParams();
  const committeeId = params.committeeId as string;
  const { firestore: db } = useFirebase();
  const committeeRef = useMemoFirebase(() => db && committeeId ? doc(db, 'committees', committeeId) : null, [db, committeeId]);
  const { data: committee } = useDoc(committeeRef);
  
  const lang = committee?.language || 'fr';
  const t = {
    fr: {
      title: "SÉANCE SUSPENDUE",
      desc: "Veuillez patienter jusqu'à la reprise officielle des débats par la présidence."
    },
    en: {
      title: "SESSION SUSPENDED",
      desc: "Please wait for the official resumption of debates by the presidency."
    }
  }[lang];

  return (
    <div className="fixed inset-0 z-[10000] bg-[#0459ab] flex flex-col items-center justify-center p-8 text-white animate-in fade-in duration-500">
      <div className="flex flex-col items-center gap-12 max-w-4xl text-center">
        <ShieldAlert size={150} className="text-white animate-pulse" />
        <div className="space-y-6">
          <h1 className="text-6xl md:text-8xl font-black uppercase tracking-tighter leading-none">{t.title}</h1>
          <p className="text-2xl md:text-3xl font-medium opacity-80 leading-relaxed max-w-2xl mx-auto">{t.desc}</p>
        </div>
      </div>
    </div>
  );
}
