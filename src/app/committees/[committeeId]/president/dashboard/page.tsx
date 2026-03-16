
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
import { useFirebase, useRealtime } from '@/firebase';
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

  if (isUserLoading) return <div className="min-h-screen flex items-center justify-center font-bold">Authentification...</div>;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="bg-primary text-white p-4 shadow-md flex justify-between items-center z-50">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold uppercase tracking-widest">Bureau de Présidence</h1>
          {isSuspended && <Badge variant="destructive" className="animate-pulse">SESSION SUSPENDUE</Badge>}
          {activeOverlay?.type === 'crisis' && <Badge variant="destructive" className="bg-red-600 animate-bounce uppercase">CRISE ACTIVE</Badge>}
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
          {activeOverlay?.type !== 'none' && <Button variant="ghost" size="icon" onClick={stopOverlay} className="text-white hover:bg-white/20"><X size={18} /></Button>}
          <Switch checked={allowResolutions} onCheckedChange={toggleResolutions} />
          <Button variant="destructive" onClick={toggleSuspension}>{isSuspended ? "Reprendre" : "Suspendre"}</Button>
          <Button variant="ghost" className="text-white hover:bg-white/10" onClick={handleLogout}><LogOut size={20} /></Button>
        </div>
      </header>

      <main className="flex-1 p-6 grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-[1600px] mx-auto w-full">
        <div className="lg:col-span-4 space-y-6">
          <Tabs defaultValue="actions">
            <TabsList className="w-full"><TabsTrigger value="actions" className="flex-1">Actions</TabsTrigger><TabsTrigger value="delegates" className="flex-1">Pays</TabsTrigger></TabsList>
            <TabsContent value="actions" className="space-y-6">
              <Card><CardHeader><CardTitle className="text-lg">Nouvelle Action</CardTitle></CardHeader><CardContent className="space-y-4"><Input value={newAction.title} onChange={e => setNewAction({...newAction, title: e.target.value})} placeholder="Titre" /><Button className="w-full" onClick={createAction}>Lancer</Button></CardContent></Card>
              {currentAction && currentAction.status !== 'completed' && (
                <Card className="border-primary/20"><CardHeader><CardTitle className="text-xl">{currentAction.title}</CardTitle></CardHeader><CardContent className="space-y-6">
                  <GlobalTimer status={currentAction.status} startedAt={currentAction.started_at} pausedAt={currentAction.paused_at} totalElapsedSeconds={currentAction.total_elapsed_seconds} durationMinutes={currentAction.duration_minutes} />
                  <div className="grid grid-cols-2 gap-3">
                    <Button className="bg-green-600" onClick={startTimer} disabled={currentAction.status === 'started'}>Démarrer</Button>
                    <Button variant="outline" onClick={pauseTimer} disabled={currentAction.status !== 'started'}>Pause</Button>
                  </div>
                  <Button variant="destructive" className="w-full" onClick={() => updateDocumentNonBlocking(doc(db!, 'committees', committeeId, 'actions', currentAction.id), { status: 'completed' })}>Terminer</Button>
                </CardContent></Card>
              )}
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
                    <CardHeader className="flex flex-row items-center justify-between"><CardTitle className="text-sm font-bold">{res.title}</CardTitle><Badge>{res.status}</Badge></CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex gap-2"><Badge variant="outline">DE: {res.proposing_country}</Badge><Badge variant="outline">Porte-parole: {res.spokesperson}</Badge></div>
                      <div className="text-sm prose" dangerouslySetInnerHTML={{ __html: res.content }} />
                      <div className="flex gap-2 justify-end pt-4 border-t">
                        <Button size="sm" onClick={() => updateDocumentNonBlocking(doc(db!, 'committees', committeeId, 'resolutions', res.id), { is_displayed: !res.is_displayed })}>{res.is_displayed ? 'Masquer' : 'Afficher'}</Button>
                        <Button size="sm" className="text-green-600" variant="outline" onClick={() => updateDocumentNonBlocking(doc(db!, 'committees', committeeId, 'resolutions', res.id), { status: 'approved' })}>Approuver</Button>
                        <Button size="sm" className="text-red-600" variant="outline" onClick={() => updateDocumentNonBlocking(doc(db!, 'committees', committeeId, 'resolutions', res.id), { status: 'rejected' })}>Rejeter</Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
