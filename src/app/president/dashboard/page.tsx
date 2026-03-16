"use client"

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Play, Pause, Square, Plus, Trash2, Database, Landmark, LogOut, FileText, Sparkles, AlertCircle, CheckSquare, ListOrdered } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { useFirebase } from '@/firebase';
import { setDocumentNonBlocking, addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { collection, doc, onSnapshot, query, orderBy, getDocs, deleteDoc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { useRealtime } from '@/hooks/use-realtime';
import { GlobalTimer } from '@/components/GlobalTimer';
import { aiResolutionSummarizer } from '@/ai/flows/ai-resolution-summarizer';
import { useToast } from '@/hooks/use-toast';

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
    if (!db || !user) return;

    const delRef = collection(db, 'delegates');
    const unsubDel = onSnapshot(query(delRef, orderBy('country_name', 'asc')), (snap) => {
      setDelegates(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => console.warn("Erreur delegates:", err));

    const resolutionsRef = collection(db, 'resolutions');
    const qRes = query(resolutionsRef, orderBy('created_at', 'desc'));
    const unsubRes = onSnapshot(qRes, (snapshot) => {
      setResolutions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (err) => console.warn("Erreur resolutions:", err));

    return () => {
      unsubDel();
      unsubRes();
    };
  }, [db, user]);

  useEffect(() => {
    if (!db || !currentAction?.id) {
      setParticipants([]);
      return;
    }

    const partRef = collection(db, 'participations');
    const qPart = query(partRef, orderBy('updated_at', 'asc'));
    const unsubPart = onSnapshot(qPart, (snapshot) => {
      const parts = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter((p: any) => p.action_id === currentAction.id);
      setParticipants(parts);
    }, (err) => console.warn("Erreur participations:", err));

    return () => unsubPart();
  }, [db, currentAction?.id]);

  const initDatabase = () => {
    if (!db) return;
    setInitializing(true);
    const sessionRef = doc(db, 'sessionState', 'current');
    setDocumentNonBlocking(sessionRef, { isSuspended: false, lastUpdated: new Date().toISOString() }, { merge: true });
    toast({ title: "Base de données réinitialisée" });
    setInitializing(false);
  };

  const toggleSuspension = () => {
    if (!db) return;
    const sessionRef = doc(db, 'sessionState', 'current');
    updateDocumentNonBlocking(sessionRef, { isSuspended: !isSuspended, lastUpdated: new Date().toISOString() });
    toast({ title: !isSuspended ? "Séance Suspendue" : "Séance Reprise" });
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
      total_elapsed_seconds: 0,
      created_at: serverTimestamp()
    };
    addDocumentNonBlocking(collection(db, 'actions'), actionData);
    toast({ title: "Nouvelle action lancée" });
    setNewAction({ title: '', duration: 15, timePerDelegate: '1:00', description: '', allowParticipation: true });
  };

  const startTimer = () => {
    if (!db || !currentAction) return;
    const actionRef = doc(db, 'actions', currentAction.id);
    updateDocumentNonBlocking(actionRef, { 
      status: 'started', 
      started_at: new Date().toISOString() 
    });
  };

  const pauseTimer = () => {
    if (!db || !currentAction || !currentAction.started_at) return;
    const actionRef = doc(db, 'actions', currentAction.id);
    const now = new Date().getTime();
    const start = new Date(currentAction.started_at).getTime();
    const elapsedSinceStart = Math.floor((now - start) / 1000);
    const totalElapsed = (currentAction.total_elapsed_seconds || 0) + elapsedSinceStart;

    updateDocumentNonBlocking(actionRef, { 
      status: 'paused', 
      total_elapsed_seconds: totalElapsed,
      paused_at: new Date().toISOString()
    });
  };

  const stopAction = async () => {
    if (!db || !currentAction) return;
    const actionRef = doc(db, 'actions', currentAction.id);
    
    // 1. Marquer comme complété
    updateDocumentNonBlocking(actionRef, { status: 'completed' });

    // 2. Supprimer les participations pour cette action (nettoyage)
    try {
      const q = query(collection(db, 'participations'));
      const snap = await getDocs(q);
      const batch = writeBatch(db);
      snap.docs.forEach(doc => {
        if (doc.data().action_id === currentAction.id) {
          batch.delete(doc.ref);
        }
      });
      await batch.commit();
      toast({ title: "Action terminée", description: "La liste des orateurs a été réinitialisée." });
    } catch (e) {
      console.error("Erreur nettoyage participations:", e);
    }
  };

  const addDelegate = () => {
    if (!db || !newDelegate.country || !newDelegate.password) return;
    addDocumentNonBlocking(collection(db, 'delegates'), {
      country_name: newDelegate.country,
      password: newDelegate.password,
      created_at: serverTimestamp()
    });
    setNewDelegate({ country: '', password: '' });
  };

  const deleteDelegate = (id: string) => {
    if (!db) return;
    deleteDocumentNonBlocking(doc(db, 'delegates', id));
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

  if (isUserLoading) return <div className="min-h-screen flex items-center justify-center">Authentification...</div>;

  const orateursInscrits = participants.filter(p => p.status === 'participating');

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="bg-primary text-white p-4 shadow-md flex justify-between items-center z-50">
        <div className="flex items-center gap-4">
          <Landmark className="h-8 w-8" />
          <h1 className="text-xl font-bold font-headline uppercase tracking-widest">Immune UERC - Présidence</h1>
          {isSuspended && <Badge variant="destructive" className="animate-pulse">SÉANCE SUSPENDUE</Badge>}
        </div>
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" className="bg-white/10 border-white/20 text-white" onClick={initDatabase} disabled={initializing}>
            <Database size={16} className="mr-2" /> Initialiser
          </Button>
          <Button variant={isSuspended ? "destructive" : "outline"} onClick={toggleSuspension}>
            {isSuspended ? "Reprendre la Séance" : "Suspendre"}
          </Button>
          <Button variant="ghost" className="text-white hover:bg-white/10" onClick={handleLogout}>
            <LogOut size={20} />
          </Button>
        </div>
      </header>

      <main className="flex-1 p-6 grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-[1600px] mx-auto w-full">
        <div className="lg:col-span-4 space-y-6">
          <Tabs defaultValue="actions">
            <TabsList className="w-full">
              <TabsTrigger value="actions" className="flex-1">Actions</TabsTrigger>
              <TabsTrigger value="delegates" className="flex-1">Pays</TabsTrigger>
            </TabsList>
            
            <TabsContent value="actions" className="space-y-6 mt-4">
              <Card>
                <CardHeader><CardTitle className="text-lg">Nouvelle Action</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Titre</Label>
                    <Input value={newAction.title} onChange={e => setNewAction({...newAction, title: e.target.value})} placeholder="Ex: Débat Général" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label className="text-[10px] uppercase">Durée (min)</Label>
                      <Input type="number" value={newAction.duration} onChange={e => setNewAction({...newAction, duration: parseInt(e.target.value)})} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] uppercase">Temps Parole</Label>
                      <Input value={newAction.timePerDelegate} onChange={e => setNewAction({...newAction, timePerDelegate: e.target.value})} />
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 p-2 border rounded-lg bg-muted/30">
                    <Checkbox 
                      id="participation" 
                      checked={newAction.allowParticipation} 
                      onCheckedChange={(checked) => setNewAction({...newAction, allowParticipation: !!checked})} 
                    />
                    <Label htmlFor="participation" className="text-sm cursor-pointer">Autoriser la participation facultative</Label>
                  </div>
                  <Button className="w-full bg-primary" onClick={createAction}>Lancer l'Action</Button>
                </CardContent>
              </Card>

              {currentAction && currentAction.status !== 'completed' && (
                <Card className="border-primary/20 shadow-lg overflow-hidden">
                  <div className="bg-primary/5 p-4 border-b">
                    <Badge className="mb-2 uppercase">{currentAction.status}</Badge>
                    <CardTitle className="text-xl">{currentAction.title}</CardTitle>
                  </div>
                  <CardContent className="p-6 space-y-6">
                    <GlobalTimer 
                      status={currentAction.status}
                      startedAt={currentAction.started_at}
                      pausedAt={currentAction.paused_at}
                      totalElapsedSeconds={currentAction.total_elapsed_seconds}
                      durationMinutes={currentAction.duration_minutes}
                    />
                    
                    <div className="grid grid-cols-2 gap-3">
                      {(currentAction.status === 'launched' || currentAction.status === 'paused') ? (
                        <Button className="bg-green-600 hover:bg-green-700 h-12 gap-2" onClick={startTimer}>
                          <Play size={18} fill="currentColor" /> Démarrer
                        </Button>
                      ) : (
                        <Button variant="outline" className="border-amber-500 text-amber-600 hover:bg-amber-50 h-12 gap-2" onClick={pauseTimer}>
                          <Pause size={18} fill="currentColor" /> Pause
                        </Button>
                      )}
                      <Button variant="destructive" className="h-12 gap-2" onClick={stopAction}>
                        <Square size={18} fill="currentColor" /> Arrêter
                      </Button>
                    </div>

                    <div className="space-y-3 pt-4 border-t">
                      <h3 className="font-bold text-sm text-muted-foreground uppercase flex items-center justify-between">
                        <span className="flex items-center gap-2"><ListOrdered size={14} /> Liste des Orateurs</span>
                        <Badge variant="secondary">{orateursInscrits.length}</Badge>
                      </h3>
                      <ScrollArea className="h-[200px] border rounded-xl p-3 bg-muted/10">
                        {orateursInscrits.length > 0 ? orateursInscrits.map((p, i) => (
                          <div key={i} className="flex justify-between items-center p-3 mb-2 bg-white border rounded-lg shadow-sm last:mb-0">
                            <span className="font-bold text-sm">{i + 1}. {p.country_name}</span>
                            <Badge className="bg-green-500">Prêt</Badge>
                          </div>
                        )) : (
                          <div className="text-center py-10 text-muted-foreground text-xs italic">Aucun orateur inscrit</div>
                        )}
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
                <CardHeader><CardTitle className="text-lg">Délégués ({delegates.length})</CardTitle></CardHeader>
                <CardContent>
                  <ScrollArea className="h-[300px]">
                    {delegates.map(d => (
                      <div key={d.id} className="flex justify-between items-center p-3 bg-muted/50 mb-2 rounded-lg">
                        <div className="flex flex-col">
                          <span className="font-semibold">{d.country_name}</span>
                          <span className="text-[10px] text-muted-foreground font-mono">ID: {d.id.substring(0,8)} | Pass: {d.password}</span>
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
          <Card className="h-full">
            <CardHeader className="bg-muted/30"><CardTitle className="flex items-center gap-2"><FileText /> Propositions de Résolutions</CardTitle></CardHeader>
            <CardContent className="p-6 space-y-6">
              {resolutions.map(res => (
                <Card key={res.id} className="overflow-hidden border-2 hover:border-primary/30 transition-colors">
                  <div className="bg-muted/50 p-4 flex justify-between items-center border-b">
                    <span className="font-bold text-primary">{res.proposing_country}</span>
                    <Badge variant={res.status === 'approved' ? 'default' : res.status === 'rejected' ? 'destructive' : 'secondary'}>
                      {res.status?.toUpperCase()}
                    </Badge>
                  </div>
                  <CardContent className="p-4 space-y-4">
                    <p className="text-sm italic whitespace-pre-wrap leading-relaxed">"{res.content}"</p>
                    {aiAnalysis[res.id] && !aiAnalysis[res.id].loading && (
                      <div className="bg-accent/5 p-4 rounded-xl border-l-4 border-accent text-sm animate-in fade-in slide-in-from-left-2">
                        <div className="flex items-center gap-2 font-bold text-accent mb-2"><Sparkles size={16} /> Résumé IA</div>
                        <p className="mb-3 font-medium">{aiAnalysis[res.id].summary}</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {aiAnalysis[res.id].keyPoints?.map((pt: string, i: number) => (
                            <div key={i} className="text-xs bg-white/50 p-2 rounded">• {pt}</div>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="flex gap-2 justify-end pt-2 border-t">
                      <Button variant="outline" size="sm" onClick={() => analyzeResolution(res)} disabled={aiAnalysis[res.id]?.loading}>
                        {aiAnalysis[res.id]?.loading ? "Analyse..." : <><Sparkles size={14} className="mr-2" /> Analyse IA</>}
                      </Button>
                      <Button variant="outline" size="sm" className="text-green-600 hover:bg-green-50" onClick={() => updateDocumentNonBlocking(doc(db!, 'resolutions', res.id), { status: 'approved' })}>Approuver</Button>
                      <Button variant="outline" size="sm" className="text-red-600 hover:bg-red-50" onClick={() => updateDocumentNonBlocking(doc(db!, 'resolutions', res.id), { status: 'rejected' })}>Rejeter</Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {resolutions.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 text-muted-foreground opacity-30">
                  <AlertCircle size={60} className="mb-4" />
                  <p>Aucune proposition soumise</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}