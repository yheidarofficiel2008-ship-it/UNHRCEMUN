"use client"

import { useState, useEffect } from 'react';
import { useFirebase } from '@/firebase';
import { collection, query, where, onSnapshot, orderBy, limit, doc } from 'firebase/firestore';

export function useRealtime() {
  const { firestore: db } = useFirebase();
  const [isSuspended, setIsSuspended] = useState(false);
  const [currentAction, setCurrentAction] = useState<any>(null);

  useEffect(() => {
    if (!db) return;

    // Écouter l'état global de la session (Toujours autorisé)
    const sessionStateRef = doc(db, 'sessionState', 'current');
    const unsubSettings = onSnapshot(sessionStateRef, (docSnap) => {
      if (docSnap.exists()) {
        setIsSuspended(docSnap.data().isSuspended === true);
      }
    }, (error) => {
      // Silencieux pour le prototype
      console.warn("Session state hook silent error:", error.message);
    });

    // Écouter l'action actuelle (Toujours autorisé)
    const actionsRef = collection(db, 'actions');
    const q = query(
      actionsRef, 
      where('status', 'in', ['launched', 'started', 'completed']), 
      orderBy('created_at', 'desc'), 
      limit(1)
    );

    const unsubActions = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const actionData = snapshot.docs[0].data();
        setCurrentAction({ id: snapshot.docs[0].id, ...actionData });
      } else {
        setCurrentAction(null);
      }
    }, (error) => {
      // Silencieux pour le prototype
      console.warn("Actions hook silent error:", error.message);
    });

    return () => {
      unsubSettings();
      unsubActions();
    };
  }, [db]);

  return { isSuspended, currentAction };
}