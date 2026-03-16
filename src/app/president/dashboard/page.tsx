"use client"

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Play, Plus, Trash2, Database, Landmark, LogOut, FileText, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { db, auth } from '@/lib/firebase';
import { collection, addDoc, updateDoc, doc, onSnapshot, query, orderBy, where, getDoc, setDoc, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { signOut, onAuthStateChanged } from 'firebase/auth';
import { useRealtime } from '@/hooks/use-realtime';
import { SuspensionOverlay } from '@/components/SuspensionOverlay';
import { GlobalTimer } from '@/components/GlobalTimer';
import { aiResolutionSummarizer } from '@/ai/flows/ai-resolution-summarizer';
import { useToast } from '@/hooks/use-toast';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export default function PresidentDashboard() {
  const router = useRouter();
  const { toast } = useToast();
  const { isSuspended, currentAction } = useRealtime();
  
  const [newAction, setNewAction] = useState({
    title: '',
    duration: 15,
    timePerDelegate: '1:00',
    description: '',
    allowParticipation: true
  });

  const [newDelegate, setNewDelegate] = useState({ country: '', password: '' });
  const [delegates, setDelegates] = useState<any[]>([]);
  const [resolutions, setResolutions] = useState<any[]>([]);
  const [participants, setParticipants] = useState<any[]>([]);
  const [aiAnalysis, setAiAnalysis] = useState<Record<string, any>>({});
  const [initializing, setInitializing] = useState(false);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      if (!user) router.push('/president/login');
    });

    // Listen to delegates
    const delRef = collection(db, 'delegates');
    const unsubDel = onSnapshot(query(delRef, orderBy('country_name', 'asc')), (snap) => {
      setDelegates(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, async (err) => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({ path: 'delegates', operation: 'list' }));
    });

    // Listen to resolutions
    const resolutionsRef = collection(db, 'resolutions');
    const qRes = query(resolutionsRef, orderBy('created_at', 'desc'));
    const unsubRes = onSnapshot(qRes, (snapshot) => {
      setResolutions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, async (err) => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({ path: 'resolutions', operation: 'list' }));
    });

    // Listen to participations for current action
    let unsubPart = () => {};
    if (currentAction?.id) {
      const partRef = collection(db, 'participations');
      const qPart = query(partRef, where('action_id', '==', currentAction.id));
      unsubPart = onSnapshot(qPart, async (snapshot) => {
        const parts = await Promise.all(snapshot.docs.map(async (pDoc) => {
          const data = pDoc.data();
          const delegateSnap = await getDoc(doc(db, 'delegates', data.delegate_id));
          return {
            id: pDoc.id,
            ...data,
            delegates: delegateSnap.exists() ? delegateSnap.data() : { country_name: 'Inconnu' }
          };
        }));
        setParticipants(parts);
      });
    }

    return () => {
      unsubAuth();
      unsubDel();
      unsubRes();
      unsubPart();
    };
  }, [currentAction?.id, router]);

  const initDatabase = async () => {
    setInitializing(true);
    const sessionRef = doc(db, 'sessionState', 'current');
    const actionCol = collection(db, 'actions');

    const initialState = { 
      isSuspended: false,
      lastUpdated: new Date().toISOString()
    };

    setDoc(sessionRef, initialState, { merge: true }).catch(async () => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({ path: sessionRef.path, operation: 'write', requestResourceData: initialState }));
    });
    
    const initialAction = {
      title: "Session d'Ouverture",
      duration_minutes: 10,
      time_per_delegate: "1:00",
      description: "Bienvenue au conseil.",
      allow_participation: true,
      status: 'launched',
      created_at: serverTimestamp()
    };

    addDoc(actionCol, initialAction).catch(async () => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({ path: actionCol.path, operation: 'create', requestResourceData: initialAction }));
    });

    toast({ title: "Initialisation envoyée" });
    setInitializing(false);
  };

  const toggleSuspension = () => {
    const sessionRef = doc(db, 'sessionState', 'current');
    const update = { isSuspended: !isSuspended, lastUpdated: new Date().toISOString() };
    
    setDoc(sessionRef, update, { merge: true }).catch(async () => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({ path: sessionRef.path, operation: 'update', requestResourceData: update }));
    });
  };

  const createAction = () => {
    if (!newAction.title) return;
    const actionData = {
      title: newAction.title,
      duration_minutes: newAction.duration,
      time_per_delegate: newAction.timePerDelegate,
      description: newAction.description,
      allow_participation: newAction.allowParticipation,
      status: 'launched',
      created_at: serverTimestamp()
    };

    addDoc(collection(db, 'actions'), actionData)
      .then(() => {
        toast({ title: "Action lancée !" });
        setNewAction({ title: '', duration: 15, timePerDelegate: '1:00', description: '', allowParticipation: true });
      })
      .catch(async () => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({ path: 'actions', operation: 'create', requestResourceData: actionData }));
      });
  };

  const startAction = () => {
    if (!currentAction) return;
    const actionRef = doc(db, 'actions', currentAction.id);
    const update = { status: 'started', started_at: new Date().toISOString() };
    
    updateDoc(actionRef, update).catch(async () => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({ path: actionRef.path, operation: 'update', requestResourceData: update }));
    });
  };

  const addDelegate = () => {
    if (!newDelegate.country || !newDelegate.password) return;
    const delegateData = {
      country_name: newDelegate.country,
      password: newDelegate.password,
      created_at: serverTimestamp()
    };

    addDoc(collection(db, 'delegates'), delegateData)
      .then(() => {
        toast({ title: "Délégué ajouté" });
        setNewDelegate({ country: '', password: '' });
      })
      .catch(async () => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({ path: 'delegates', operation: 'create', requestResourceData: delegateData }));
      });
  };

  const deleteDelegate = (id: string) => {
    const docRef = doc(db, 'delegates', id);
    deleteDoc(docRef).catch(async () => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({ path: docRef.path, operation: 'delete' }));
    });
  };

  const updateResolution = (id: string, status: string) => {
    const resRef = doc(db, 'resolutions', id);
    updateDoc(resRef, { status }).catch(async () => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({ path: resRef.path, operation: 'update', requestResourceData: { status } }));
    });
  };

  const analyzeResolution = async (res: any) => {
    setAiAnalysis(prev => ({ ...prev, [res.id]: { loading: true } }));
    try {
      const summary = await aiResolutionSummarizer({ resolutionText: res.content });
      setAiAnalysis(prev => ({ ...prev, [res.id]: { ...summary, loading: false } }));
    } catch (e) {
      setAiAnalysis(prev => ({ ...prev, [res.id]: { error: true, loading: false } }));
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {isSuspended && <SuspensionOverlay />}
      
      <header className="bg-primary text-white p-4 shadow-md flex justify-between items-center z-20">
        <div className="flex items-center gap-4">
          <Landmark className="h-8 w-8" />
          <h1 className="text-xl font-bold font-headline uppercase tracking-widest">Immune UERC - Présidence</h1>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" className="bg-white/10 border-white/20 text-white" onClick={initDatabase} disabled={initializing}>
            <Database size={16} className="mr-2" /> Initialiser DB
          </Button>
          <Button variant={isSuspended ? "destructive" : "outline"} onClick={toggleSuspension}>
            {isSuspended ? "Reprendre la séance" : "Suspendre la séance"}
          </Button>
          <Button variant="ghost" onClick={handleLogout}>
            <LogOut size={20} />
          </Button>
        </div>
      </header>

      <main className="flex-1 p-6 grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-[1600px] mx-auto w-full">
        <div className="lg:col-span-4 space-y-6">
          <Tabs defaultValue="actions">
            <TabsList className="w-full">
              <TabsTrigger value="actions" className="flex-1">Actions</TabsTrigger>
              <TabsTrigger value="delegates" className="flex-1">Délégués</TabsTrigger>
            </TabsList>
            
            <TabsContent value="actions" className="space-y-6 mt-4">
              <Card>
                <CardHeader><CardTitle className="text-lg">Nouvelle Action</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Nom de l'Action</Label>
                    <Input value={newAction.title} onChange={e => setNewAction({...newAction, title: e.target.value})} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Input type="number" value={newAction.duration} onChange={e => setNewAction({...newAction, duration: parseInt(e.target.value)})} />
                    <Input value={newAction.timePerDelegate} onChange={e => setNewAction({...newAction, timePerDelegate: e.target.value})} />
                  </div>
                  <Button className="w-full bg-primary" onClick={createAction}>Lancer l'Action</Button>
                </CardContent>
              </Card>

              {currentAction && (
                <Card className="border-primary/20 shadow-lg">
                  <CardHeader>
                    <Badge className="w-fit mb-2">{currentAction.status.toUpperCase()}</Badge>
                    <CardTitle>{currentAction.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <GlobalTimer startedAt={currentAction.started_at} durationMinutes={currentAction.duration_minutes} />
                    {currentAction.status === 'launched' && (
                      <Button className="w-full h-16 text-xl gap-3" onClick={startAction}>
                        <Play fill="currentColor" /> Démarrer
                      </Button>
                    )}
                    <div className="space-y-3">
                      <h3 className="font-bold text-sm text-muted-foreground uppercase">Participants ({participants.filter(p => p.status === 'participating').length})</h3>
                      <ScrollArea className="h-[150px] border rounded-md p-2">
                        {participants.map((p, i) => (
                          <div key={i} className="flex justify-between items-center p-2 border-b">
                            <span>{p.delegates?.country_name}</span>
                            <Badge variant={p.status === 'participating' ? 'default' : 'secondary'}>{p.status}</Badge>
                          </div>
                        ))}
                      </ScrollArea>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="delegates" className="space-y-6 mt-4">
              <Card>
                <CardHeader><CardTitle className="text-lg">Ajouter un Pays</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <Input value={newDelegate.country} onChange={e => setNewDelegate({...newDelegate, country: e.target.value})} placeholder="Pays" />
                  <Input value={newDelegate.password} onChange={e => setNewDelegate({...newDelegate, password: e.target.value})} placeholder="Pass" />
                  <Button className="w-full" onClick={addDelegate}>Créer le compte</Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle className="text-lg">Liste des Pays</CardTitle></CardHeader>
                <CardContent>
                  <ScrollArea className="h-[300px]">
                    {delegates.map(d => (
                      <div key={d.id} className="flex justify-between items-center p-3 bg-muted/50 mb-2 rounded-lg">
                        <span>{d.country_name}</span>
                        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteDelegate(d.id)}><Trash2 size={16} /></Button>
                      </div>
                    ))}
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <div className="lg:col-span-8">
          <Card>
            <CardHeader className="bg-muted/30"><CardTitle>Propositions de Résolutions</CardTitle></CardHeader>
            <CardContent className="p-6 space-y-6">
              {resolutions.map(res => (
                <Card key={res.id} className="overflow-hidden border-2">
                  <div className="bg-muted/50 p-4 flex justify-between items-center">
                    <span className="font-bold text-primary">{res.proposing_country}</span>
                    <Badge>{res.status.toUpperCase()}</Badge>
                  </div>
                  <CardContent className="p-4 space-y-4">
                    <p className="text-sm italic">{res.content}</p>
                    {aiAnalysis[res.id] && !aiAnalysis[res.id].loading && (
                      <div className="bg-accent/5 p-3 rounded border text-sm">
                        <p className="font-bold text-accent mb-2">Analyse IA</p>
                        <p>{aiAnalysis[res.id].summary}</p>
                      </div>
                    )}
                    <div className="flex gap-2 justify-end">
                      <Button variant="outline" size="sm" onClick={() => analyzeResolution(res)} disabled={aiAnalysis[res.id]?.loading}>Analyse IA</Button>
                      <Button variant="outline" size="sm" className="text-green-600" onClick={() => updateResolution(res.id, 'approved')}>Approuver</Button>
                      <Button variant="outline" size="sm" className="text-red-600" onClick={() => updateResolution(res.id, 'rejected')}>Rejeter</Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
