import { initializeFirebase } from '@/firebase';

// On utilise l'initialisation standard du projet qui contient déjà les bonnes clés API
const { firebaseApp, auth, firestore: db } = initializeFirebase();

export { firebaseApp as app, auth, db };
