
"use client"

import React from 'react';
import { AlertTriangle } from 'lucide-react';
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
      title: "Séance Suspendue",
      desc: "Veuillez patienter la reprise officielle du comité."
    },
    en: {
      title: "Session Suspended",
      desc: "Please wait for the official resumption of the committee."
    }
  }[lang];

  return (
    <div className="session-suspended animate-in fade-in duration-500">
      <div className="flex flex-col items-center gap-6">
        <AlertTriangle size={80} className="text-white" />
        <h1>{t.title}</h1>
        <p className="text-xl opacity-90">{t.desc}</p>
      </div>
    </div>
  );
}
