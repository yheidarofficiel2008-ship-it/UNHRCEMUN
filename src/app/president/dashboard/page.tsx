"use client"

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Play, Pause, Plus, List, CheckCircle2, XCircle, FileText, Sparkles, LogOut, Users, Settings as SettingsIcon, Trash2, Database, Landmark } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
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
      const permissionError = new FirestorePermissionError({ path: 'delegates', operation: 'list' });
      errorEmitter.emit('permission-error', permissionError);
    });

    // Listen to resolutions
    const resolutionsRef = collection(db, 'resolutions');
    const qRes = query(resolutionsRef, orderBy('created_at', 'desc'));
    const unsubRes = onSnapshot(qRes, (snapshot) => {
      const resData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setResolutions(resData);
    }, async (err) => {
      const permissionError = new FirestorePermissionError({ path: 'resolutions', operation: 'list' });
      errorEmitter.emit('permission-error', permissionError);
    });

    // Listen to participations for current action
    let unsubPart = () => {};
    if (currentAction?.id) {
      const partRef = collection(db, 'participations');
      const qPart = query(partRef, where('action_id', '==', currentAction.id));
      unsubPart = onSnapshot(qPart, async (snapshot) => {
        const parts = await Promise.all(snapshot.docs.map(async (pDoc) => {
          const data = pDoc.data();
          const delegateRef = doc(db, 'delegates', data.delegate_id);
          const delegateSnap = await getDoc(delegateRef);
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
    try {
      // Create initial session state
      await setDoc(doc(db, 'sessionState', 'current'), { 
        isSuspended: false,
        lastUpdated: new Date().toISOString()
      }, { merge: true });
      
      // Create a test action
      await addDoc(collection(db, 'actions'), {
        title: "Session d'Ouverture",
        duration_minutes: 10,
        time_per_delegate: "1:00",
        description: "Bienvenue au conseil.",
        allow_participation: true,
        status: 'launched',
        created_at: serverTimestamp()
      });

      toast({ title: "Base de données prête", description: "Les documents initiaux ont été créés." });
    } catch (e: any) {
      toast({ title: "Erreur d'initialisation", description: e.message, variant: "destructive" });
    } finally {
      setInitializing(false);
    }
  };

  const toggleSuspension = async () => {
    const sessionRef = doc(db, 'sessionState', 'current');
    try {
      await setDoc(sessionRef, { 
        isSuspended: !isSuspended,
        lastUpdated: new Date().toISOString()
      }, { merge: true });
    } catch (e: any) {
      toast({ title: "Erreur", description: "Impossible de modifier l'état de la séance.", variant: "destructive" });
    }
  };

  const createAction = async () => {
    if (!newAction.title) return;
    try {
      await addDoc(collection(db, 'actions'), {
        title: newAction.title,
        duration_minutes: newAction.duration,
        time_per_delegate: newAction.timePerDelegate,
        description: newAction.description,
        allow_participation: newAction.allowParticipation,
        status: 'launched',
        created_at: serverTimestamp()
      });
      toast({ title: "Succès", description: "Action lancée !" });
      setNewAction({ title: '', duration: 15, timePerDelegate: '1:00', description: '', allowParticipation: true });
    } catch (e) {
      toast({ title: "Erreur", description: "Impossible de créer l'action", variant: "destructive" });
    }
  };

  const startAction = async () => {
    if (!currentAction) return;
    const actionRef = doc(db, 'actions', currentAction.id);
    await updateDoc(actionRef, { 
      status: 'started', 
      started_at: new Date().toISOString() 
    });
  };

  const addDelegate = async () => {
    if (!newDelegate.country || !newDelegate.password) return;
    try {
      await addDoc(collection(db, 'delegates'), {
        country_name: newDelegate.country,
        password: newDelegate.password,
        created_at: serverTimestamp()
      });
      setNewDelegate({ country: '', password: '' });
      toast({ title: "Délégué ajouté", description: `${newDelegate.country} peut maintenant se connecter.` });
    } catch (e) {
      toast({ title: "Erreur", description: "Impossible d'ajouter le délégué.", variant: "destructive" });
    }
  };

  const deleteDelegate = async (id: string) => {
    await deleteDoc(doc(db, 'delegates', id));
    toast({ title: "Supprimé", description: "Délégué retiré." });
  };

  const updateResolution = async (id: string, status: string) => {
    const resRef = doc(db, 'resolutions', id);
    await updateDoc(resRef, { status });
    toast({ title: "Statut mis à jour", description: `La résolution est maintenant : ${status}` });
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
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {isSuspended && <SuspensionOverlay />}
      
      <header className="bg-primary text-white p-4 shadow-md flex justify-between items-center z-20">
        <div className="flex items-center gap-4">
          <Landmark className="h-8 w-8" />
          <h1 className="text-xl font-bold font-headline uppercase tracking-widest">Immune UERC - Présidence</h1>
        </div>
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            size="sm"
            className="bg-white/10 border-white/20 text-white hover:bg-white/20"
            onClick={initDatabase}
            disabled={initializing}
          >
            <Database size={16} className="mr-2" /> Initialiser DB
          </Button>
          <Button 
            variant={isSuspended ? "destructive" : "outline"} 
            className={`${isSuspended ? 'bg-white text-destructive hover:bg-white/90' : 'bg-destructive text-white border-none hover:bg-destructive/90'}`}
            onClick={toggleSuspension}
          >
            {isSuspended ? "Reprendre la séance" : "Suspendre la séance"}
          </Button>
          <Button variant="ghost" className="text-white hover:bg-white/10" onClick={handleLogout}>
            <LogOut size={20} />
          </Button>
        </div>
      </header>

      <main className="flex-1 p-6 grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-[1600px] mx-auto w-full">
        {/* Left Column */}
        <div className="lg:col-span-4 space-y-6">
          <Tabs defaultValue="actions">
            <TabsList className="w-full">
              <TabsTrigger value="actions" className="flex-1">Actions</TabsTrigger>
              <TabsTrigger value="delegates" className="flex-1">Délégués</TabsTrigger>
            </TabsList>
            
            <TabsContent value="actions" className="space-y-6 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Plus className="text-primary" size={20} /> Nouvelle Action
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Nom de l'Action</Label>
                    <Input value={newAction.title} onChange={e => setNewAction({...newAction, title: e.target.value})} placeholder="ex: Débat Général" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Durée (min)</Label>
                      <Input type="number" value={newAction.duration} onChange={e => setNewAction({...newAction, duration: parseInt(e.target.value)})} />
                    </div>
                    <div className="space-y-2">
                      <Label>Temps par délégué</Label>
                      <Input value={newAction.timePerDelegate} onChange={e => setNewAction({...newAction, timePerDelegate: e.target.value})} placeholder="1:00" />
                    </div>
                  </div>
                  <Button className="w-full bg-primary" onClick={createAction}>Lancer l'Action</Button>
                </CardContent>
              </Card>

              {currentAction && (
                <Card className="border-primary/20 shadow-lg">
                  <CardHeader className="pb-2">
                    <Badge className="w-fit mb-2 bg-accent">{currentAction.status === 'launched' ? 'PRÊT' : currentAction.status === 'started' ? 'EN COURS' : 'TERMINÉ'}</Badge>
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
                        {participants.length === 0 ? (
                          <p className="text-center text-xs text-muted-foreground py-4">Aucune réponse pour le moment.</p>
                        ) : (
                          participants.map((p, i) => (
                            <div key={i} className="flex justify-between items-center p-2 border-b last:border-0">
                              <span>{p.delegates?.country_name}</span>
                              <Badge variant={p.status === 'participating' ? 'default' : 'secondary'}>{p.status === 'participating' ? 'Présent' : 'Passe'}</Badge>
                            </div>
                          ))
                        )}
                      </ScrollArea>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="delegates" className="space-y-6 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Ajouter un Pays</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Nom du Pays</Label>
                    <Input value={newDelegate.country} onChange={e => setNewDelegate({...newDelegate, country: e.target.value})} placeholder="France" />
                  </div>
                  <div className="space-y-2">
                    <Label>Mot de passe</Label>
                    <Input value={newDelegate.password} onChange={e => setNewDelegate({...newDelegate, password: e.target.value})} placeholder="123456" />
                  </div>
                  <Button className="w-full" onClick={addDelegate}>Créer le compte</Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Liste des Pays ({delegates.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[300px]">
                    <div className="space-y-2">
                      {delegates.map(d => (
                        <div key={d.id} className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                          <div>
                            <p className="font-bold">{d.country_name}</p>
                            <p className="text-xs text-muted-foreground">Pass: {d.password}</p>
                          </div>
                          <Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteDelegate(d.id)}>
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      ))}
                      {delegates.length === 0 && <p className="text-center text-sm text-muted-foreground py-10">Aucun délégué enregistré.</p>}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Column: Resolutions */}
        <div className="lg:col-span-8">
          <Card>
            <CardHeader className="bg-muted/30">
              <CardTitle className="flex items-center gap-2">
                <FileText size={20} /> Propositions de Résolutions
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {resolutions.length === 0 && <p className="text-center text-muted-foreground py-10 italic">Aucune résolution reçue.</p>}
              {resolutions.map(res => (
                <Card key={res.id} className="overflow-hidden border-2">
                  <div className="bg-muted/50 p-4 flex justify-between items-center">
                    <span className="font-bold text-primary">{res.proposing_country}</span>
                    <Badge className={res.status === 'approved' ? 'bg-green-600' : res.status === 'rejected' ? 'bg-red-600' : 'bg-blue-600'}>
                      {res.status.toUpperCase()}
                    </Badge>
                  </div>
                  <CardContent className="p-4 space-y-4">
                    <p className="text-sm italic border-l-4 pl-4 border-primary/20">{res.content}</p>
                    
                    {aiAnalysis[res.id] && !aiAnalysis[res.id].loading && (
                      <div className="bg-accent/5 p-3 rounded border text-sm space-y-2">
                        <div className="flex items-center gap-2 font-bold text-accent"><Sparkles size={16} /> Analyse IA</div>
                        <p>{aiAnalysis[res.id].summary}</p>
                        <ul className="list-disc list-inside text-xs opacity-80">
                          {aiAnalysis[res.id].keyPoints.map((kp: string, i: number) => <li key={i}>{kp}</li>)}
                        </ul>
                      </div>
                    )}

                    <div className="flex gap-2 justify-end">
                      <Button variant="outline" size="sm" onClick={() => analyzeResolution(res)} disabled={aiAnalysis[res.id]?.loading}>
                        {aiAnalysis[res.id]?.loading ? "Analyse..." : "Analyse IA"}
                      </Button>
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