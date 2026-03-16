
"use client"

import { useState, useEffect } from 'react';
import { useFirebase } from '@/firebase';
import { collection, query, onSnapshot, orderBy, limit, doc } from 'firebase/firestore';

export function useRealtime() {
  const { firestore: db } = useFirebase();
  const [isSuspended, setIsSuspended] = useState(false);
  const [allowResolutions, setAllowResolutions] = useState(true);
  const [currentAction, setCurrentAction] = useState<any>(null);
  const [activeOverlay, setActiveOverlay] = useState<any>(null);

  useEffect(() => {
    if (!db) return;

    // Écouter l'état global de la session
    const sessionStateRef = doc(db, 'sessionState', 'current');
    const unsubSettings = onSnapshot(sessionStateRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setIsSuspended(data.isSuspended === true);
        setAllowResolutions(data.allowResolutions !== false);
        setActiveOverlay(data.activeOverlay || { type: 'none' });
      }
    }, (error) => {
      console.warn("Session state error:", error.message);
    });

    // Écouter l'action la plus récente
    const actionsRef = collection(db, 'actions');
    const q = query(
      actionsRef, 
      orderBy('created_at', 'desc'), 
      limit(1)
    );

    const unsubActions = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const actionDoc = snapshot.docs[0];
        const actionData = actionDoc.data();
        setCurrentAction({ id: actionDoc.id, ...actionData });
      } else {
        setCurrentAction(null);
      }
    }, (error) => {
      console.error("Actions listener error:", error);
    });

    return () => {
      unsubSettings();
      unsubActions();
    };
  }, [db]);

  return { isSuspended, allowResolutions, currentAction, activeOverlay };
}
