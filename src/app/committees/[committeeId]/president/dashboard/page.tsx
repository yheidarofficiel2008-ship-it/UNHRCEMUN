
"use client"

import { useState, useEffect, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Play, Pause, Square, LogOut, FileText, Eye, EyeOff, CheckCircle, XCircle, ListOrdered, Clock, Timer, MessageSquareOff, MessageSquare, Plus, Trash2, Bell, Check, Stars, X, ThumbsUp, ThumbsDown, CircleSlash, BarChart3, UserPlus, History, ShieldOff, ShieldAlert, User, Monitor, Users, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useFirebase } from '@/firebase';
import { useRealtime } from '@/hooks/use-realtime';
import { setDocumentNonBlocking, addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { collection, doc, onSnapshot, query, orderBy, serverTimestamp, increment } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { GlobalTimer } from '@/components/GlobalTimer';
import { SpeakingTimer } from '@/components/SpeakingTimer';
import { useToast } from '@/hooks/use-toast';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip as RechartsTooltip, Cell } from 'recharts';

export default function PresidentDashboard() {
  const router = useRouter();
  const params = useParams();
  const committeeId = params.committeeId as string;
  const { toast } = useToast();
  const { firestore: db, auth, user, isUserLoading } = useFirebase();
  const { isSuspended, allowResolutions, currentAction, activeOverlay } = useRealtime(committeeId);
  
  const [customMinutes, setCustomMinutes] = useState('1');
  const [newAction, setNewAction] = useState({ title: '', duration: 15, timePerDelegate: '1:00', description: '', allowParticipation: true });
  const [newDelegate, setNewDelegate] = useState({ name: '', password: '' });
  const [overlayForm, setOverlayForm] = useState({ type: 'message', title: '' });
  const [isOverlayDialogOpen, setIsOverlayDialogOpen] = useState(false);

  const [delegates, setDelegates] = useState<any[]>([]);
  const [resolutions, setResolutions] = useState<any[]>([]);
  const [participants, setParticipants] = useState<any[]>([]);
  const [allParticipations, setAllParticipations] = useState<any[]>([]);
  const [allActions, setAllActions] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);

  useEffect(() => {
    if (!isUserLoading && !user) router.push(`/committees/${committeeId}/president/login`);
  }, [user, isUserLoading, router, committeeId]);

  useEffect(() => {
    if (!db || !user) return;
    const delRef = collection(db, 'committees', committeeId, 'delegates');
    const unsubDel = onSnapshot(query(delRef, orderBy('country_name', 'asc')), (snap) => setDelegates(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    const resRef = collection(db, 'committees', committeeId, 'resolutions');
    const unsubRes = onSnapshot(query(resRef, orderBy('created_at', 'desc')), (snap) => setResolutions(snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))));
    const msgRef = collection(db, 'committees', committeeId, 'messages');
    const unsubMsg = onSnapshot(query(msgRef, orderBy('timestamp', 'desc')), (snap) => setMessages(snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))));
    const partRef = collection(db, 'committees', committeeId, 'participations');
    const unsubPartAll = onSnapshot(partRef, (snap) => setAllParticipations(snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))));
    const actRef = collection(db, 'committees', committeeId, 'actions');
    const unsubActAll = onSnapshot(query(actRef, orderBy('created_at', 'desc')), (snap) => setAllActions(snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))));
    return () => { unsubDel(); unsubRes(); unsubMsg(); unsubPartAll(); unsubActAll(); };
  }, [db, user, committeeId]);

  useEffect(() => {
    if (!db || !currentAction?.id) { setParticipants([]); return; }
    const partRef = collection(db, 'committees', committeeId, 'participations');
    const unsubPart = onSnapshot(query(partRef, orderBy('updated_at', 'asc')), (snap) => {
      setParticipants(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })).filter((p: any) => p.action_id === currentAction.id));
    });
    return () => unsubPart();
  }, [db, currentAction?.id, committeeId]);

  const statsData = useMemo(() => {
    const counts: Record<string, number> = {};
    delegates.forEach(d => { counts[d.country_name] = 0; });
    allParticipations.forEach(p => { if (p.status === 'participating' && counts[p.country_name] !== undefined) counts[p.country_name]++; });
    return Object.entries(counts).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
  }, [allParticipations, delegates]);

  const launchOverlay = () => {
    if (!db) return;
    const sessionRef = doc(db, 'committees', committeeId, 'sessionState', 'current');
    setDocumentNonBlocking(sessionRef, { activeOverlay: { ...overlayForm, status: 'active', voteId: Date.now().toString(), results: { pour: 0, contre: 0, abstention: 0 } } }, { merge: true });
    setIsOverlayDialogOpen(false);
  };

  const stopOverlay = () => {
    if (!db) return;
    const sessionRef = doc(db, 'committees', committeeId, 'sessionState', 'current');
    setDocumentNonBlocking(sessionRef, { activeOverlay: { type: 'none' } }, { merge: true });
  };

  const createAction = async () => {
    if (!db || !newAction.title) return;
    await addDocumentNonBlocking(collection(db, 'committees', committeeId, 'actions'), { ...newAction, duration_minutes: Number(newAction.duration), status: 'launched', total_elapsed_seconds: 0, created_at: serverTimestamp() });
    setNewAction({ title: '', duration: 15, timePerDelegate: '1:00', description: '', allowParticipation: true });
  };

  const toggleResolutions = (val: boolean) => {
    if (!db) return;
    setDocumentNonBlocking(doc(db, 'committees', committeeId, 'sessionState', 'current'), { allowResolutions: val }, { merge: true });
  };

  const toggleSuspension = () => {
    if (!db) return;
    setDocumentNonBlocking(doc(db, 'committees', committeeId, 'sessionState', 'current'), { isSuspended: !isSuspended }, { merge: true });
  };

  const startTimer = () => {
    if (!db || !currentAction) return;
    updateDocumentNonBlocking(doc(db, 'committees', committeeId, 'actions', currentAction.id), { status: 'started', started_at: new Date().toISOString() });
  };

  const pauseTimer = () => {
    if (!db || !currentAction || !currentAction.started_at) return;
    const elapsed = (currentAction.total_elapsed_seconds || 0) + Math.floor((new Date().getTime() - new Date(currentAction.started_at).getTime()) / 1000);
    updateDocumentNonBlocking(doc(db, 'committees', committeeId, 'actions', currentAction.id), { status: 'paused', total_elapsed_seconds: elapsed, started_at: null });
  };

  const handleLogout = async () => { if (auth) { await signOut(auth); router.push('/'); } };

  const parseTimePerDelegate = (timeStr: string) => {
    if (!timeStr) return 60;
    const [mins, secs] = timeStr.split(':').map(Number);
    return (mins * 60) + (secs || 0);
  };

  if (isUserLoading) return <div className="min-h-screen flex items-center justify-center font-bold">Authentification...</div>;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="bg-primary text-white p-4 shadow-md flex justify-between items-center z-50">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold uppercase tracking-widest">Bureau de Présidence</h1>
          {isSuspended && <Badge variant="destructive" className="animate-pulse">SESSION SUSPENDUE</Badge>}
          {activeOverlay && activeOverlay.type === 'crisis' && <Badge variant="destructive" className="bg-red-600 animate-bounce uppercase">CRISE ACTIVE</Badge>}
        </div>
        <div className="flex items-center gap-4">
          <Dialog open={isOverlayDialogOpen} onOpenChange={setIsOverlayDialogOpen}>
            <DialogTrigger asChild><Button className="bg-amber-500 hover:bg-amber-600 font-bold"><Stars size={18} className="mr-2" /> Action Spéciale</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Annonce, Vote ou Crise</DialogTitle></DialogHeader>
              <div className="space-y-4 py-4">
                <Select value={overlayForm.type} onValueChange={(val) => setOverlayForm({...overlayForm, type: val})}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="message">Message</SelectItem><SelectItem value="vote">Vote</SelectItem><SelectItem value="crisis" className="text-red-600 font-bold">CRISE</SelectItem></SelectContent></Select>
                <Input placeholder="Titre / Sujet" value={overlayForm.title} onChange={(e) => setOverlayForm({...overlayForm, title: e.target.value})} />
              </div>
              <DialogFooter><Button onClick={launchOverlay} className="w-full">Lancer l'Action</Button></DialogFooter>
            </DialogContent>
          </Dialog>
          {activeOverlay && activeOverlay.type !== 'none' && (
            <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-full border border-white/20">
              <span className="text-xs font-bold uppercase">{activeOverlay.title}</span>
              <Button variant="ghost" size="icon" onClick={stopOverlay} className="h-6 w-6 text-white hover:bg-white/20"><X size={14} /></Button>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Label className="text-[10px] font-bold uppercase">Résolutions</Label>
            <Switch checked={allowResolutions} onCheckedChange={toggleResolutions} />
          </div>
          <Button variant="destructive" onClick={toggleSuspension}>{isSuspended ? "Reprendre" : "Suspendre"}</Button>
          <Button variant="ghost" className="text-white hover:bg-white/10" onClick={handleLogout}><LogOut size={20} /></Button>
        </div>
      </header>

      <main className="flex-1 p-6 grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-[1600px] mx-auto w-full">
        <div className="lg:col-span-4 space-y-6">
          <Tabs defaultValue="actions">
            <TabsList className="w-full"><TabsTrigger value="actions" className="flex-1">Actions</TabsTrigger><TabsTrigger value="delegates" className="flex-1">Pays</TabsTrigger></TabsList>
            <TabsContent value="actions" className="space-y-6">
              <Card><CardHeader className="pb-4"><CardTitle className="text-lg">Nouvelle Action</CardTitle></CardHeader><CardContent className="space-y-4"><Input value={newAction.title} onChange={e => setNewAction({...newAction, title: e.target.value})} placeholder="Titre" /><Button className="w-full" onClick={createAction}>Lancer</Button></CardContent></Card>
              {currentAction && currentAction.status !== 'completed' && (
                <Card className="border-primary/20"><CardHeader><CardTitle className="text-xl">{currentAction.title}</CardTitle></CardHeader><CardContent className="space-y-6">
                  <GlobalTimer status={currentAction.status} startedAt={currentAction.started_at} pausedAt={currentAction.paused_at} totalElapsedSeconds={currentAction.total_elapsed_seconds} durationMinutes={currentAction.duration_minutes} />
                  <div className="grid grid-cols-2 gap-3">
                    <Button className="bg-green-600" onClick={startTimer} disabled={currentAction.status === 'started'}>Démarrer</Button>
                    <Button variant="outline" onClick={pauseTimer} disabled={currentAction.status !== 'started'}>Pause</Button>
                  </div>
                  <div className="pt-4 border-t space-y-4">
                    <div className="flex justify-between items-center"><Label className="text-[10px] uppercase">Chrono Orateur</Label><Badge variant="outline">{currentAction.time_per_delegate}</Badge></div>
                    <div className="flex justify-center"><SpeakingTimer status={currentAction.speaking_timer_status || 'stopped'} startedAt={currentAction.speaking_timer_started_at} totalElapsedSeconds={currentAction.speaking_timer_total_elapsed || 0} limitSeconds={parseTimePerDelegate(currentAction.time_per_delegate)} /></div>
                    <div className="grid grid-cols-2 gap-2">
                      <Button variant="secondary" size="sm" onClick={() => updateDocumentNonBlocking(doc(db!, 'committees', committeeId, 'actions', currentAction.id), { speaking_timer_status: 'started', speaking_timer_started_at: new Date().toISOString() })}>Lancer</Button>
                      <Button variant="ghost" size="sm" className="border" onClick={() => updateDocumentNonBlocking(doc(db!, 'committees', committeeId, 'actions', currentAction.id), { speaking_timer_status: 'stopped', speaking_timer_started_at: null, speaking_timer_total_elapsed: 0 })}>Reset</Button>
                    </div>
                  </div>
                  <Button variant="destructive" className="w-full" onClick={() => updateDocumentNonBlocking(doc(db!, 'committees', committeeId, 'actions', currentAction.id), { status: 'completed' })}>Terminer</Button>
                </CardContent></Card>
              )}
            </TabsContent>
            <TabsContent value="delegates" className="space-y-4">
               <Card><CardHeader><CardTitle className="text-lg">Ajouter un Pays</CardTitle></CardHeader>
               <CardContent className="space-y-3">
                 <Input value={newDelegate.name} onChange={e => setNewDelegate({...newDelegate, name: e.target.value})} placeholder="Nom du Pays" />
                 <Input value={newDelegate.password} onChange={e => setNewDelegate({...newDelegate, password: e.target.value})} placeholder="Mot de passe" />
                 <Button className="w-full bg-secondary" onClick={() => {
                   if (!newDelegate.name || !newDelegate.password) return;
                   addDocumentNonBlocking(collection(db!, 'committees', committeeId, 'delegates'), { country_name: newDelegate.name, password: newDelegate.password, is_suspended: false, created_at: serverTimestamp() });
                   setNewDelegate({ name: '', password: '' });
                 }}>Ajouter</Button>
               </CardContent></Card>
               <ScrollArea className="h-[400px]">
                 <div className="space-y-2">
                   {delegates.map(d => (
                     <div key={d.id} className="flex justify-between items-center p-3 bg-muted/50 rounded-lg border">
                       <span className="font-bold text-sm">{d.country_name}</span>
                       <div className="flex gap-1">
                         <Button variant="ghost" size="icon" className={d.is_suspended ? 'text-green-600' : 'text-amber-600'} onClick={() => updateDocumentNonBlocking(doc(db!, 'committees', committeeId, 'delegates', d.id), { is_suspended: !d.is_suspended })}>
                           {d.is_suspended ? <ShieldOff size={16} /> : <ShieldAlert size={16} />}
                         </Button>
                         <Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteDocumentNonBlocking(doc(db!, 'committees', committeeId, 'delegates', d.id))}><Trash2 size={16} /></Button>
                       </div>
                     </div>
                   ))}
                 </div>
               </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>
        <div className="lg:col-span-8">
          <Tabs defaultValue="resolutions">
            <TabsList className="w-full"><TabsTrigger value="resolutions" className="flex-1">Résolutions</TabsTrigger><TabsTrigger value="messages" className="flex-1">Messages</TabsTrigger></TabsList>
            <TabsContent value="resolutions" className="mt-4">
              <div className="space-y-4">
                {resolutions.map(res => (
                  <Card key={res.id} className={res.is_displayed ? 'border-primary border-2' : ''}>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-black uppercase">{res.title || 'SANS TITRE'}</CardTitle>
                      <Badge variant={res.status === 'approved' ? 'default' : res.status === 'rejected' ? 'destructive' : 'secondary'}>{res.status.toUpperCase()}</Badge>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex flex-wrap gap-2 items-center">
                        <Badge variant="outline" className="bg-primary/10 border-primary/30 text-primary py-1 px-2 text-[10px] font-bold uppercase">DE: {res.proposing_country}</Badge>
                        {res.spokesperson && <Badge variant="outline" className="bg-secondary/10 border-secondary/30 text-secondary py-1 px-2 text-[10px] font-bold uppercase gap-1"><User size={10} /> Porte-parole: {res.spokesperson}</Badge>}
                        {res.sponsors && <Badge variant="outline" className="bg-muted border-muted-foreground/30 text-muted-foreground py-1 px-2 text-[10px] font-bold uppercase gap-1"><Users size={10} /> Sponsors: {res.sponsors}</Badge>}
                      </div>
                      <div className="text-sm prose max-w-none prose-sm" dangerouslySetInnerHTML={{ __html: res.content }} />
                      <div className="flex gap-2 justify-end pt-4 border-t">
                        <Button size="sm" variant={res.is_displayed ? 'default' : 'outline'} onClick={() => updateDocumentNonBlocking(doc(db!, 'committees', committeeId, 'resolutions', res.id), { is_displayed: !res.is_displayed })}>{res.is_displayed ? 'Masquer' : 'Afficher'}</Button>
                        <Button size="sm" className="text-green-600" variant="outline" onClick={() => updateDocumentNonBlocking(doc(db!, 'committees', committeeId, 'resolutions', res.id), { status: 'approved' })}>Approuver</Button>
                        <Button size="sm" className="text-red-600" variant="outline" onClick={() => updateDocumentNonBlocking(doc(db!, 'committees', committeeId, 'resolutions', res.id), { status: 'rejected' })}>Rejeter</Button>
                        <Button size="sm" variant="ghost" className="text-destructive" onClick={() => deleteDocumentNonBlocking(doc(db!, 'committees', committeeId, 'resolutions', res.id))}><Trash2 size={16} /></Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
            <TabsContent value="messages" className="mt-4">
               <ScrollArea className="h-[600px]">
                 <div className="space-y-4">
                   {messages.map(msg => (
                     <div key={msg.id} className={`p-4 border-l-4 rounded-r-xl shadow-sm flex flex-col gap-3 ${msg.is_read ? 'bg-muted/10 border-muted-foreground/30' : 'bg-secondary/5 border-secondary'}`}>
                       <div className="flex justify-between items-start">
                         <div className="flex items-center gap-2">
                           <Badge variant={msg.type === 'privilege' ? 'destructive' : 'secondary'} className="uppercase text-[10px]">{msg.type === 'privilege' ? 'Privilège' : 'Général'}</Badge>
                           <span className="font-bold text-sm">{msg.sender_country}</span>
                         </div>
                         <div className="flex gap-1">
                           {!msg.is_read && <Button size="icon" variant="ghost" className="h-8 w-8 text-green-600" onClick={() => updateDocumentNonBlocking(doc(db!, 'committees', committeeId, 'messages', msg.id), { is_read: true })}><Check size={16} /></Button>}
                           <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => deleteDocumentNonBlocking(doc(db!, 'committees', committeeId, 'messages', msg.id))}><Trash2 size={16} /></Button>
                         </div>
                       </div>
                       <p className="text-sm font-medium">{msg.content}</p>
                     </div>
                   ))}
                 </div>
               </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
