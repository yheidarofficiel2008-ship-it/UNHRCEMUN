
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
import { useFirebase, setDocumentNonBlocking, addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase';
import { collection, doc, onSnapshot, query, orderBy, where, getDoc, serverTimestamp } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
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
  const { firestore: db, auth, user, isUserLoading } = useFirebase();
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
    if (!isUserLoading && !user) {
      router.push('/president/login');
    }
  }, [user, isUserLoading, router]);

  useEffect(() => {
    if (!db) return;

    const delRef = collection(db, 'delegates');
    const unsubDel = onSnapshot(query(delRef, orderBy('country_name', 'asc')), (snap) => {
      setDelegates(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({ path: 'delegates', operation: 'list' }));
    });

    const resolutionsRef = collection(db, 'resolutions');
    const qRes = query(resolutionsRef, orderBy('created_at', 'desc'));
    const unsubRes = onSnapshot(qRes, (snapshot) => {
      setResolutions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (err) => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({ path: 'resolutions', operation: 'list' }));
    });

    return () => {
      unsubDel();
      unsubRes();
    };
  }, [db]);

  useEffect(() => {
    if (!db || !currentAction?.id) return;

    const partRef = collection(db, 'actions', currentAction.id, 'participations');
    const unsubPart = onSnapshot(partRef, async (snapshot) => {
      const parts = await Promise.all(snapshot.docs.map(async (pDoc) => {
        const data = pDoc.data();
        const delegateSnap = await getDoc(doc(db!, 'delegates', data.delegate_id || data.delegateId));
        return {
          id: pDoc.id,
          ...data,
          delegate: delegateSnap.exists() ? delegateSnap.data() : { country_name: 'Inconnu' }
        };
      }));
      setParticipants(parts);
    });

    return () => unsubPart();
  }, [db, currentAction?.id]);

  const initDatabase = () => {
    if (!db) return;
    setInitializing(true);
    
    const sessionRef = doc(db, 'sessionState', 'current');
    const initialState = { 
      isSuspended: false,
      lastUpdated: new Date().toISOString()
    };
    setDocumentNonBlocking(sessionRef, initialState, { merge: true });

    const actionCol = collection(db, 'actions');
    const initialAction = {
      title: "Session d'Ouverture",
      duration_minutes: 10,
      time_per_delegate: "1:00",
      description: "Bienvenue au conseil.",
      allow_participation: true,
      status: 'launched',
      created_at: serverTimestamp()
    };
    addDocumentNonBlocking(actionCol, initialAction);

    toast({ title: "Initialisation lancée" });
    setInitializing(false);
  };

  const toggleSuspension = () => {
    if (!db) return;
    const sessionRef = doc(db, 'sessionState', 'current');
    const update = { isSuspended: !isSuspended, lastUpdated: new Date().toISOString() };
    setDocumentNonBlocking(sessionRef, update, { merge: true });
  };

  const createAction = () => {
    if (!db || !newAction.title) return;
    const actionData = {
      title: newAction.title,
      duration_minutes: newAction.duration,
      time_per_delegate: newAction.timePerDelegate,
      description: newAction.description,
      allow_participation: newAction.allowParticipation,
      status: 'launched',
      created_at: serverTimestamp()
    };

    addDocumentNonBlocking(collection(db, 'actions'), actionData);
    toast({ title: "Action lancée !" });
    setNewAction({ title: '', duration: 15, timePerDelegate: '1:00', description: '', allowParticipation: true });
  };

  const startAction = () => {
    if (!db || !currentAction) return;
    const actionRef = doc(db, 'actions', currentAction.id);
    const update = { status: 'started', started_at: new Date().toISOString() };
    updateDocumentNonBlocking(actionRef, update);
  };

  const addDelegate = () => {
    if (!db || !newDelegate.country || !newDelegate.password) return;
    const delegateData = {
      country_name: newDelegate.country,
      password: newDelegate.password,
      created_at: serverTimestamp()
    };

    addDocumentNonBlocking(collection(db, 'delegates'), delegateData);
    toast({ title: "Délégué ajouté" });
    setNewDelegate({ country: '', password: '' });
  };

  const deleteDelegate = (id: string) => {
    if (!db) return;
    const docRef = doc(db, 'delegates', id);
    deleteDocumentNonBlocking(docRef);
  };

  const updateResolution = (id: string, status: string) => {
    if (!db) return;
    const resRef = doc(db, 'resolutions', id);
    updateDocumentNonBlocking(resRef, { status });
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
    if (!auth) return;
    await signOut(auth);
    router.push('/');
  };

  if (isUserLoading) return <div className="min-h-screen flex items-center justify-center">Chargement...</div>;

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
            {isSuspended ? "Reprendre" : "Suspendre"}
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
                    <div className="space-y-1">
                      <Label className="text-[10px] uppercase">Minutes</Label>
                      <Input type="number" value={newAction.duration} onChange={e => setNewAction({...newAction, duration: parseInt(e.target.value)})} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] uppercase">Temps Parole</Label>
                      <Input value={newAction.timePerDelegate} onChange={e => setNewAction({...newAction, timePerDelegate: e.target.value})} />
                    </div>
                  </div>
                  <Button className="w-full bg-primary" onClick={createAction}>Lancer l'Action</Button>
                </CardContent>
              </Card>

              {currentAction && (
                <Card className="border-primary/20 shadow-lg">
                  <CardHeader>
                    <Badge className="w-fit mb-2">{currentAction.status?.toUpperCase() || 'LANCÉ'}</Badge>
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
                      <h3 className="font-bold text-sm text-muted-foreground uppercase">Participants ({participants.filter(p => p.status === 'participating' || p.isParticipating).length})</h3>
                      <ScrollArea className="h-[150px] border rounded-md p-2">
                        {participants.map((p, i) => (
                          <div key={i} className="flex justify-between items-center p-2 border-b">
                            <span>{p.delegate?.country_name || 'Pays inconnu'}</span>
                            <Badge variant={(p.status === 'participating' || p.isParticipating) ? 'default' : 'secondary'}>
                              {(p.status === 'participating' || p.isParticipating) ? 'Participe' : 'Passe'}
                            </Badge>
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
                  <Input value={newDelegate.country} onChange={e => setNewDelegate({...newDelegate, country: e.target.value})} placeholder="Nom du Pays" />
                  <Input value={newDelegate.password} onChange={e => setNewDelegate({...newDelegate, password: e.target.value})} placeholder="Mot de passe" />
                  <Button className="w-full" onClick={addDelegate}>Créer le compte</Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle className="text-lg">Liste des Pays</CardTitle></CardHeader>
                <CardContent>
                  <ScrollArea className="h-[300px]">
                    {delegates.map(d => (
                      <div key={d.id} className="flex justify-between items-center p-3 bg-muted/50 mb-2 rounded-lg">
                        <div className="flex flex-col">
                          <span className="font-semibold">{d.country_name}</span>
                          <span className="text-[10px] text-muted-foreground font-mono">Pass: {d.password}</span>
                        </div>
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
                    <Badge variant={res.status === 'approved' ? 'default' : res.status === 'rejected' ? 'destructive' : 'secondary'}>
                      {res.status?.toUpperCase() || 'PENDING'}
                    </Badge>
                  </div>
                  <CardContent className="p-4 space-y-4">
                    <p className="text-sm italic whitespace-pre-wrap">"{res.content}"</p>
                    {aiAnalysis[res.id] && !aiAnalysis[res.id].loading && (
                      <div className="bg-accent/5 p-3 rounded border text-sm">
                        <div className="flex items-center gap-2 font-bold text-accent mb-2">
                          <Sparkles size={14} /> Analyse IA
                        </div>
                        <p className="mb-2">{aiAnalysis[res.id].summary}</p>
                        <ul className="space-y-1 list-disc list-inside">
                          {aiAnalysis[res.id].keyPoints?.map((pt: string, i: number) => (
                            <li key={i} className="text-xs">{pt}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <div className="flex gap-2 justify-end">
                      <Button variant="outline" size="sm" onClick={() => analyzeResolution(res)} disabled={aiAnalysis[res.id]?.loading}>
                        {aiAnalysis[res.id]?.loading ? "Analyse..." : "Analyse IA"}
                      </Button>
                      <Button variant="outline" size="sm" className="text-green-600 hover:text-green-700" onClick={() => updateResolution(res.id, 'approved')}>Approuver</Button>
                      <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700" onClick={() => updateResolution(res.id, 'rejected')}>Rejeter</Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {resolutions.length === 0 && <p className="text-center text-muted-foreground py-10">Aucune résolution soumise pour le moment.</p>}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
