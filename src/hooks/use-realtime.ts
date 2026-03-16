"use client"

import { useState, useEffect } from 'react';
import { useFirebase } from '@/firebase';
import { collection, query, onSnapshot, orderBy, limit, doc } from 'firebase/firestore';

export function useRealtime() {
  const { firestore: db } = useFirebase();
  const [isSuspended, setIsSuspended] = useState(false);
  const [currentAction, setCurrentAction] = useState<any>(null);

  useEffect(() => {
    if (!db) return;

    // Écouter l'état de suspension
    const sessionStateRef = doc(db, 'sessionState', 'current');
    const unsubSettings = onSnapshot(sessionStateRef, (docSnap) => {
      if (docSnap.exists()) {
        setIsSuspended(docSnap.data().isSuspended === true);
      }
    }, (error) => {
      console.warn("Session state error:", error.message);
    });

    // Écouter l'action la plus récente (sans filtre complexe pour éviter les erreurs d'index)
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

  return { isSuspended, currentAction };
}