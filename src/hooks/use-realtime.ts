
"use client"

import { useState, useEffect } from 'react';
import { useFirebase } from '@/firebase';
import { collection, query, onSnapshot, orderBy, limit, doc } from 'firebase/firestore';

export function useRealtime(committeeId?: string) {
  const { firestore: db } = useFirebase();
  const [isSuspended, setIsSuspended] = useState(false);
  const [allowResolutions, setAllowResolutions] = useState(true);
  const [allowGossip, setAllowGossip] = useState(true);
  const [allowPositionPapers, setAllowPositionPapers] = useState(true);
  const [currentAction, setCurrentAction] = useState<any>(null);
  const [activeOverlay, setActiveOverlay] = useState<any>(null);

  useEffect(() => {
    if (!db || !committeeId) return;

    const sessionStateRef = doc(db, 'committees', committeeId, 'sessionState', 'current');
    const unsubSettings = onSnapshot(sessionStateRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setIsSuspended(data.isSuspended === true);
        setAllowResolutions(data.allowResolutions !== false);
        setAllowGossip(data.allowGossip !== false);
        setAllowPositionPapers(data.allowPositionPapers !== false);
        setActiveOverlay(data.activeOverlay || { type: 'none' });
      } else {
        setIsSuspended(false);
        setAllowResolutions(true);
        setAllowGossip(true);
        setAllowPositionPapers(true);
        setActiveOverlay({ type: 'none' });
      }
    });

    const actionsRef = collection(db, 'committees', committeeId, 'actions');
    const q = query(actionsRef, orderBy('created_at', 'desc'), limit(1));

    const unsubActions = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const actionDoc = snapshot.docs[0];
        setCurrentAction({ id: actionDoc.id, ...actionDoc.data() });
      } else {
        setCurrentAction(null);
      }
    });

    return () => {
      unsubSettings();
      unsubActions();
    };
  }, [db, committeeId]);

  return { isSuspended, allowResolutions, allowGossip, allowPositionPapers, currentAction, activeOverlay };
}
