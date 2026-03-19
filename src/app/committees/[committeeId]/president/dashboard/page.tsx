
"use client"

import { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Play, Pause, Square, LogOut, FileText, Eye, EyeOff, CheckCircle, XCircle, ListOrdered, Clock, Timer, MessageSquareOff, MessageSquare, Plus, Trash2, Bell, Check, Stars, X, ThumbsUp, ThumbsDown, CircleSlash, BarChart3, UserPlus, History, ShieldOff, ShieldAlert, User, Monitor, Users, AlertTriangle, Languages, Award, Calculator, Ghost, ChevronDown, ChevronUp } from 'lucide-react';
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
import { useFirebase, useDoc } from '@/firebase';
import { useMemoFirebase } from '@/firebase';
import { useRealtime } from '@/hooks/use-realtime';
import { setDocumentNonBlocking, addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { collection, doc, onSnapshot, query, orderBy, serverTimestamp, increment, where } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { GlobalTimer } from '@/components/GlobalTimer';
import { SpeakingTimer } from '@/components/SpeakingTimer';
import { useToast } from '@/hooks/use-toast';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip as RechartsTooltip, Cell } from 'recharts';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

export default function PresidentDashboard() {
  const router = useRouter();
  const params = useParams();
  const committeeId = params.committeeId as string;
  const { toast } = useToast();
  const { firestore: db, auth, user, isUserLoading } = useFirebase();
  const { isSuspended, allowResolutions, allowGossip, currentAction, activeOverlay } = useRealtime(committeeId);
  
  const committeeRef = useMemoFirebase(() => db ? doc(db, 'committees', committeeId) : null, [db, committeeId]);
  const { data: committee } = useDoc(committeeRef);

  const lang = committee?.language || 'fr';
  const t = {
    fr: {
      presidency: "Bureau de la Présidence",
      specialAction: "Action Spéciale",
      crisisMode: "MODE CRISE ACTIF",
      voteLaunched: "Vote lancé",
      crisisTriggered: "CRISE DÉCLENCHÉE",
      messageDisplayed: "Message affiché",
      resolutionsAllowed: "Résolutions autorisées",
      resolutionsBlocked: "Résolutions bloquées",
      gossipAllowed: "Gossip Box activée",
      gossipBlocked: "Gossip Box suspendue",
      resume: "Rétablir la Séance",
      suspend: "Suspendre la Séance",
      newAction: "Nouvelle Procédure",
      title: "Intitulé",
      duration: "Durée (minutes)",
      speakingTime: "Temps de parole",
      launchAction: "Initier l'Action",
      start: "Démarrer",
      pause: "Pause",
      stop: "Terminer",
      speakerChrono: "Minuteur Orateur",
      speakersList: "Ordre du Jour / Orateurs",
      noSpeaker: "Aucun orateur inscrit",
      addCountry: "Ajouter une Délégation",
      countryName: "Nom du Pays",
      password: "Code d'accès",
      addToList: "Enregistrer la Délégation",
      registeredDelegates: "Délégations Membres",
      actionsHistory: "Journal des Procédures",
      resolutionsSubmitted: "Projets de Résolution",
      privateInbox: "Communications Privées",
      gossipBoxTitle: "Gossip Box (Anonyme)",
      approve: "Valider",
      reject: "Rejeter",
      hide: "Masquer",
      show: "Projeter",
      specialTitle: "Configuration de l'Alerte",
      overlayType: "Mode de Diffusion",
      overlaySubject: "Sujet / Titre",
      crisisSubject: "Nature de la Crise",
      launchEverywhere: "Diffuser sur tous les écrans",
      launchCrisis: "DÉCLENCHER LA CRISE",
      actions: "Session",
      countries: "Membres",
      stats: "Notation & Stats",
      resolutionsTab: "Résolutions",
      messagesTab: "Messages",
      gossipTab: "Gossip",
      gradingTitle: "Barème d'Évaluation",
      speaking: "Élocution",
      diplomacy: "Diplomatie",
      knowledge: "Expertise",
      average: "Moyenne Générale",
      rank: "Rang",
      saveGrade: "Évaluation enregistrée",
      calculate: "Générer le Classement",
      markAsSpoken: "A terminé son allocution",
      actionDeleted: "Procédure et données associées supprimées"
    },
    en: {
      presidency: "Presidency Office",
      specialAction: "Special Action",
      crisisMode: "CRISIS MODE ACTIVE",
      voteLaunched: "Vote launched",
      crisisTriggered: "CRISIS TRIGGERED",
      messageDisplayed: "Message displayed",
      resolutionsAllowed: "Resolutions allowed",
      resolutionsBlocked: "Resolutions blocked",
      gossipAllowed: "Gossip Box enabled",
      gossipBlocked: "Gossip Box suspended",
      resume: "Resume Session",
      suspend: "Suspend Session",
      newAction: "New Procedure",
      title: "Title",
      duration: "Duration (min)",
      speakingTime: "Speaking time",
      launchAction: "Initiate Action",
      start: "Start",
      pause: "Pause",
      stop: "Finish",
      speakerChrono: "Speaker Timer",
      speakersList: "Order of the Day / Speakers",
      noSpeaker: "No speakers listed",
      addCountry: "Add Delegation",
      countryName: "Country Name",
      password: "Access Code",
      addToList: "Register Delegation",
      registeredDelegates: "Member Delegations",
      actionsHistory: "Procedure Log",
      resolutionsSubmitted: "Draft Resolutions",
      privateInbox: "Private Communications",
      gossipBoxTitle: "Gossip Box (Anonymous)",
      approve: "Approve",
      reject: "Reject",
      hide: "Hide",
      show: "Project",
      specialTitle: "Alert Configuration",
      overlayType: "Broadcast Mode",
      overlaySubject: "Subject / Title",
      crisisSubject: "Crisis Nature",
      launchEverywhere: "Broadcast to all screens",
      launchCrisis: "TRIGGER CRISIS",
      actions: "Session",
      countries: "Members",
      stats: "Grading & Stats",
      resolutionsTab: "Resolutions",
      messagesTab: "Messages",
      gossipTab: "Gossip",
      gradingTitle: "Evaluation Rubric",
      speaking: "Elocution",
      diplomacy: "Diplomatie",
      knowledge: "Expertise",
      average: "General Average",
      rank: "Rank",
      saveGrade: "Grade saved",
      calculate: "Generate Ranking",
      markAsSpoken: "Has finished speaking",
      actionDeleted: "Procedure and associated data deleted"
    }
  }[lang];

  const [customMinutes, setCustomMinutes] = useState('1');
  const [newAction, setNewAction] = useState({ title: '', duration: 15, timePerDelegate: '1:00', allowParticipation: true });
  const [newDelegate, setNewDelegate] = useState({ name: '', password: '' });
  const [overlayForm, setOverlayForm] = useState({ type: 'message', title: '' });
  const [isOverlayDialogOpen, setIsOverlayDialogOpen] = useState(false);
  const [isFluxMenuOpen, setIsFluxMenuOpen] = useState(false);

  const [delegates, setDelegates] = useState<any[]>([]);
  const [resolutions, setResolutions] = useState<any[]>([]);
  const [participants, setParticipants] = useState<any[]>([]);
  const [allParticipations, setAllParticipations] = useState<any[]>([]);
  const [allActions, setAllActions] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [displayGradedDelegates, setDisplayGradedDelegates] = useState<any[]>([]);

  useEffect(() => {
    if (!isUserLoading && !user) router.push(`/committees/${committeeId}/president/login`);
  }, [user, isUserLoading, router, committeeId]);

  useEffect(() => {
    if (!db || !user) return;

    const unsubDel = onSnapshot(query(collection(db, 'committees', committeeId, 'delegates'), orderBy('country_name', 'asc')), (snap) => {
      setDelegates(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    const unsubRes = onSnapshot(query(collection(db, 'committees', committeeId, 'resolutions'), orderBy('created_at', 'desc')), (snapshot) => {
      setResolutions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const unsubMessages = onSnapshot(query(collection(db, 'committees', committeeId, 'messages'), orderBy('timestamp', 'desc')), (snapshot) => {
      setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const unsubPartAll = onSnapshot(collection(db, 'committees', committeeId, 'participations'), (snapshot) => {
      setAllParticipations(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const unsubActionsAll = onSnapshot(query(collection(db, 'committees', committeeId, 'actions'), orderBy('created_at', 'desc')), (snapshot) => {
      setAllActions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => { unsubDel(); unsubRes(); unsubMessages(); unsubPartAll(); unsubActionsAll(); };
  }, [db, user, committeeId]);

  useEffect(() => {
    if (!db || !currentAction?.id) { setParticipants([]); return; }
    const unsubPart = onSnapshot(query(collection(db, 'committees', committeeId, 'participations'), where('action_id', '==', currentAction.id)), (snapshot) => {
      const parts = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() as any }))
        .filter(p => p.status === 'participating')
        .sort((a, b) => (a.updated_at?.seconds || 0) - (b.updated_at?.seconds || 0));
      setParticipants(parts);
    });
    return () => unsubPart();
  }, [db, currentAction?.id, committeeId]);

  useEffect(() => {
    setDisplayGradedDelegates(delegates.map(d => {
      const g = d.grades || { speaking: 0, diplomacy: 0, knowledge: 0 };
      const avg = (Number(g.speaking) + Number(g.diplomacy) + Number(g.knowledge)) / 3;
      return { ...d, grades: g, average: avg };
    }));
  }, [delegates]);

  const toggleSuspension = () => {
    if (!db) return;
    updateDocumentNonBlocking(doc(db, 'committees', committeeId, 'sessionState', 'current'), { isSuspended: !isSuspended });
  };

  const updateFlux = (field: string, val: boolean) => {
    if (!db) return;
    updateDocumentNonBlocking(doc(db, 'committees', committeeId, 'sessionState', 'current'), { [field]: val });
    toast({ title: val ? "Flux activé" : "Flux suspendu" });
  };

  const launchOverlay = () => {
    if (!db || !overlayForm.title) return;
    const overlayData = {
      type: overlayForm.type,
      title: overlayForm.title,
      status: 'active',
      voteId: overlayForm.type === 'vote' ? Date.now().toString() : null,
      results: overlayForm.type === 'vote' ? { pour: 0, contre: 0, abstention: 0 } : null
    };
    updateDocumentNonBlocking(doc(db, 'committees', committeeId, 'sessionState', 'current'), { activeOverlay: overlayData });
    setIsOverlayDialogOpen(false);
  };

  const stopOverlay = () => {
    if (!db) return;
    updateDocumentNonBlocking(doc(db, 'committees', committeeId, 'sessionState', 'current'), { activeOverlay: { type: 'none' } });
  };

  const createAction = async () => {
    if (!db || !newAction.title) return;
    await addDocumentNonBlocking(collection(db, 'committees', committeeId, 'actions'), {
      ...newAction,
      status: 'launched',
      total_elapsed_seconds: 0,
      speaking_timer_total_elapsed: 0,
      speaking_timer_status: 'stopped',
      created_at: serverTimestamp(),
    });
    setNewAction({ title: '', duration: 15, timePerDelegate: '1:00', allowParticipation: true });
  };

  const handleUpdateGrade = (delegateId: string, field: string, value: number) => {
    if (!db) return;
    updateDocumentNonBlocking(doc(db, 'committees', committeeId, 'delegates', delegateId), { [`grades.${field}`]: value });
  };

  const handleMarkAsSpoken = (participationId: string) => {
    if (!db) return;
    updateDocumentNonBlocking(doc(db, 'committees', committeeId, 'participations', participationId), { status: 'spoken' });
  };

  const extendTime = (mins: number) => {
    if (!db || !currentAction) return;
    updateDocumentNonBlocking(doc(db, 'committees', committeeId, 'actions', currentAction.id), { duration_minutes: increment(mins) });
  };

  const startTimer = () => {
    if (!db || !currentAction) return;
    updateDocumentNonBlocking(doc(db, 'committees', committeeId, 'actions', currentAction.id), { status: 'started', started_at: new Date().toISOString() });
  };

  const pauseTimer = () => {
    if (!db || !currentAction || !currentAction.started_at) return;
    const now = new Date().getTime();
    const start = new Date(currentAction.started_at).getTime();
    const elapsed = Math.floor((now - start) / 1000);
    const total = (currentAction.total_elapsed_seconds || 0) + elapsed;
    updateDocumentNonBlocking(doc(db, 'committees', committeeId, 'actions', currentAction.id), { status: 'paused', total_elapsed_seconds: total, paused_at: new Date().toISOString(), started_at: null });
  };

  const stopAction = async () => {
    if (!db || !currentAction) return;
    updateDocumentNonBlocking(doc(db, 'committees', committeeId, 'actions', currentAction.id), { status: 'completed' });
  };

  const startSpeakingTimer = () => {
    if (!db || !currentAction) return;
    updateDocumentNonBlocking(doc(db, 'committees', committeeId, 'actions', currentAction.id), { speaking_timer_status: 'started', speaking_timer_started_at: new Date().toISOString() });
  };

  const pauseSpeakingTimer = () => {
    if (!db || !currentAction || currentAction.speaking_timer_status !== 'started') return;
    const now = new Date().getTime();
    const start = new Date(currentAction.speaking_timer_started_at).getTime();
    const elapsed = Math.floor((now - start) / 1000);
    const total = (currentAction.speaking_timer_total_elapsed || 0) + elapsed;
    updateDocumentNonBlocking(doc(db, 'committees', committeeId, 'actions', currentAction.id), { speaking_timer_status: 'paused', speaking_timer_total_elapsed: total, speaking_timer_started_at: null });
  };

  const resetSpeakingTimer = () => {
    if (!db || !currentAction) return;
    updateDocumentNonBlocking(doc(db, 'committees', committeeId, 'actions', currentAction.id), { speaking_timer_status: 'stopped', speaking_timer_started_at: null, speaking_timer_total_elapsed: 0 });
  };

  const handleDeleteAction = (actionId: string) => {
    if (!db) return;
    deleteDocumentNonBlocking(doc(db, 'committees', committeeId, 'actions', actionId));
    allParticipations.forEach(p => { if (p.action_id === actionId) deleteDocumentNonBlocking(doc(db!, 'committees', committeeId, 'participations', p.id)); });
  };

  if (isUserLoading) return <div className="min-h-screen flex items-center justify-center font-bold uppercase tracking-widest animate-pulse">Chargement...</div>;

  const gossipMessages = messages.filter(m => m.type === 'gossip');
  const privateMessages = messages.filter(m => m.type !== 'gossip');
  const unreadCount = privateMessages.filter(m => !m.is_read).length;

  const parseTimePerDelegate = (timeStr: string) => {
    if (!timeStr) return 60;
    const [mins, secs] = timeStr.split(':').map(Number);
    return (mins * 60) + (secs || 0);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col font-body">
      <header className="bg-white/80 backdrop-blur-md border-b border-primary/10 p-4 shadow-sm z-50 sticky top-0 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 w-full md:w-auto">
          <h1 className="text-lg md:text-2xl font-black uppercase tracking-tight text-gradient">{committee?.name}</h1>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="border-primary/20 text-primary uppercase text-[8px] md:text-[10px] font-bold px-3">{t.presidency}</Badge>
            {isSuspended && <Badge variant="destructive" className="animate-pulse bg-destructive/10 text-destructive border-destructive/20 text-[8px] md:text-[10px]">SÉANCE SUSPENDUE</Badge>}
          </div>
        </div>
        
        <div className="flex flex-wrap items-center justify-center gap-2 md:gap-4 w-full md:w-auto">
          <Collapsible open={isFluxMenuOpen} onOpenChange={setIsFluxMenuOpen} className="relative">
            <CollapsibleTrigger asChild>
              <Button variant="outline" size="sm" className="rounded-full border-primary/20 text-primary font-bold gap-2 text-[10px] md:text-xs">
                Contrôle des Flux {isFluxMenuOpen ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="absolute top-full mt-2 right-0 bg-white border border-primary/10 rounded-2xl p-4 shadow-2xl space-y-4 min-w-[220px] z-[60]">
               {[
                 { label: "Gossip", field: "allowGossip", icon: Ghost, checked: allowGossip },
                 { label: "Résolutions", field: "allowResolutions", icon: FileText, checked: allowResolutions }
               ].map(flux => (
                 <div key={flux.field} className="flex items-center justify-between gap-4">
                   <div className="flex items-center gap-2"><flux.icon className="size-3.5 text-primary" /><span className="text-[10px] font-black uppercase tracking-tight text-primary">{flux.label}</span></div>
                   <Switch checked={flux.checked} onCheckedChange={(val) => updateFlux(flux.field, val)} />
                 </div>
               ))}
               <Button variant={isSuspended ? "default" : "outline"} size="sm" className="w-full text-[10px] font-black h-8 rounded-xl" onClick={toggleSuspension}>
                {isSuspended ? t.resume : t.suspend}
              </Button>
            </CollapsibleContent>
          </Collapsible>

          {activeOverlay && activeOverlay.type === 'vote' && (
            <div className="flex items-center gap-4 bg-primary/5 px-4 py-1.5 rounded-2xl border border-primary/10">
              {['pour', 'contre', 'abstention'].map(c => (
                <div key={c} className="flex flex-col items-center">
                  <span className={`text-[7px] font-black uppercase ${c === 'pour' ? 'text-green-600' : c === 'contre' ? 'text-red-600' : 'text-amber-600'}`}>{c}</span>
                  <span className={`text-sm font-black tabular-nums ${c === 'pour' ? 'text-green-600' : c === 'contre' ? 'text-red-600' : 'text-amber-600'}`}>{activeOverlay.results?.[c] || 0}</span>
                </div>
              ))}
              <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full" onClick={stopOverlay}><X className="size-3" /></Button>
            </div>
          )}

          <Dialog open={isOverlayDialogOpen} onOpenChange={setIsOverlayDialogOpen}>
            <DialogTrigger asChild><Button size="sm" className="bg-primary hover:bg-primary/90 text-white rounded-full font-bold gap-2 px-4 text-[10px] md:text-xs"><Stars className="size-3.5" /> {t.specialAction}</Button></DialogTrigger>
            <DialogContent className="rounded-3xl border-primary/10 shadow-2xl w-[95vw] max-w-lg">
              <DialogHeader><DialogTitle className="text-xl font-black uppercase text-gradient">{t.specialTitle}</DialogTitle></DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2"><Label className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">{t.overlayType}</Label>
                  <Select value={overlayForm.type} onValueChange={(val) => setOverlayForm({...overlayForm, type: val})}>
                    <SelectTrigger className="rounded-xl border-primary/20"><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="message">Diffusion de Message</SelectItem><SelectItem value="vote">Procédure de Scrutin</SelectItem><SelectItem value="crisis" className="text-red-600 font-black">🚨 ALERTE CRISE</SelectItem></SelectContent>
                  </Select>
                </div>
                <div className="space-y-2"><Label className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">{overlayForm.type === 'crisis' ? t.crisisSubject : t.overlaySubject}</Label><Input value={overlayForm.title} onChange={(e) => setOverlayForm({...overlayForm, title: e.target.value})} className="rounded-xl border-primary/20 h-11" /></div>
              </div>
              <DialogFooter><Button onClick={launchOverlay} className={overlayForm.type === 'crisis' ? "bg-red-600 hover:bg-red-700 w-full font-black uppercase h-12 rounded-2xl" : "bg-primary w-full h-12 rounded-2xl"}>{overlayForm.type === 'crisis' ? t.launchCrisis : t.launchEverywhere}</Button></DialogFooter>
            </DialogContent>
          </Dialog>
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive hover:bg-destructive/5 rounded-full h-10 w-10" onClick={() => { signOut(auth!); router.push('/'); }}><LogOut className="size-5" /></Button>
        </div>
      </header>

      <main className="flex-1 p-4 md:p-10 grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8 max-w-[1600px] mx-auto w-full">
        <div className="lg:col-span-4 space-y-6 md:space-y-8">
          <Tabs defaultValue="actions">
            <TabsList className="w-full bg-secondary/50 p-1 rounded-2xl border border-primary/5">
              <TabsTrigger value="actions" className="flex-1 rounded-xl font-bold uppercase text-[9px] md:text-xs tracking-widest">{t.actions}</TabsTrigger>
              <TabsTrigger value="delegates" className="flex-1 rounded-xl font-bold uppercase text-[9px] md:text-xs tracking-widest">{t.countries}</TabsTrigger>
              <TabsTrigger value="stats" className="flex-1 rounded-xl font-bold uppercase text-[9px] md:text-xs tracking-widest">{t.stats}</TabsTrigger>
            </TabsList>
            
            <TabsContent value="actions" className="space-y-6 mt-4 md:mt-6">
              <Card className="rounded-2xl border-primary/10 glass-card">
                <CardHeader className="pb-3"><CardTitle className="text-base font-black uppercase tracking-tight text-gradient">{t.newAction}</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1.5"><Label className="text-[9px] uppercase font-bold tracking-widest text-muted-foreground">{t.title}</Label><Input value={newAction.title} onChange={e => setNewAction({...newAction, title: e.target.value})} className="rounded-xl border-primary/10 text-xs h-10" /></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1"><Label className="text-[9px] uppercase font-bold tracking-widest text-muted-foreground">{t.duration}</Label><Input type="number" value={newAction.duration} onChange={e => setNewAction({...newAction, duration: parseInt(e.target.value)})} className="rounded-xl border-primary/10 text-xs h-10" /></div>
                    <div className="space-y-1"><Label className="text-[9px] uppercase font-bold tracking-widest text-muted-foreground">{t.speakingTime}</Label><Input value={newAction.timePerDelegate} onChange={e => setNewAction({...newAction, timePerDelegate: e.target.value})} className="rounded-xl border-primary/10 text-xs h-10" /></div>
                  </div>
                  <Button className="w-full bg-primary hover:bg-primary/90 h-10 rounded-xl font-bold uppercase tracking-widest text-[10px]" onClick={createAction}>{t.launchAction}</Button>
                </CardContent>
              </Card>

              {currentAction && currentAction.status !== 'completed' && (
                <Card className="rounded-2xl border-primary/20 shadow-2xl glass-card overflow-hidden">
                  <CardHeader className="bg-primary/[0.03] border-b border-primary/5 p-4 md:p-6">
                    <div className="flex justify-between items-start gap-3">
                      <div className="flex-1"><Badge className="bg-primary/10 text-primary border-primary/20 uppercase text-[7px] font-black tracking-widest px-2 mb-2">{currentAction.status}</Badge><CardTitle className="text-lg md:text-2xl font-black uppercase tracking-tight text-gradient leading-tight">{currentAction.title}</CardTitle></div>
                      <div className="flex items-center gap-1 bg-white p-1 rounded-xl shadow-inner border border-primary/10"><Input type="number" className="w-10 h-8 border-none p-1 text-center font-bold text-xs" value={customMinutes} onChange={(e) => setCustomMinutes(e.target.value)} /><Button size="icon" variant="ghost" className="h-8 w-8 text-primary rounded-lg" onClick={() => extendTime(parseInt(customMinutes))}><Plus className="size-4" /></Button></div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 md:p-8 space-y-6">
                    <GlobalTimer status={currentAction.status} startedAt={currentAction.started_at} pausedAt={currentAction.paused_at} totalElapsedSeconds={currentAction.total_elapsed_seconds} durationMinutes={currentAction.duration_minutes} />
                    <div className="grid grid-cols-2 gap-3">
                      {(currentAction.status === 'launched' || currentAction.status === 'paused') ? <Button size="sm" className="bg-primary h-12 rounded-xl gap-2 font-black uppercase tracking-widest shadow-lg shadow-primary/20" onClick={startTimer}><Play className="size-4" fill="currentColor" /> {t.start}</Button> : <Button size="sm" variant="outline" className="border-amber-400 text-amber-600 h-12 rounded-xl gap-2 font-black uppercase tracking-widest" onClick={pauseTimer}><Pause className="size-4" fill="currentColor" /> {t.pause}</Button>}
                      <Button size="sm" variant="destructive" className="h-12 rounded-xl gap-2 font-black uppercase tracking-widest shadow-lg shadow-destructive/20" onClick={stopAction}><Square className="size-4" fill="currentColor" /> {t.stop}</Button>
                    </div>
                    <div className="pt-4 border-t border-primary/5 space-y-4">
                      <div className="flex justify-between items-center"><h3 className="font-black text-[8px] md:text-[10px] text-primary uppercase tracking-[0.2em] flex items-center gap-2"><Timer className="size-3 md:size-4" /> {t.speakerChrono}</h3><Badge variant="outline" className="text-[8px] md:text-[10px] font-bold border-primary/10 bg-primary/5">{currentAction.time_per_delegate}</Badge></div>
                      <div className="flex justify-center"><SpeakingTimer status={currentAction.speaking_timer_status} startedAt={currentAction.speaking_timer_started_at} totalElapsedSeconds={currentAction.speaking_timer_total_elapsed || 0} limitSeconds={parseTimePerDelegate(currentAction.time_per_delegate)} size="md" /></div>
                      <div className="grid grid-cols-3 gap-2">
                        {currentAction.speaking_timer_status === 'started' ? <Button variant="outline" size="sm" className="border-amber-400 text-amber-600 h-8 rounded-lg font-bold uppercase text-[8px]" onClick={pauseSpeakingTimer}><Pause className="size-3" /> {t.pause}</Button> : <Button variant="secondary" size="sm" className="bg-primary/10 text-primary h-8 rounded-lg font-bold uppercase text-[8px]" onClick={startSpeakingTimer}><Play className="size-3" /> {t.start}</Button>}
                        <Button variant="ghost" size="sm" className="border border-primary/10 h-8 rounded-lg font-bold uppercase text-[8px]" onClick={resetSpeakingTimer}>Reset</Button>
                        <Button variant="outline" size="sm" className="border-green-500/30 text-green-600 h-8 rounded-lg font-bold uppercase text-[8px]" onClick={() => handleMarkAsSpoken(participants[0]?.id)} disabled={!participants[0]}><Check className="size-3" /></Button>
                      </div>
                    </div>
                    <div className="space-y-4 pt-4 border-t border-primary/5">
                      <h3 className="font-black text-[9px] md:text-[10px] text-primary uppercase tracking-[0.2em] flex items-center justify-between"><span className="flex items-center gap-2"><ListOrdered className="size-3 md:size-4" /> {t.speakersList}</span><Badge className="bg-primary rounded-lg text-[10px]">{participants.length}</Badge></h3>
                      <ScrollArea className="h-[150px] md:h-[200px] rounded-xl border border-primary/5 bg-primary/[0.01] p-2">
                        <div className="space-y-2">
                          {participants.length > 0 ? participants.map((p, i) => (
                            <div key={p.id} className="flex justify-between items-center p-2.5 bg-white border border-primary/5 rounded-xl shadow-sm group hover:border-primary/20 transition-all">
                              <span className="font-bold text-[10px] md:text-sm text-foreground/80">{i + 1}. {p.country_name}</span>
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-green-600 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => handleMarkAsSpoken(p.id)}><Check className="size-3" /></Button>
                            </div>
                          )) : <div className="text-center py-10 text-muted-foreground text-[8px] md:text-xs italic opacity-50">{t.noSpeaker}</div>}
                        </div>
                      </ScrollArea>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="delegates" className="space-y-6 mt-4">
              <Card className="rounded-2xl border-primary/10 glass-card">
                <CardHeader className="pb-3 flex flex-row items-center gap-3"><UserPlus className="size-4 md:size-5 text-primary" /><CardTitle className="text-base font-black uppercase tracking-tight text-gradient">{t.addCountry}</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2"><Label className="text-[9px] uppercase font-bold tracking-widest text-muted-foreground">{t.countryName}</Label><Input value={newDelegate.name} onChange={e => setNewDelegate({...newDelegate, name: e.target.value})} className="rounded-xl border-primary/10 h-10 text-xs" /></div>
                  <div className="space-y-2"><Label className="text-[9px] uppercase font-bold tracking-widest text-muted-foreground">{t.password}</Label><Input value={newDelegate.password} onChange={e => setNewDelegate({...newDelegate, password: e.target.value})} className="rounded-xl border-primary/10 h-10 text-xs" /></div>
                  <Button className="w-full bg-primary h-10 rounded-xl font-bold uppercase tracking-widest text-[9px]" onClick={() => { if(db && newDelegate.name) addDocumentNonBlocking(collection(db, 'committees', committeeId, 'delegates'), { country_name: newDelegate.name, password: newDelegate.password, is_suspended: false, grades: { speaking: 0, diplomacy: 0, knowledge: 0 }, created_at: serverTimestamp() }); setNewDelegate({ name: '', password: '' }); }}>{t.addToList}</Button>
                </CardContent>
              </Card>
              <Card className="rounded-2xl border-primary/10 glass-card"><CardHeader><CardTitle className="text-base font-black uppercase tracking-tight text-gradient">{t.registeredDelegates} ({delegates.length})</CardTitle></CardHeader>
                <CardContent><ScrollArea className="h-[300px] md:h-[450px]"><div className="space-y-2.5">
                  {delegates.map(d => (
                    <div key={d.id} className={`flex justify-between items-center p-3 rounded-xl border transition-all ${d.is_suspended ? 'bg-destructive/5 border-destructive/20' : 'bg-white border-primary/5'}`}>
                      <div className="flex flex-col min-w-0 flex-1"><div className="flex items-center gap-2"><span className="font-bold text-[10px] md:text-sm text-foreground/80 truncate">{d.country_name}</span>{d.is_suspended && <Badge variant="destructive" className="h-3 text-[6px] px-1 font-black">Suspendu</Badge>}</div><span className="text-[7px] md:text-[9px] text-muted-foreground font-mono mt-0.5 opacity-60">Pass: {d.password}</span></div>
                      <div className="flex items-center gap-1"><Button variant="ghost" size="icon" className={`h-7 w-7 rounded-lg ${d.is_suspended ? 'text-green-600' : 'text-amber-600'}`} onClick={() => updateDocumentNonBlocking(doc(db!, 'committees', committeeId, 'delegates', d.id), { is_suspended: !d.is_suspended })}>{d.is_suspended ? <ShieldOff className="size-3" /> : <ShieldAlert className="size-3" />}</Button><Button variant="ghost" size="icon" className="text-destructive h-7 w-7 rounded-lg" onClick={() => deleteDocumentNonBlocking(doc(db!, 'committees', committeeId, 'delegates', d.id))}><Trash2 className="size-3" /></Button></div>
                    </div>
                  ))}
                </div></ScrollArea></CardContent></Card>
            </TabsContent>

            <TabsContent value="stats" className="space-y-6 mt-4 md:mt-6">
              <Card className="rounded-2xl border-primary/10 glass-card">
                <CardHeader className="flex flex-row items-center gap-3 p-4 md:p-6"><Award className="size-4 md:size-5 text-primary" /><CardTitle className="text-base font-black uppercase tracking-tight text-gradient">{t.gradingTitle}</CardTitle></CardHeader>
                <CardContent className="px-2 md:px-4 pb-4">
                  <div className="mb-4"><Button size="sm" onClick={() => { const sorted = [...displayGradedDelegates].sort((a, b) => b.average - a.average); setDisplayGradedDelegates(sorted); }} className="w-full bg-primary h-11 rounded-xl font-black uppercase tracking-widest text-[9px] gap-2 shadow-lg shadow-primary/20"><Calculator className="size-4" /> {t.calculate}</Button></div>
                  <ScrollArea className="h-[400px] md:h-[600px]"><div className="space-y-4 p-1">
                    {displayGradedDelegates.map((d, index) => (
                      <div key={d.id} className="p-4 border border-primary/5 rounded-[1.5rem] bg-white shadow-sm hover:shadow-md transition-all">
                        <div className="flex justify-between items-center mb-4"><div className="flex items-center gap-2"><span className="h-7 w-7 bg-primary/5 text-primary rounded-lg flex items-center justify-center font-black text-[10px] border border-primary/10">{index + 1}</span><span className="font-black uppercase tracking-tight text-[10px] md:text-sm text-foreground/80 truncate max-w-[100px]">{d.country_name}</span></div><div className="flex flex-col items-end"><span className="text-[7px] font-black text-primary uppercase tracking-[0.1em]">{t.average}</span><span className={`text-base md:text-2xl font-black tabular-nums ${d.average >= 7 ? 'text-green-600' : d.average >= 4 ? 'text-amber-600' : 'text-red-600'}`}>{d.average.toFixed(1)}/10</span></div></div>
                        <div className="grid grid-cols-3 gap-2">
                          {['speaking', 'diplomacy', 'knowledge'].map(field => (
                            <div key={field} className="space-y-1"><Label className="text-[7px] font-black uppercase tracking-widest text-muted-foreground">{t[field as keyof typeof t] || field}</Label><Input type="number" min="0" max="10" step="0.5" className="h-8 text-[9px] font-black rounded-lg border-primary/10" value={d.grades[field]} onChange={(e) => handleUpdateGrade(d.id, field, Number(e.target.value))} /></div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div></ScrollArea>
                </CardContent>
              </Card>
              <Card className="rounded-2xl border-primary/10 glass-card">
                <CardHeader className="flex flex-row items-center gap-3 p-4 md:p-6"><History className="size-4 md:size-5 text-primary" /><CardTitle className="text-base font-black uppercase tracking-tight text-gradient">{t.actionsHistory}</CardTitle></CardHeader>
                <CardContent className="px-4 pb-6"><ScrollArea className="h-[250px]"><div className="space-y-3">
                  {allActions.map(action => (
                    <div key={action.id} className="flex justify-between items-center p-3 bg-muted/30 rounded-xl border border-primary/5 text-[9px] md:text-xs">
                      <div className="flex flex-col gap-1 min-w-0"><span className="font-black uppercase tracking-tight text-primary truncate">{action.title}</span><Badge variant="outline" className="text-[7px] font-bold uppercase w-fit">{action.status}</Badge></div>
                      <Button variant="ghost" size="icon" className="text-destructive h-8 w-8" onClick={() => handleDeleteAction(action.id)}><Trash2 className="size-3" /></Button>
                    </div>
                  ))}
                </div></ScrollArea></CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <div className="lg:col-span-8 space-y-6 md:space-y-8">
          <Tabs defaultValue="resolutions" className="w-full">
            <TabsList className="w-full bg-secondary/50 p-1 rounded-2xl border border-primary/5 flex">
              <TabsTrigger value="resolutions" className="flex-1 rounded-xl font-bold uppercase text-[9px] md:text-xs tracking-widest">{t.resolutionsTab}</TabsTrigger>
              <TabsTrigger value="messages" className="flex-1 relative rounded-xl font-bold uppercase text-[9px] md:text-xs tracking-widest">Msgs {unreadCount > 0 && <Badge variant="destructive" className="ml-1 h-4 w-4 p-0 flex items-center justify-center rounded-full text-[8px] font-black border-none animate-pulse">{unreadCount}</Badge>}</TabsTrigger>
              <TabsTrigger value="gossip" className="flex-1 rounded-xl font-bold uppercase text-[9px] md:text-xs tracking-widest">Gossip</TabsTrigger>
            </TabsList>
            
            <TabsContent value="resolutions" className="mt-4 md:mt-6 animate-in fade-in duration-300">
              <Card className="rounded-2xl md:rounded-3xl border-primary/10 glass-card overflow-hidden">
                <CardHeader className="bg-primary/[0.02] border-b border-primary/5 flex flex-row items-center justify-between py-4 md:py-6"><CardTitle className="flex items-center gap-3 text-lg md:text-2xl font-black uppercase tracking-tight text-gradient"><FileText className="text-primary" /> {t.resolutionsSubmitted}</CardTitle><Badge variant="outline" className="h-8 w-8 rounded-xl flex items-center justify-center p-0 font-black border-primary/20 text-primary">{resolutions.length}</Badge></CardHeader>
                <CardContent className="p-4 md:p-8 space-y-6">
                  {resolutions.map(res => (
                    <Card key={res.id} className={`overflow-hidden rounded-2xl border-2 transition-all duration-500 ${res.is_displayed ? 'border-primary shadow-2xl scale-[1.01]' : 'border-primary/5'}`}>
                      <div className="bg-muted/30 p-4 flex justify-between items-center border-b border-primary/5">
                        <div className="flex items-center gap-3"><span className="font-black text-primary uppercase text-sm md:text-lg truncate max-w-[200px]">{res.title || "Projet"}</span>{res.is_displayed && <Badge className="bg-primary animate-pulse text-[7px] md:text-[9px] font-black"><Monitor className="size-2.5 mr-1" /> PROJECTÉ</Badge>}</div>
                        <Badge variant={res.status === 'approved' ? 'default' : res.status === 'rejected' ? 'destructive' : 'secondary'} className="uppercase font-black text-[7px] md:text-[9px]">{res.status?.toUpperCase()}</Badge>
                      </div>
                      <CardContent className="p-4 md:p-8 space-y-4">
                        <div className="flex flex-wrap gap-2 mb-4"><Badge className="bg-primary/5 text-primary border-primary/10 py-1 text-[7px] md:text-[10px] font-black uppercase">DE: {res.proposing_country}</Badge></div>
                        <div className="text-xs md:text-base leading-relaxed whitespace-pre-wrap font-medium text-foreground/80 p-4 bg-primary/[0.01] rounded-xl border border-primary/5" dangerouslySetInnerHTML={{ __html: res.content }} />
                        <div className="flex gap-2 justify-end pt-4 border-t border-primary/5">
                          <Button size="sm" variant={res.is_displayed ? "default" : "outline"} className={`rounded-xl font-bold uppercase text-[8px] md:text-[10px] ${res.is_displayed ? 'bg-primary' : 'border-primary/20 text-primary'}`} onClick={() => updateDocumentNonBlocking(doc(db!, 'committees', committeeId, 'resolutions', res.id), { is_displayed: !res.is_displayed })}>{res.is_displayed ? <><EyeOff className="size-3 md:size-4 mr-1" /> {t.hide}</> : <><Eye className="size-3 md:size-4 mr-1" /> {t.show}</>}</Button>
                          <Button size="sm" variant="outline" className="border-green-500/30 text-green-600 h-8 md:h-10 rounded-xl" onClick={() => updateDocumentNonBlocking(doc(db!, 'committees', committeeId, 'resolutions', res.id), { status: 'approved' })}><CheckCircle className="size-3 md:size-4" /></Button>
                          <Button size="sm" variant="outline" className="border-red-500/30 text-red-600 h-8 md:h-10 rounded-xl" onClick={() => updateDocumentNonBlocking(doc(db!, 'committees', committeeId, 'resolutions', res.id), { status: 'rejected' })}><XCircle className="size-3 md:size-4" /></Button>
                          <Button size="icon" variant="ghost" className="text-destructive h-8 w-8" onClick={() => deleteDocumentNonBlocking(doc(db!, 'committees', committeeId, 'resolutions', res.id))}><Trash2 className="size-3 md:size-4" /></Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="messages" className="mt-4 md:mt-6 animate-in fade-in duration-300">
              <Card className="rounded-2xl border-primary/10 glass-card overflow-hidden"><CardHeader className="bg-primary/[0.02] border-b border-primary/5 py-4 md:py-6"><CardTitle className="flex items-center gap-3 text-lg font-black uppercase tracking-tight text-gradient"><Bell className="size-5 text-primary" /> {t.privateInbox}</CardTitle></CardHeader>
                <CardContent className="p-0"><ScrollArea className="h-[400px] md:h-[700px]"><div className="p-4 md:p-8 space-y-4">
                  {privateMessages.map(msg => (
                    <div key={msg.id} className={`p-4 md:p-6 border-l-4 md:border-l-8 rounded-xl md:rounded-3xl shadow-sm flex flex-col gap-3 transition-all duration-300 hover:shadow-md ${msg.is_read ? 'bg-muted/20 border-muted-foreground/30 opacity-70' : 'bg-primary/[0.02] border-primary shadow-primary/5'}`}>
                      <div className="flex justify-between items-start"><div className="flex items-center gap-3"><Badge className={`uppercase text-[7px] md:text-[9px] font-black px-2 py-1 rounded-full shadow-sm ${msg.type === 'privilege' ? 'bg-destructive text-white' : 'bg-secondary text-primary'}`}>{msg.type}</Badge><span className="font-black uppercase tracking-tight text-[10px] md:text-sm text-foreground/80">{msg.sender_country}</span></div><div className="flex items-center gap-1 shrink-0 ml-2">
                        {!msg.is_read && <Button size="icon" variant="ghost" className="h-8 w-8 text-green-600 rounded-xl shadow-sm border border-green-100" onClick={() => updateDocumentNonBlocking(doc(db!, 'committees', committeeId, 'messages', msg.id), { is_read: true })}><Check className="size-4" /></Button>}
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive rounded-xl border border-destructive/5" onClick={() => deleteDocumentNonBlocking(doc(db!, 'committees', committeeId, 'messages', msg.id))}><Trash2 className="size-4" /></Button></div></div>
                      <p className="text-xs md:text-base font-semibold text-foreground/80 leading-relaxed italic">"{msg.content}"</p>
                    </div>
                  ))}
                </div></ScrollArea></CardContent></Card>
            </TabsContent>

            <TabsContent value="gossip" className="mt-4 md:mt-6 animate-in fade-in duration-300">
              <Card className="rounded-2xl border-primary/10 glass-card overflow-hidden"><CardHeader className="bg-primary/[0.02] border-b border-primary/5 py-4 md:py-6"><CardTitle className="flex items-center gap-3 text-lg font-black uppercase tracking-tight text-gradient"><Ghost className="size-5 text-primary" /> {t.gossipBoxTitle}</CardTitle></CardHeader>
                <CardContent className="p-0"><ScrollArea className="h-[400px] md:h-[700px]"><div className="p-4 md:p-8 space-y-4">
                  {gossipMessages.map(msg => (
                    <div key={msg.id} className="p-4 md:p-6 border-l-4 md:border-l-8 border-primary rounded-xl md:rounded-3xl shadow-sm flex flex-col gap-3 transition-all duration-300 hover:shadow-md bg-primary/[0.02]">
                      <div className="flex justify-between items-start"><Badge className="bg-primary text-white uppercase text-[7px] md:text-[9px] font-black px-2 py-1 rounded-full shadow-sm">GOSSIP ANONYME</Badge><div className="flex items-center gap-2">
                        <Button variant={activeOverlay?.type === 'gossip' && activeOverlay?.title === msg.content ? "default" : "outline"} size="sm" className="rounded-xl font-bold uppercase text-[7px] md:text-[10px] px-3 h-8 md:h-10" onClick={() => { if (activeOverlay?.type === 'gossip' && activeOverlay?.title === msg.content) stopOverlay(); else updateDocumentNonBlocking(doc(db!, 'committees', committeeId, 'sessionState', 'current'), { activeOverlay: { type: 'gossip', title: msg.content, status: 'active' } }); }}>{activeOverlay?.type === 'gossip' && activeOverlay?.title === msg.content ? t.hide : t.show}</Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => deleteDocumentNonBlocking(doc(db!, 'committees', committeeId, 'messages', msg.id))}><Trash2 className="size-4" /></Button></div></div>
                      <p className="text-xs md:text-base font-semibold text-foreground/80 leading-relaxed italic">"{msg.content}"</p>
                    </div>
                  ))}
                </div></ScrollArea></CardContent></Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
