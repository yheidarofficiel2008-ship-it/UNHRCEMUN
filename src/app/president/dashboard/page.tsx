
"use client"

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Play, Pause, Square, Database, Landmark, LogOut, FileText, Monitor, Eye, EyeOff, CheckCircle, XCircle, ListOrdered, Clock, Timer, MessageSquareOff, MessageSquare, Plus, Trash2, Bell, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { useFirebase } from '@/firebase';
import { setDocumentNonBlocking, addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { collection, doc, onSnapshot, query, orderBy, getDocs, serverTimestamp, writeBatch, increment, where } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { useRealtime } from '@/hooks/use-realtime';
import { GlobalTimer } from '@/components/GlobalTimer';
import { SpeakingTimer } from '@/components/SpeakingTimer';
import { useToast } from '@/hooks/use-toast';

export default function PresidentDashboard() {
  const router = useRouter();
  const { toast } = useToast();
  const { firestore: db, auth, user, isUserLoading } = useFirebase();
  const { isSuspended, allowResolutions, currentAction } = useRealtime();
  
  const [customMinutes, setCustomMinutes] = useState('1');
  const [newAction, setNewAction] = useState({
    title: '',
    duration: 15,
    timePerDelegate: '1:00',
    description: '',
    allowParticipation: true
  });

  const [delegates, setDelegates] = useState<any[]>([]);
  const [resolutions, setResolutions] = useState<any[]>([]);
  const [participants, setParticipants] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
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
    });

    const resolutionsRef = collection(db, 'resolutions');
    const unsubRes = onSnapshot(query(resolutionsRef, orderBy('created_at', 'desc')), (snapshot) => {
      setResolutions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const messagesRef = collection(db, 'messages');
    const unsubMessages = onSnapshot(query(messagesRef, orderBy('timestamp', 'desc')), (snapshot) => {
      setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
      unsubDel();
      unsubRes();
      unsubMessages();
    };
  }, [db, user]);

  useEffect(() => {
    if (!db || !currentAction?.id) {
      setParticipants([]);
      return;
    }

    const partRef = collection(db, 'participations');
    const unsubPart = onSnapshot(query(partRef, orderBy('updated_at', 'asc')), (snapshot) => {
      const parts = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter((p: any) => p.action_id === currentAction.id);
      setParticipants(parts);
    });

    return () => unsubPart();
  }, [db, currentAction?.id]);

  const initDatabase = () => {
    if (!db) return;
    setInitializing(true);
    const sessionRef = doc(db, 'sessionState', 'current');
    setDocumentNonBlocking(sessionRef, { 
      isSuspended: false, 
      allowResolutions: true,
      lastUpdated: new Date().toISOString() 
    }, { merge: true });
    toast({ title: "Base de données initialisée" });
    setInitializing(false);
  };

  const toggleSuspension = () => {
    if (!db) return;
    const sessionRef = doc(db, 'sessionState', 'current');
    updateDocumentNonBlocking(sessionRef, { isSuspended: !isSuspended, lastUpdated: new Date().toISOString() });
  };

  const toggleResolutions = (val: boolean) => {
    if (!db) return;
    const sessionRef = doc(db, 'sessionState', 'current');
    updateDocumentNonBlocking(sessionRef, { allowResolutions: val, lastUpdated: new Date().toISOString() });
    toast({ title: val ? "Résolutions autorisées" : "Résolutions bloquées" });
  };

  const createAction = async () => {
    if (!db || !newAction.title) {
      toast({ title: "Erreur", description: "Veuillez donner un titre à l'action.", variant: "destructive" });
      return;
    }
    
    try {
      const actionData = {
        title: newAction.title,
        duration_minutes: Number(newAction.duration),
        time_per_delegate: newAction.timePerDelegate,
        description: newAction.description || "Action en cours",
        allow_participation: newAction.allowParticipation,
        status: 'launched',
        total_elapsed_seconds: 0,
        speaking_timer_total_elapsed: 0,
        speaking_timer_status: 'stopped',
        created_at: serverTimestamp(),
      };
      
      await addDocumentNonBlocking(collection(db, 'actions'), actionData);
      toast({ title: "Action lancée" });
      setNewAction({ title: '', duration: 15, timePerDelegate: '1:00', description: '', allowParticipation: true });
    } catch (e) {
      toast({ title: "Erreur", description: "Impossible de créer l'action.", variant: "destructive" });
    }
  };

  const extendTime = (mins: number) => {
    if (!db || !currentAction || isNaN(mins)) return;
    const actionRef = doc(db, 'actions', currentAction.id);
    updateDocumentNonBlocking(actionRef, { 
      duration_minutes: increment(mins)
    });
    toast({ title: `+${mins} minute(s) ajoutée(s)` });
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
      paused_at: new Date().toISOString(),
      started_at: null
    });
  };

  const startSpeakingTimer = () => {
    if (!db || !currentAction) return;
    updateDocumentNonBlocking(doc(db, 'actions', currentAction.id), {
      speaking_timer_status: 'started',
      speaking_timer_started_at: new Date().toISOString()
    });
  };

  const resetSpeakingTimer = () => {
    if (!db || !currentAction) return;
    updateDocumentNonBlocking(doc(db, 'actions', currentAction.id), {
      speaking_timer_status: 'stopped',
      speaking_timer_started_at: null,
      speaking_timer_total_elapsed: 0
    });
  };

  const stopAction = async () => {
    if (!db || !currentAction) return;
    const actionRef = doc(db, 'actions', currentAction.id);
    
    updateDocumentNonBlocking(actionRef, { status: 'completed' });

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
      toast({ title: "Action terminée" });
    } catch (e) {
      console.error(e);
    }
  };

  const markMessageAsRead = (messageId: string) => {
    if (!db) return;
    updateDocumentNonBlocking(doc(db, 'messages', messageId), { is_read: true });
  };

  const deleteMessage = (messageId: string) => {
    if (!db) return;
    deleteDocumentNonBlocking(doc(db, 'messages', messageId));
  };

  const handleLogout = async () => {
    if (!auth) return;
    await signOut(auth);
    router.push('/');
  };

  if (isUserLoading) return <div className="min-h-screen flex items-center justify-center">Authentification...</div>;

  const orateursInscrits = participants.filter(p => p.status === 'participating');
  const unreadMessagesCount = messages.filter(m => !m.is_read).length;

  const parseTimePerDelegate = (timeStr: string) => {
    if (!timeStr) return 60;
    const [mins, secs] = timeStr.split(':').map(Number);
    return (mins * 60) + (secs || 0);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="bg-primary text-white p-4 shadow-md flex justify-between items-center z-50">
        <div className="flex items-center gap-4">
          <Landmark className="h-8 w-8" />
          <h1 className="text-xl font-bold font-headline uppercase tracking-widest">Immune UERC - Présidence</h1>
          {isSuspended && <Badge variant="destructive" className="animate-pulse">SÉANCE SUSPENDUE</Badge>}
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-full border border-white/20">
            {allowResolutions ? <MessageSquare size={16} /> : <MessageSquareOff size={16} />}
            <span className="text-xs font-bold uppercase tracking-tighter">Résolutions</span>
            <Switch 
              checked={allowResolutions} 
              onCheckedChange={toggleResolutions}
              className="data-[state=checked]:bg-green-500"
            />
          </div>
          <div className="h-6 w-px bg-white/20" />
          <Button variant="outline" size="sm" className="bg-white/10 border-white/20 text-white" onClick={initDatabase} disabled={initializing}>
            <Database size={16} className="mr-2" /> Init
          </Button>
          <Button variant={isSuspended ? "destructive" : "outline"} onClick={toggleSuspension}>
            {isSuspended ? "Reprendre" : "Suspendre"}
          </Button>
          <Button variant="ghost" className="text-white hover:bg-white/10" onClick={handleLogout}>
            <LogOut size={20} />
          </Button>
        </div>
      </header>

      <main className="flex-1 p-6 grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-[1600px] mx-auto w-full">
        {/* Colonne Gauche */}
        <div className="lg:col-span-4 space-y-6">
          <Tabs defaultValue="actions">
            <TabsList className="w-full">
              <TabsTrigger value="actions" className="flex-1">Actions</TabsTrigger>
              <TabsTrigger value="delegates" className="flex-1">Pays</TabsTrigger>
            </TabsList>
            
            <TabsContent value="actions" className="space-y-6 mt-4">
              <Card>
                <CardHeader className="pb-4"><CardTitle className="text-lg">Nouvelle Action</CardTitle></CardHeader>
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
                      <Label className="text-[10px] uppercase">Temps de parole</Label>
                      <Input value={newAction.timePerDelegate} onChange={e => setNewAction({...newAction, timePerDelegate: e.target.value})} placeholder="1:00" />
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 p-2 border rounded-lg bg-muted/30">
                    <Checkbox 
                      id="participation" 
                      checked={newAction.allowParticipation} 
                      onCheckedChange={(checked) => setNewAction({...newAction, allowParticipation: !!checked})} 
                    />
                    <Label htmlFor="participation" className="text-sm cursor-pointer">Autoriser participation facultative</Label>
                  </div>
                  <Button className="w-full bg-primary" onClick={createAction}>Lancer l'Action</Button>
                </CardContent>
              </Card>

              {currentAction && currentAction.status !== 'completed' && (
                <Card className="border-primary/20 shadow-lg">
                  <CardHeader className="bg-primary/5 pb-2">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <Badge className="mb-1">{currentAction.status.toUpperCase()}</Badge>
                        <CardTitle className="text-xl">{currentAction.title}</CardTitle>
                      </div>
                      <div className="flex items-center gap-1 bg-white/50 p-1 rounded-lg border">
                        <Input 
                          type="number" 
                          className="w-12 h-8 p-1 text-center" 
                          value={customMinutes} 
                          onChange={(e) => setCustomMinutes(e.target.value)}
                        />
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-primary" onClick={() => extendTime(parseInt(customMinutes))}>
                          <Plus size={16} />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
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
                        <Button variant="outline" className="border-amber-500 text-amber-600 h-12 gap-2" onClick={pauseTimer}>
                          <Pause size={18} fill="currentColor" /> Pause
                        </Button>
                      )}
                      <Button variant="destructive" className="h-12 gap-2" onClick={stopAction}>
                        <Square size={18} fill="currentColor" /> Arrêter
                      </Button>
                    </div>

                    <div className="pt-4 border-t space-y-4">
                      <div className="flex justify-between items-center">
                        <h3 className="font-bold text-[10px] text-muted-foreground uppercase flex items-center gap-2">
                          <Timer size={14} /> Chrono Orateur (À rebours)
                        </h3>
                        <Badge variant="outline" className="text-[10px]">{currentAction.time_per_delegate}</Badge>
                      </div>
                      
                      <div className="flex justify-center py-2">
                        <SpeakingTimer 
                          status={currentAction.speaking_timer_status}
                          startedAt={currentAction.speaking_timer_started_at}
                          totalElapsedSeconds={currentAction.speaking_timer_total_elapsed || 0}
                          limitSeconds={parseTimePerDelegate(currentAction.time_per_delegate)}
                          size="md"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <Button 
                          variant="secondary" 
                          size="sm" 
                          onClick={startSpeakingTimer}
                          disabled={currentAction.speaking_timer_status === 'started'}
                        >
                          Lancer
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="border"
                          onClick={resetSpeakingTimer}
                        >
                          Reset
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-3 pt-4 border-t">
                      <h3 className="font-bold text-sm text-muted-foreground uppercase flex items-center justify-between">
                        <span className="flex items-center gap-2"><ListOrdered size={14} /> Liste des Orateurs</span>
                        <Badge variant="secondary">{orateursInscrits.length}</Badge>
                      </h3>
                      <ScrollArea className="h-[180px] border rounded-xl p-3 bg-muted/10">
                        {orateursInscrits.length > 0 ? orateursInscrits.map((p, i) => (
                          <div key={i} className="flex justify-between items-center p-3 mb-2 bg-white border rounded-lg shadow-sm">
                            <span className="font-bold text-sm">{i + 1}. {p.country_name}</span>
                            <Badge className="bg-green-500">Prêt</Badge>
                          </div>
                        )) : (
                          <div className="text-center py-10 text-muted-foreground text-xs italic">Aucun orateur</div>
                        )}
                      </ScrollArea>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="delegates" className="space-y-6 mt-4">
              <Card>
                <CardHeader><CardTitle className="text-lg">Délégués ({delegates.length})</CardTitle></CardHeader>
                <CardContent>
                  <ScrollArea className="h-[400px]">
                    {delegates.map(d => (
                      <div key={d.id} className="flex justify-between items-center p-3 bg-muted/50 mb-2 rounded-lg">
                        <span className="font-semibold">{d.country_name}</span>
                        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteDocumentNonBlocking(doc(db!, 'delegates', d.id))}><Trash2 size={16} /></Button>
                      </div>
                    ))}
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Colonne Droite */}
        <div className="lg:col-span-8 space-y-6">
          <Tabs defaultValue="resolutions">
            <TabsList className="w-full">
              <TabsTrigger value="resolutions" className="flex-1">Projets de Résolution</TabsTrigger>
              <TabsTrigger value="messages" className="flex-1 relative">
                Messages Privés
                {unreadMessagesCount > 0 && (
                  <Badge variant="destructive" className="ml-2 h-5 w-5 p-0 flex items-center justify-center rounded-full">
                    {unreadMessagesCount}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="resolutions" className="space-y-6 mt-4">
              <Card>
                <CardHeader className="bg-muted/30 flex flex-row items-center justify-between">
                  <CardTitle className="flex items-center gap-2"><FileText /> Resolutions Soumises</CardTitle>
                  <Badge variant="outline">{resolutions.length}</Badge>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  {resolutions.map(res => (
                    <Card key={res.id} className={`overflow-hidden border-2 ${res.is_displayed ? 'border-primary' : ''}`}>
                      <div className="bg-muted/50 p-4 flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-primary">{res.proposing_country}</span>
                          {res.is_displayed && <Badge className="bg-primary"><Monitor className="h-3 w-3 mr-1" /> PROJETÉ</Badge>}
                        </div>
                        <Badge variant={res.status === 'approved' ? 'default' : res.status === 'rejected' ? 'destructive' : 'secondary'}>
                          {res.status?.toUpperCase()}
                        </Badge>
                      </div>
                      <CardContent className="p-4 space-y-4">
                        <div 
                          className="text-sm italic leading-relaxed whitespace-pre-wrap prose prose-sm max-w-none"
                          dangerouslySetInnerHTML={{ __html: res.content }}
                        />
                        <div className="flex gap-2 justify-end pt-2 border-t">
                          <Button 
                            variant={res.is_displayed ? "default" : "outline"} 
                            size="sm" 
                            className="gap-2"
                            onClick={() => updateDocumentNonBlocking(doc(db!, 'resolutions', res.id), { is_displayed: !res.is_displayed })}
                          >
                            {res.is_displayed ? <><EyeOff size={16} /> Masquer</> : <><Eye size={16} /> Afficher</>}
                          </Button>
                          <Button variant="outline" size="sm" className="text-green-600 gap-1" onClick={() => updateDocumentNonBlocking(doc(db!, 'resolutions', res.id), { status: 'approved' })}>
                            <CheckCircle size={16} /> Approuver
                          </Button>
                          <Button variant="outline" size="sm" className="text-red-600 gap-1" onClick={() => updateDocumentNonBlocking(doc(db!, 'resolutions', res.id), { status: 'rejected' })}>
                            <XCircle size={16} /> Rejeter
                          </Button>
                          <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10" onClick={() => deleteDocumentNonBlocking(doc(db!, 'resolutions', res.id))}>
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {resolutions.length === 0 && (
                    <div className="text-center py-20 text-muted-foreground italic">Aucune résolution soumise</div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="messages" className="space-y-6 mt-4">
              <Card>
                <CardHeader className="bg-muted/30">
                  <CardTitle className="flex items-center gap-2"><Bell size={18} /> Boîte de réception Privée</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <ScrollArea className="h-[600px]">
                    <div className="p-6 space-y-4">
                      {messages.map(msg => (
                        <div 
                          key={msg.id} 
                          className={`p-4 border-l-4 rounded-r-xl shadow-sm flex flex-col gap-3 ${
                            msg.is_read ? 'bg-muted/10 border-muted-foreground/30' : 'bg-secondary/5 border-secondary'
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex items-center gap-2">
                              <Badge variant={msg.type === 'privilege' ? 'destructive' : 'secondary'} className="uppercase text-[10px]">
                                {msg.type === 'privilege' ? 'Point de privilège' : 'Message général'}
                              </Badge>
                              <span className="font-bold text-sm">{msg.sender_country}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              {!msg.is_read && (
                                <Button size="icon" variant="ghost" className="h-8 w-8 text-green-600" onClick={() => markMessageAsRead(msg.id)}>
                                  <Check size={16} />
                                </Button>
                              )}
                              <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => deleteMessage(msg.id)}>
                                <Trash2 size={16} />
                              </Button>
                            </div>
                          </div>
                          <p className="text-sm font-medium leading-relaxed italic whitespace-pre-wrap">"{msg.content}"</p>
                          <span className="text-[10px] text-muted-foreground self-end">
                            {msg.timestamp?.toDate ? new Date(msg.timestamp.toDate()).toLocaleTimeString() : "À l'instant"}
                          </span>
                        </div>
                      ))}
                      {messages.length === 0 && (
                        <div className="text-center py-20 text-muted-foreground italic">Aucun message</div>
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
