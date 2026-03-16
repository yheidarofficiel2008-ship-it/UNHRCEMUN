
"use client"

import { useState, useEffect } from 'react';
import { useFirebase } from '@/firebase';
import { collection, query, where, onSnapshot, orderBy, limit, doc } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export function useRealtime() {
  const { firestore: db, user, isUserLoading } = useFirebase();
  const [isSuspended, setIsSuspended] = useState(false);
  const [currentAction, setCurrentAction] = useState<any>(null);

  useEffect(() => {
    if (!db || isUserLoading) return;

    // Écouter l'état global de la session
    const sessionStateRef = doc(db, 'sessionState', 'current');
    
    const unsubSettings = onSnapshot(sessionStateRef, (docSnap) => {
      if (docSnap.exists()) {
        setIsSuspended(docSnap.data().isSuspended === true);
      } else {
        setIsSuspended(false);
      }
    }, (error) => {
      if (user) {
        const permissionError = new FirestorePermissionError({
          path: 'sessionState/current',
          operation: 'get'
        });
        errorEmitter.emit('permission-error', permissionError);
      }
    });

    // Écouter l'action actuelle
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
      if (user) {
        const permissionError = new FirestorePermissionError({
          path: 'actions',
          operation: 'list'
        });
        errorEmitter.emit('permission-error', permissionError);
      }
    });

    return () => {
      unsubSettings();
      unsubActions();
    };
  }, [db, user, isUserLoading]);

  return { isSuspended, currentAction };
}
