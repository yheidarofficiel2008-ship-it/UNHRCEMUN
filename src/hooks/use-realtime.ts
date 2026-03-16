
"use client"

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, orderBy, limit, doc, getDoc, setDoc } from 'firebase/firestore';

export function useRealtime() {
  const [isSuspended, setIsSuspended] = useState(false);
  const [currentAction, setCurrentAction] = useState<any>(null);

  useEffect(() => {
    // Ensure the settings document exists and listen to it
    const settingsRef = doc(db, 'settings', 'session_suspended');
    
    const checkAndInit = async () => {
      const snap = await getDoc(settingsRef);
      if (!snap.exists()) {
        await setDoc(settingsRef, { value: false });
      }
    };
    checkAndInit();

    const unsubSettings = onSnapshot(settingsRef, (docSnap) => {
      if (docSnap.exists()) {
        setIsSuspended(docSnap.data().value === true);
      }
    });

    // Listen to current action
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
    });

    return () => {
      unsubSettings();
      unsubActions();
    };
  }, []);

  return { isSuspended, currentAction };
}
