
"use client"

import { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Play, Pause, Square, LogOut, FileText, Eye, EyeOff, CheckCircle, XCircle, ListOrdered, Clock, Timer, MessageSquareOff, MessageSquare, Plus, Trash2, Bell, Check, Stars, X, ThumbsUp, ThumbsDown, CircleSlash, BarChart3, UserPlus, History, ShieldOff, ShieldAlert, User, Monitor, Users, AlertTriangle, Languages, Award, Calculator, TrendingUp, Ghost } from 'lucide-react';
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
      allowOptional: "Participation facultative",
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
      participationStats: "Analytique des Participations",
      actionsHistory: "Journal des Procédures",
      resolutionsSubmitted: "Projets de Résolution",
      privateInbox: "Communications Privées",
      gossipBoxTitle: "Gossip Box (Anonyme)",
      noResolution: "Aucune résolution soumise",
      noMessage: "Aucun message en attente",
      noGossip: "La Gossip Box est vide",
      approve: "Valider",
      reject: "Rejeter",
      hide: "Masquer",
      show: "Projeter",
      spokesperson: "Porte-parole",
      sponsors: "Sponsors",
      specialTitle: "Configuration de l'Alerte",
      overlayType: "Mode de Diffusion",
      overlaySubject: "Sujet / Titre",
      crisisSubject: "Nature de la Crise",
      launchEverywhere: "Diffuser sur tous les écrans",
      launchCrisis: "DÉCLENCHER LA CRISE",
      auth: "Vérification des accès...",
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
      allowOptional: "Optional participation",
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
      participationStats: "Participation Analytics",
      actionsHistory: "Procedure Log",
      resolutionsSubmitted: "Draft Resolutions",
      privateInbox: "Private Communications",
      gossipBoxTitle: "Gossip Box (Anonymous)",
      noResolution: "No resolutions submitted",
      noMessage: "No messages pending",
      noGossip: "The Gossip Box is empty",
      approve: "Approve",
      reject: "Reject",
      hide: "Hide",
      show: "Project",
      spokesperson: "Spokesperson",
      sponsors: "Sponsors",
      specialTitle: "Alert Configuration",
      overlayType: "Broadcast Mode",
      overlaySubject: "Subject / Title",
      crisisSubject: "Crisis Nature",
      launchEverywhere: "Broadcast to all screens",
      launchCrisis: "TRIGGER CRISIS",
      auth: "Checking access...",
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
  const [newAction, setNewAction] = useState({
    title: '',
    duration: 15,
    timePerDelegate: '1:00',
    description: '',
    allowParticipation: true
  });

  const [newDelegate, setNewDelegate] = useState({
    name: '',
    password: ''
  });

  const [overlayForm, setOverlayForm] = useState({
    type: 'message',
    title: ''
  });
  const [isOverlayDialogOpen, setIsOverlayDialogOpen] = useState(false);

  const [delegates, setDelegates] = useState<any[]>([]);
  const [resolutions, setResolutions] = useState<any[]>([]);
  const [participants, setParticipants] = useState<any[]>([]);
  const [allParticipations, setAllParticipations] = useState<any[]>([]);
  const [allActions, setAllActions] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [displayGradedDelegates, setDisplayGradedDelegates] = useState<any[]>([]);

  // Refs for tracking new items and playing sounds
  const initialResolutionsCount = useRef<number | null>(null);
  const initialMessagesCount = useRef<number | null>(null);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push(`/committees/${committeeId}/president/login`);
    }
  }, [user, isUserLoading, router, committeeId]);

  useEffect(() => {
    if (!db || !user) return;

    const delRef = collection(db, 'committees', committeeId, 'delegates');
    const unsubDel = onSnapshot(query(delRef, orderBy('country_name', 'asc')), (snap) => {
      setDelegates(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    const resolutionsRef = collection(db, 'committees', committeeId, 'resolutions');
    const unsubRes = onSnapshot(query(resolutionsRef, orderBy('created_at', 'desc')), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      if (initialResolutionsCount.current !== null && data.length > initialResolutionsCount.current) {
        playNotificationSound();
      }
      initialResolutionsCount.current = data.length;
      setResolutions(data);
    });

    const messagesRef = collection(db, 'committees', committeeId, 'messages');
    const unsubMessages = onSnapshot(query(messagesRef, orderBy('timestamp', 'desc')), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      if (initialMessagesCount.current !== null && data.length > initialMessagesCount.current) {
        playNotificationSound();
      }
      initialMessagesCount.current = data.length;
      setMessages(data);
    });

    const partRef = collection(db, 'committees', committeeId, 'participations');
    const unsubPartAll = onSnapshot(partRef, (snapshot) => {
      setAllParticipations(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const actionsHistoryRef = collection(db, 'committees', committeeId, 'actions');
    const unsubActionsAll = onSnapshot(query(actionsHistoryRef, orderBy('created_at', 'desc')), (snapshot) => {
      setAllActions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
      unsubDel();
      unsubRes();
      unsubMessages();
      unsubPartAll();
      unsubActionsAll();
    };
  }, [db, user, committeeId]);

  useEffect(() => {
    if (!db || !currentAction?.id) {
      setParticipants([]);
      return;
    }

    const partRef = collection(db, 'committees', committeeId, 'participations');
    const unsubPart = onSnapshot(query(partRef, where('action_id', '==', currentAction.id)), (snapshot) => {
      const parts = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() as any }))
        .filter(p => p.status === 'participating')
        .sort((a, b) => (a.updated_at?.seconds || 0) - (b.updated_at?.seconds || 0));
      setParticipants(parts);
    });

    return () => unsubPart();
  }, [db, currentAction?.id, committeeId]);

  useEffect(() => {
    setDisplayGradedDelegates(prev => {
      const currentDelegatesData = delegates.map(d => {
        const g = d.grades || { speaking: 0, diplomacy: 0, knowledge: 0 };
        const avg = (Number(g.speaking) + Number(g.diplomacy) + Number(g.knowledge)) / 3;
        return { ...d, grades: g, average: avg };
      });

      const existingIds = new Set(prev.map(p => p.id));
      const currentIds = new Set(currentDelegatesData.map(d => d.id));
      const updatedPrev = prev
        .filter(p => currentIds.has(p.id))
        .map(p => {
          const updated = currentDelegatesData.find(d => d.id === p.id);
          return updated || p;
        });

      const newDelegates = currentDelegatesData.filter(d => !existingIds.has(d.id));
      return [...updatedPrev, ...newDelegates];
    });
  }, [delegates]);

  const playNotificationSound = () => {
    try {
      const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const context = new AudioContextClass();
      const now = context.currentTime;
      const osc = context.createOscillator();
      const gain = context.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.1);
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.1, now + 0.05);
      gain.gain.linearRampToValueAtTime(0, now + 0.2);
      osc.connect(gain);
      gain.connect(context.destination);
      osc.start(now);
      osc.stop(now + 0.2);
    } catch (e) {
      console.warn("Audio blocked");
    }
  };

  const handleCalculateRanks = () => {
    const sorted = [...displayGradedDelegates].sort((a, b) => b.average - a.average);
    setDisplayGradedDelegates(sorted);
    toast({ title: t.calculate + " : OK" });
  };

  const statsData = useMemo(() => {
    const counts: Record<string, number> = {};
    delegates.forEach(d => { counts[d.country_name] = 0; });
    
    const existingActionIds = new Set(allActions.map(a => a.id));
    
    allParticipations.forEach(p => {
      if (existingActionIds.has(p.action_id) && (p.status === 'participating' || p.status === 'spoken') && counts[p.country_name] !== undefined) {
        counts[p.country_name]++;
      }
    });
    return Object.entries(counts).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
  }, [allParticipations, delegates, allActions]);

  const toggleSuspension = () => {
    if (!db) return;
    const sessionRef = doc(db, 'committees', committeeId, 'sessionState', 'current');
    setDocumentNonBlocking(sessionRef, { isSuspended: !isSuspended, lastUpdated: new Date().toISOString() }, { merge: true });
  };

  const toggleResolutions = (val: boolean) => {
    if (!db) return;
    const sessionRef = doc(db, 'committees', committeeId, 'sessionState', 'current');
    setDocumentNonBlocking(sessionRef, { allowResolutions: val, lastUpdated: new Date().toISOString() }, { merge: true });
    toast({ title: val ? t.resolutionsAllowed : t.resolutionsBlocked });
  };

  const toggleGossip = (val: boolean) => {
    if (!db) return;
    const sessionRef = doc(db, 'committees', committeeId, 'sessionState', 'current');
    setDocumentNonBlocking(sessionRef, { allowGossip: val, lastUpdated: new Date().toISOString() }, { merge: true });
    toast({ title: val ? t.gossipAllowed : t.gossipBlocked });
  };

  const launchOverlay = () => {
    if (!db || !overlayForm.title) return;
    const sessionRef = doc(db, 'committees', committeeId, 'sessionState', 'current');
    const overlayData = {
      type: overlayForm.type,
      title: overlayForm.title,
      status: 'active',
      voteId: overlayForm.type === 'vote' ? Date.now().toString() : null,
      results: overlayForm.type === 'vote' ? { pour: 0, contre: 0, abstention: 0 } : null
    };
    setDocumentNonBlocking(sessionRef, { activeOverlay: overlayData }, { merge: true });
    setIsOverlayDialogOpen(false);
    toast({ 
      title: overlayForm.type === 'vote' ? t.voteLaunched : overlayForm.type === 'crisis' ? t.crisisTriggered : t.messageDisplayed,
      variant: overlayForm.type === 'crisis' ? "destructive" : "default"
    });
  };

  const stopOverlay = () => {
    if (!db) return;
    const sessionRef = doc(db, 'committees', committeeId, 'sessionState', 'current');
    setDocumentNonBlocking(sessionRef, { activeOverlay: { type: 'none' } }, { merge: true });
    toast({ title: "Affichage arrêté" });
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
      await addDocumentNonBlocking(collection(db, 'committees', committeeId, 'actions'), actionData);
      toast({ title: lang === 'fr' ? "Action lancée" : "Action launched" });
      setNewAction({ title: '', duration: 15, timePerDelegate: '1:00', description: '', allowParticipation: true });
    } catch (e) {
      toast({ title: "Erreur", description: "Impossible de créer l'action.", variant: "destructive" });
    }
  };

  const handleAddDelegate = async () => {
    if (!db || !newDelegate.name || !newDelegate.password) {
      toast({ title: "Champs manquants", variant: "destructive" });
      return;
    }
    try {
      await addDocumentNonBlocking(collection(db, 'committees', committeeId, 'delegates'), {
        country_name: newDelegate.name,
        password: newDelegate.password,
        is_suspended: false,
        grades: { speaking: 0, diplomacy: 0, knowledge: 0 },
        created_at: serverTimestamp()
      });
      setNewDelegate({ name: '', password: '' });
      toast({ title: lang === 'fr' ? "Pays ajouté avec succès" : "Country added successfully" });
    } catch (e) {
      toast({ title: "Erreur", variant: "destructive" });
    }
  };

  const handleUpdateGrade = (delegateId: string, field: string, value: number) => {
    if (!db) return;
    const delegateRef = doc(db, 'committees', committeeId, 'delegates', delegateId);
    updateDocumentNonBlocking(delegateRef, { [`grades.${field}`]: value });
  };

  const toggleDelegateSuspension = (delegateId: string, currentStatus: boolean) => {
    if (!db) return;
    updateDocumentNonBlocking(doc(db, 'committees', committeeId, 'delegates', delegateId), { is_suspended: !currentStatus });
  };

  const handleMarkAsSpoken = (participationId: string) => {
    if (!db) return;
    updateDocumentNonBlocking(doc(db, 'committees', committeeId, 'participations', participationId), { status: 'spoken' });
    toast({ title: lang === 'fr' ? "Orateur validé" : "Speaker validated" });
  };

  const extendTime = (mins: number) => {
    if (!db || !currentAction || isNaN(mins)) return;
    const actionRef = doc(db, 'committees', committeeId, 'actions', currentAction.id);
    updateDocumentNonBlocking(actionRef, { duration_minutes: increment(mins) });
  };

  const startTimer = () => {
    if (!db || !currentAction) return;
    const actionRef = doc(db, 'committees', committeeId, 'actions', currentAction.id);
    updateDocumentNonBlocking(actionRef, { status: 'started', started_at: new Date().toISOString() });
  };

  const pauseTimer = () => {
    if (!db || !currentAction || !currentAction.started_at) return;
    const actionRef = doc(db, 'committees', committeeId, 'actions', currentAction.id);
    const now = new Date().getTime();
    const start = new Date(currentAction.started_at).getTime();
    const elapsedSinceStart = Math.floor((now - start) / 1000);
    const totalElapsed = (currentAction.total_elapsed_seconds || 0) + elapsedSinceStart;
    updateDocumentNonBlocking(actionRef, { status: 'paused', total_elapsed_seconds: totalElapsed, paused_at: new Date().toISOString(), started_at: null });
  };

  const startSpeakingTimer = () => {
    if (!db || !currentAction) return;
    updateDocumentNonBlocking(doc(db, 'committees', committeeId, 'actions', currentAction.id), {
      speaking_timer_status: 'started',
      speaking_timer_started_at: new Date().toISOString()
    });
  };

  const pauseSpeakingTimer = () => {
    if (!db || !currentAction || currentAction.speaking_timer_status !== 'started') return;
    const now = new Date().getTime();
    const start = new Date(currentAction.speaking_timer_started_at).getTime();
    const elapsed = Math.floor((now - start) / 1000);
    const total = (currentAction.speaking_timer_total_elapsed || 0) + elapsed;
    updateDocumentNonBlocking(doc(db, 'committees', committeeId, 'actions', currentAction.id), {
      speaking_timer_status: 'paused',
      speaking_timer_total_elapsed: total,
      speaking_timer_started_at: null
    });
  };

  const resetSpeakingTimer = () => {
    if (!db || !currentAction) return;
    updateDocumentNonBlocking(doc(db, 'committees', committeeId, 'actions', currentAction.id), {
      speaking_timer_status: 'stopped',
      speaking_timer_started_at: null,
      speaking_timer_total_elapsed: 0
    });
  };

  const stopAction = async () => {
    if (!db || !currentAction) return;
    const actionRef = doc(db, 'committees', committeeId, 'actions', currentAction.id);
    updateDocumentNonBlocking(actionRef, { status: 'completed' });
  };

  const markMessageAsRead = (messageId: string) => {
    if (!db) return;
    updateDocumentNonBlocking(doc(db, 'committees', committeeId, 'messages', messageId), { is_read: true });
  };

  const deleteMessage = (messageId: string) => {
    if (!db) return;
    deleteDocumentNonBlocking(doc(db, 'committees', committeeId, 'messages', messageId));
  };

  const handleDeleteAction = (actionId: string) => {
    if (!db) return;
    deleteDocumentNonBlocking(doc(db, 'committees', committeeId, 'actions', actionId));
    
    allParticipations.forEach(p => {
      if (p.action_id === actionId) {
        deleteDocumentNonBlocking(doc(db, 'committees', committeeId, 'participations', p.id));
      }
    });
    
    toast({ title: t.actionDeleted });
  };

  const handleLogout = async () => {
    if (!auth) return;
    await signOut(auth);
    router.push('/');
  };

  if (isUserLoading) return <div className="min-h-screen flex items-center justify-center font-bold uppercase tracking-widest animate-pulse">{t.auth}</div>;

  const orateursInscrits = participants;
  const unreadMessagesCount = messages.filter(m => !m.is_read && m.type !== 'gossip').length;
  const gossipMessages = messages.filter(m => m.type === 'gossip');

  const parseTimePerDelegate = (timeStr: string) => {
    if (!timeStr) return 60;
    const [mins, secs] = timeStr.split(':').map(Number);
    return (mins * 60) + (secs || 0);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="bg-white/80 backdrop-blur-md border-b border-primary/10 p-4 shadow-sm flex justify-between items-center z-50 sticky top-0">
        <div className="flex items-center gap-6">
          <h1 className="text-xl font-black font-headline uppercase tracking-tight text-gradient">{committee?.name || "Comité"}</h1>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="border-primary/20 text-primary uppercase text-[10px] font-bold px-3">{t.presidency}</Badge>
            {isSuspended && <Badge variant="destructive" className="animate-pulse bg-destructive/10 text-destructive border-destructive/20">{lang === 'fr' ? 'SÉANCE SUSPENDUE' : 'SESSION SUSPENDED'}</Badge>}
            {activeOverlay?.type === 'crisis' && <Badge variant="destructive" className="bg-red-600 animate-bounce uppercase font-black px-4 shadow-xl border-none">{t.crisisMode}</Badge>}
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-secondary px-3 py-1.5 rounded-full border border-primary/10">
            <Ghost size={14} className="text-primary" />
            <span className="text-[10px] font-black uppercase tracking-tight text-primary">Gossip</span>
            <Switch checked={allowGossip} onCheckedChange={toggleGossip} className="data-[state=checked]:bg-primary" />
          </div>

          {activeOverlay && activeOverlay.type === 'vote' && (
            <div className="flex items-center gap-4 bg-primary/5 px-4 py-2 rounded-2xl border border-primary/10">
              <div className="flex items-center gap-4">
                <div className="flex flex-col items-center">
                  <span className="text-[8px] font-black uppercase text-green-600">Pour</span>
                  <span className="text-sm font-black tabular-nums text-green-600">{activeOverlay.results?.pour || 0}</span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-[8px] font-black uppercase text-red-600">Contre</span>
                  <span className="text-sm font-black tabular-nums text-red-600">{activeOverlay.results?.contre || 0}</span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-[8px] font-black uppercase text-amber-600">Abs.</span>
                  <span className="text-sm font-black tabular-nums text-amber-600">{activeOverlay.results?.abstention || 0}</span>
                </div>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-primary hover:bg-primary/10 rounded-full" onClick={stopOverlay}><X size={14} /></Button>
            </div>
          )}

          {activeOverlay && activeOverlay.type !== 'none' && activeOverlay.type !== 'vote' && (
            <div className="flex items-center gap-4 bg-primary/5 px-4 py-1.5 rounded-full border border-primary/20 animate-in fade-in zoom-in duration-300">
              <span className="text-[10px] font-black uppercase tracking-widest truncate max-w-[150px] text-primary">{activeOverlay.title}</span>
              <Button variant="ghost" size="icon" className="h-6 w-6 text-primary hover:bg-primary/10 rounded-full" onClick={stopOverlay}><X size={14} /></Button>
            </div>
          )}

          <Dialog open={isOverlayDialogOpen} onOpenChange={setIsOverlayDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90 text-white rounded-full font-bold gap-2 px-6">
                <Stars size={16} /> {t.specialAction}
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-3xl border-primary/10 shadow-2xl">
              <DialogHeader><DialogTitle className="text-2xl font-black uppercase text-gradient">{t.specialTitle}</DialogTitle></DialogHeader>
              <div className="space-y-6 py-6">
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">{t.overlayType}</Label>
                  <Select value={overlayForm.type} onValueChange={(val) => setOverlayForm({...overlayForm, type: val})}>
                    <SelectTrigger className="rounded-xl border-primary/20"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="message">{lang === 'fr' ? 'Diffusion de Message' : 'Message Broadcast'}</SelectItem>
                      <SelectItem value="vote">{lang === 'fr' ? 'Procédure de Scrutin' : 'Voting Procedure'}</SelectItem>
                      <SelectItem value="crisis" className="text-red-600 font-black">🚨 {lang === 'fr' ? 'ALERTE CRISE' : 'CRISIS ALERT'}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">{overlayForm.type === 'crisis' ? t.crisisSubject : t.overlaySubject}</Label>
                  <Input placeholder="..." value={overlayForm.title} onChange={(e) => setOverlayForm({...overlayForm, title: e.target.value})} className="rounded-xl border-primary/20 h-12" />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={launchOverlay} className={overlayForm.type === 'crisis' ? "bg-red-600 hover:bg-red-700 w-full font-black uppercase h-14 rounded-2xl" : "bg-primary w-full h-14 rounded-2xl"}>
                  {overlayForm.type === 'crisis' ? t.launchCrisis : t.launchEverywhere}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <div className="flex items-center gap-2 bg-secondary px-3 py-1.5 rounded-full border border-primary/10">
            <span className="text-[10px] font-black uppercase tracking-tight text-primary">Res.</span>
            <Switch checked={allowResolutions} onCheckedChange={toggleResolutions} className="data-[state=checked]:bg-primary" />
          </div>
          <Button variant="outline" className="border-primary/20 text-primary hover:bg-primary/5 rounded-full px-6 font-bold" onClick={toggleSuspension}>
            {isSuspended ? t.resume : t.suspend}
          </Button>
          <Button variant="ghost" className="text-muted-foreground hover:text-destructive hover:bg-destructive/5 rounded-full h-10 w-10 p-0" onClick={handleLogout}><LogOut size={20} /></Button>
        </div>
      </header>

      <main className="flex-1 p-6 lg:p-10 grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-[1600px] mx-auto w-full">
        <div className="lg:col-span-4 space-y-8">
          <Tabs defaultValue="actions" className="w-full">
            <TabsList className="w-full bg-secondary/50 p-1 rounded-2xl border border-primary/5">
              <TabsTrigger value="actions" className="flex-1 rounded-xl font-bold uppercase text-[10px] tracking-widest">{t.actions}</TabsTrigger>
              <TabsTrigger value="delegates" className="flex-1 rounded-xl font-bold uppercase text-[10px] tracking-widest">{t.countries}</TabsTrigger>
              <TabsTrigger value="stats" className="flex-1 rounded-xl font-bold uppercase text-[10px] tracking-widest">{t.stats}</TabsTrigger>
            </TabsList>
            
            <TabsContent value="actions" className="space-y-8 mt-6 animate-in fade-in duration-300">
              <Card className="rounded-3xl border-primary/10 glass-card">
                <CardHeader className="pb-4"><CardTitle className="text-lg font-black uppercase tracking-tight text-gradient">{t.newAction}</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">{t.title}</Label>
                    <Input value={newAction.title} onChange={e => setNewAction({...newAction, title: e.target.value})} placeholder="..." className="rounded-xl border-primary/10" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1"><Label className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">{t.duration}</Label><Input type="number" value={newAction.duration} onChange={e => setNewAction({...newAction, duration: parseInt(e.target.value)})} className="rounded-xl border-primary/10" /></div>
                    <div className="space-y-1"><Label className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">{t.speakingTime}</Label><Input value={newAction.timePerDelegate} onChange={e => setNewAction({...newAction, timePerDelegate: e.target.value})} placeholder="1:00" className="rounded-xl border-primary/10" /></div>
                  </div>
                  <div className="flex items-center space-x-3 p-4 border border-primary/5 rounded-2xl bg-primary/[0.02]">
                    <Checkbox id="participation" checked={newAction.allowParticipation} onCheckedChange={(checked) => setNewAction({...newAction, allowParticipation: !!checked})} className="rounded-md" />
                    <Label htmlFor="participation" className="text-xs font-bold text-foreground/70 cursor-pointer">{t.allowOptional}</Label>
                  </div>
                  <Button className="w-full bg-primary hover:bg-primary/90 h-12 rounded-xl font-bold uppercase tracking-widest text-xs" onClick={createAction}>{t.launchAction}</Button>
                </CardContent>
              </Card>

              {currentAction && currentAction.status !== 'completed' && (
                <Card className="rounded-3xl border-primary/20 shadow-2xl glass-card overflow-hidden">
                  <CardHeader className="bg-primary/[0.03] border-b border-primary/5 pb-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <Badge className="bg-primary/10 text-primary border-primary/20 uppercase text-[9px] font-black tracking-widest px-2 mb-2">{currentAction.status}</Badge>
                        <CardTitle className="text-2xl font-black uppercase tracking-tight text-gradient break-words leading-none">{currentAction.title}</CardTitle>
                      </div>
                      <div className="flex items-center gap-1 bg-white p-1 rounded-xl shadow-inner border border-primary/10">
                        <Input type="number" className="w-12 h-8 border-none p-1 text-center font-bold text-xs" value={customMinutes} onChange={(e) => setCustomMinutes(e.target.value)} />
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-primary hover:bg-primary/5 rounded-lg" onClick={() => extendTime(parseInt(customMinutes))}><Plus size={16} /></Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-8 space-y-8">
                    <GlobalTimer status={currentAction.status} startedAt={currentAction.started_at} pausedAt={currentAction.paused_at} totalElapsedSeconds={currentAction.total_elapsed_seconds} durationMinutes={currentAction.duration_minutes} />
                    <div className="grid grid-cols-2 gap-4">
                      {(currentAction.status === 'launched' || currentAction.status === 'paused') ? (
                        <Button className="bg-primary hover:bg-primary/90 h-14 rounded-2xl gap-3 text-sm font-black uppercase tracking-widest shadow-lg shadow-primary/20" onClick={startTimer}><Play size={18} fill="currentColor" /> {t.start}</Button>
                      ) : (
                        <Button variant="outline" className="border-amber-400 text-amber-600 hover:bg-amber-50 h-14 rounded-2xl gap-3 text-sm font-black uppercase tracking-widest" onClick={pauseTimer}><Pause size={18} fill="currentColor" /> {t.pause}</Button>
                      )}
                      <Button variant="destructive" className="h-14 rounded-2xl gap-3 text-sm font-black uppercase tracking-widest shadow-lg shadow-destructive/20" onClick={stopAction}><Square size={18} fill="currentColor" /> {t.stop}</Button>
                    </div>

                    <div className="pt-6 border-t border-primary/5 space-y-6">
                      <div className="flex justify-between items-center">
                        <h3 className="font-black text-[10px] text-primary uppercase tracking-[0.2em] flex items-center gap-2"><Timer size={14} /> {t.speakerChrono}</h3>
                        <Badge variant="outline" className="text-[10px] font-bold border-primary/10 bg-primary/5">{currentAction.time_per_delegate}</Badge>
                      </div>
                      <div className="flex justify-center">
                        <SpeakingTimer 
                          status={currentAction.speaking_timer_status} 
                          startedAt={currentAction.speaking_timer_started_at} 
                          totalElapsedSeconds={currentAction.speaking_timer_total_elapsed || 0} 
                          limitSeconds={parseTimePerDelegate(currentAction.time_per_delegate)} 
                          size="md" 
                        />
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        {currentAction.speaking_timer_status === 'started' ? (
                          <Button variant="outline" size="sm" className="border-amber-400 text-amber-600 h-10 rounded-xl font-bold uppercase text-[10px]" onClick={pauseSpeakingTimer}><Pause size={14} /> {t.pause}</Button>
                        ) : (
                          <Button variant="secondary" size="sm" className="bg-primary/10 text-primary hover:bg-primary/20 h-10 rounded-xl font-bold uppercase text-[10px]" onClick={startSpeakingTimer}><Play size={14} /> {t.start}</Button>
                        )}
                        <Button variant="ghost" size="sm" className="border border-primary/10 h-10 rounded-xl font-bold uppercase text-[10px]" onClick={resetSpeakingTimer}>Reset</Button>
                        <Button variant="outline" size="sm" className="border-green-500/30 text-green-600 hover:bg-green-50 h-10 rounded-xl font-bold uppercase text-[10px]" onClick={() => handleMarkAsSpoken(orateursInscrits[0]?.id)} disabled={!orateursInscrits[0]}><Check size={14} /></Button>
                      </div>
                    </div>

                    <div className="space-y-4 pt-6 border-t border-primary/5">
                      <h3 className="font-black text-[10px] text-primary uppercase tracking-[0.2em] flex items-center justify-between">
                        <span className="flex items-center gap-2"><ListOrdered size={14} /> {t.speakersList}</span>
                        <Badge className="bg-primary rounded-lg text-[10px]">{orateursInscrits.length}</Badge>
                      </h3>
                      <ScrollArea className="h-[200px] rounded-2xl border border-primary/5 bg-primary/[0.01] p-3">
                        <div className="space-y-2">
                          {orateursInscrits.length > 0 ? orateursInscrits.map((p, i) => (
                            <div key={i} className="flex justify-between items-center p-4 bg-white border border-primary/5 rounded-xl shadow-sm group hover:border-primary/20 transition-all">
                              <span className="font-bold text-sm text-foreground/80">{i + 1}. {p.country_name}</span>
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-green-600 hover:bg-green-50 rounded-lg" onClick={() => handleMarkAsSpoken(p.id)}><Check size={16} /></Button>
                              </div>
                            </div>
                          )) : (
                            <div className="text-center py-12 text-muted-foreground text-xs italic opacity-50">{t.noSpeaker}</div>
                          )}
                        </div>
                      </ScrollArea>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="delegates" className="space-y-8 mt-6 animate-in fade-in duration-300">
              <Card className="rounded-3xl border-primary/10 glass-card">
                <CardHeader className="pb-3 flex flex-row items-center gap-3"><UserPlus size={20} className="text-primary" /><CardTitle className="text-lg font-black uppercase tracking-tight text-gradient">{t.addCountry}</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2"><Label className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">{t.countryName}</Label><Input value={newDelegate.name} onChange={e => setNewDelegate({...newDelegate, name: e.target.value})} placeholder="..." className="rounded-xl border-primary/10 h-11" /></div>
                  <div className="space-y-2"><Label className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">{t.password}</Label><Input value={newDelegate.password} onChange={e => setNewDelegate({...newDelegate, password: e.target.value})} placeholder="..." className="rounded-xl border-primary/10 h-11" /></div>
                  <Button className="w-full bg-primary h-11 rounded-xl font-bold uppercase tracking-widest text-[10px]" onClick={handleAddDelegate}>{t.addToList}</Button>
                </CardContent>
              </Card>
              <Card className="rounded-3xl border-primary/10 glass-card">
                <CardHeader><CardTitle className="text-lg font-black uppercase tracking-tight text-gradient">{t.registeredDelegates} ({delegates.length})</CardTitle></CardHeader>
                <CardContent>
                  <ScrollArea className="h-[450px]">
                    <div className="space-y-3">
                      {delegates.map(d => (
                        <div key={d.id} className={`flex justify-between items-center p-4 rounded-2xl border transition-all duration-300 ${d.is_suspended ? 'bg-destructive/5 border-destructive/20' : 'bg-white border-primary/5 shadow-sm hover:shadow-md'}`}>
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm text-foreground/80">{d.country_name}</span>
                              {d.is_suspended && <Badge variant="destructive" className="h-4 text-[8px] px-1 uppercase font-black"><ShieldAlert size={10} className="mr-0.5" /> {lang === 'fr' ? 'Suspendu' : 'Suspended'}</Badge>}
                            </div>
                            <span className="text-[9px] text-muted-foreground font-mono uppercase tracking-widest mt-1 opacity-60">Pass: {d.password}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon" className={`h-8 w-8 rounded-lg ${d.is_suspended ? 'text-green-600 hover:bg-green-50' : 'text-amber-600 hover:bg-amber-50'}`} onClick={() => toggleDelegateSuspension(d.id, d.is_suspended)}>{d.is_suspended ? <ShieldOff size={16} /> : <ShieldAlert size={16} />}</Button>
                            <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/5 h-8 w-8 rounded-lg" onClick={() => deleteDocumentNonBlocking(doc(db!, 'committees', committeeId, 'delegates', d.id))}><Trash2 size={16} /></Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="stats" className="space-y-8 mt-6 animate-in fade-in duration-300">
              <Card className="rounded-3xl border-primary/10 glass-card">
                <CardHeader className="flex flex-row items-center gap-3"><Award size={20} className="text-primary" /><CardTitle className="text-lg font-black uppercase tracking-tight text-gradient">{t.gradingTitle}</CardTitle></CardHeader>
                <CardContent className="px-2">
                  <div className="px-4 mb-6"><Button onClick={handleCalculateRanks} className="w-full bg-primary hover:bg-primary/90 rounded-2xl h-14 font-black uppercase tracking-widest text-xs gap-3 shadow-lg shadow-primary/20"><Calculator size={18} /> {t.calculate}</Button></div>
                  <ScrollArea className="h-[600px]">
                    <div className="space-y-8 p-4">
                      {displayGradedDelegates.map((d, index) => (
                        <div key={d.id} className="p-6 border border-primary/5 rounded-3xl bg-white shadow-sm relative group hover:shadow-md transition-all">
                          <div className="flex justify-between items-center mb-6">
                            <div className="flex items-center gap-4">
                              <span className="h-10 w-10 bg-primary/5 text-primary rounded-2xl flex items-center justify-center font-black text-sm border border-primary/10 shadow-inner">{index + 1}</span>
                              <span className="font-black uppercase tracking-tight text-sm text-foreground/80">{d.country_name}</span>
                            </div>
                            <div className="flex flex-col items-end">
                              <span className="text-[9px] font-black text-primary uppercase tracking-[0.2em] mb-1">{t.average}</span>
                              <span className={`text-2xl font-black tabular-nums leading-none ${d.average >= 7 ? 'text-green-600' : d.average >= 4 ? 'text-amber-600' : 'text-red-600'}`}>{d.average.toFixed(1)}/10</span>
                            </div>
                          </div>
                          <div className="grid grid-cols-1 gap-4">
                            <div className="space-y-2"><Label className="text-[9px] uppercase font-black tracking-widest text-muted-foreground">{t.speaking}</Label><Input type="number" min="0" max="10" step="0.5" className="h-10 text-xs font-black rounded-xl border-primary/10 bg-primary/[0.01]" value={d.grades.speaking} onChange={(e) => handleUpdateGrade(d.id, 'speaking', Number(e.target.value))} /></div>
                            <div className="space-y-2"><Label className="text-[9px] uppercase font-black tracking-widest text-muted-foreground">{t.diplomacy}</Label><Input type="number" min="0" max="10" step="0.5" className="h-10 text-xs font-black rounded-xl border-primary/10 bg-primary/[0.01]" value={d.grades.diplomacy} onChange={(e) => handleUpdateGrade(d.id, 'diplomacy', Number(e.target.value))} /></div>
                            <div className="space-y-2"><Label className="text-[9px] uppercase font-black tracking-widest text-muted-foreground">{t.knowledge}</Label><Input type="number" min="0" max="10" step="0.5" className="h-10 text-xs font-black rounded-xl border-primary/10 bg-primary/[0.01]" value={d.grades.knowledge} onChange={(e) => handleUpdateGrade(d.id, 'knowledge', Number(e.target.value))} /></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
              <Card className="rounded-3xl border-primary/10 glass-card overflow-hidden">
                <CardHeader className="flex flex-row items-center gap-3"><BarChart3 size={20} className="text-primary" /><CardTitle className="text-lg font-black uppercase tracking-tight text-gradient">{t.participationStats}</CardTitle></CardHeader>
                <CardContent className="h-[350px] pt-4">
                  {statsData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={statsData} layout="vertical">
                        <XAxis type="number" hide />
                        <YAxis dataKey="name" type="category" width={100} fontSize={10} tick={{ fill: 'currentColor', fontWeight: 700 }} />
                        <RechartsTooltip 
                          cursor={{ fill: 'rgba(4, 89, 171, 0.05)' }}
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              return (
                                <div className="bg-white/95 backdrop-blur-md border border-primary/10 p-3 rounded-2xl shadow-2xl text-xs">
                                  <p className="font-black text-primary uppercase mb-1">{payload[0].payload.name}</p>
                                  <p className="font-bold text-muted-foreground">{payload[0].value} intervention(s)</p>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Bar dataKey="count" radius={[0, 8, 8, 0]} barSize={24}>
                          {statsData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={index % 2 === 0 ? 'hsl(var(--primary))' : 'rgba(4, 89, 171, 0.5)'} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : <div className="h-full flex flex-col items-center justify-center text-muted-foreground italic opacity-50">{lang === 'fr' ? 'Données d\'activité insuffisantes' : 'Insufficient activity data'}</div>}
                </CardContent>
              </Card>
              <Card className="rounded-3xl border-primary/10 glass-card">
                <CardHeader className="flex flex-row items-center gap-3"><History size={20} className="text-muted-foreground" /><CardTitle className="text-lg font-black uppercase tracking-tight text-gradient">{t.actionsHistory}</CardTitle></CardHeader>
                <CardContent className="px-4">
                  <ScrollArea className="h-[300px]">
                    <div className="space-y-3">
                      {allActions.map(action => (
                        <div key={action.id} className="flex justify-between items-center p-4 bg-white border border-primary/5 rounded-2xl text-xs shadow-sm hover:shadow-md transition-all">
                          <div className="flex flex-col gap-1.5">
                            <span className="font-black uppercase text-foreground/80 tracking-tight break-words">{action.title}</span>
                            <div className="flex gap-2">
                              <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest border-primary/10 text-primary/70">{action.status}</Badge>
                            </div>
                          </div>
                          <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/5 h-9 w-9 rounded-xl" onClick={() => handleDeleteAction(action.id)}><Trash2 size={16} /></Button>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <div className="lg:col-span-8 space-y-8">
          <Tabs defaultValue="resolutions" className="w-full">
            <TabsList className="w-full bg-secondary/50 p-1 rounded-2xl border border-primary/5">
              <TabsTrigger value="resolutions" className="flex-1 rounded-xl font-bold uppercase text-[10px] tracking-widest">{t.resolutionsTab}</TabsTrigger>
              <TabsTrigger value="messages" className="flex-1 relative rounded-xl font-bold uppercase text-[10px] tracking-widest">{t.messagesTab}{unreadMessagesCount > 0 && <Badge variant="destructive" className="ml-2 h-5 w-5 p-0 flex items-center justify-center rounded-full text-[9px] font-black border-none animate-pulse">{unreadMessagesCount}</Badge>}</TabsTrigger>
              <TabsTrigger value="gossip" className="flex-1 relative rounded-xl font-bold uppercase text-[10px] tracking-widest">{t.gossipTab}{gossipMessages.length > 0 && <Badge className="ml-2 h-5 w-5 p-0 flex items-center justify-center rounded-full text-[9px] font-black bg-primary text-white border-none">{gossipMessages.length}</Badge>}</TabsTrigger>
            </TabsList>
            
            <TabsContent value="resolutions" className="space-y-8 mt-6 animate-in fade-in duration-300">
              <Card className="rounded-3xl border-primary/10 glass-card overflow-hidden">
                <CardHeader className="bg-primary/[0.02] border-b border-primary/5 flex flex-row items-center justify-between py-6">
                  <CardTitle className="flex items-center gap-3 text-2xl font-black uppercase tracking-tight text-gradient"><FileText className="text-primary" /> {t.resolutionsSubmitted}</CardTitle>
                  <Badge variant="outline" className="h-8 w-8 rounded-xl flex items-center justify-center p-0 font-black border-primary/20 text-primary">{resolutions.length}</Badge>
                </CardHeader>
                <CardContent className="p-8 space-y-8">
                  {resolutions.map(res => (
                    <Card key={res.id} className={`overflow-hidden rounded-3xl border-2 transition-all duration-500 ${res.is_displayed ? 'border-primary shadow-2xl scale-[1.01]' : 'border-primary/5 shadow-sm'}`}>
                      <div className="bg-muted/30 p-5 flex justify-between items-center border-b border-primary/5">
                        <div className="flex items-center gap-3">
                          <span className="font-black text-primary uppercase tracking-tight text-lg break-words">{res.title || "Projet Anonyme"}</span>
                          {res.is_displayed && <Badge className="bg-primary animate-pulse rounded-lg text-[9px] font-black tracking-widest px-3"><Monitor className="h-3 w-3 mr-1" /> {lang === 'fr' ? 'PROJECTÉ' : 'PROJECTED'}</Badge>}
                        </div>
                        <Badge variant={res.status === 'approved' ? 'default' : res.status === 'rejected' ? 'destructive' : 'secondary'} className="uppercase font-black text-[9px] tracking-widest px-3">{res.status?.toUpperCase()}</Badge>
                      </div>
                      <CardContent className="p-8 space-y-6">
                        <div className="flex flex-wrap gap-2 items-center mb-6">
                          <Badge className="bg-primary/5 text-primary border-primary/10 rounded-lg py-1.5 px-3 text-[10px] font-black uppercase tracking-widest">DE: {res.proposing_country}</Badge>
                          {res.spokesperson && <Badge className="bg-secondary text-foreground/70 border-primary/5 rounded-lg py-1.5 px-3 text-[10px] font-black uppercase tracking-widest gap-1.5"><User size={12} /> {t.spokesperson}: {res.spokesperson}</Badge>}
                          {res.sponsors && <Badge className="bg-muted text-muted-foreground border-primary/5 rounded-lg py-1.5 px-3 text-[10px] font-black uppercase tracking-widest gap-1.5"><Users size={12} /> {t.sponsors}: {res.sponsors}</Badge>}
                        </div>
                        <div className="text-base leading-relaxed whitespace-pre-wrap break-words prose prose-slate max-w-none text-left font-medium text-foreground/80 p-6 bg-primary/[0.01] rounded-2xl border border-primary/5" dangerouslySetInnerHTML={{ __html: res.content }} />
                        <div className="flex gap-3 justify-end pt-6 border-t border-primary/5">
                          <Button variant={res.is_displayed ? "default" : "outline"} size="sm" className={`rounded-xl font-bold uppercase text-[10px] px-6 h-10 ${res.is_displayed ? 'bg-primary' : 'border-primary/20 text-primary hover:bg-primary/5'}`} onClick={() => updateDocumentNonBlocking(doc(db!, 'committees', committeeId, 'resolutions', res.id), { is_displayed: !res.is_displayed })}>{res.is_displayed ? <><EyeOff size={16} className="mr-2" /> {t.hide}</> : <><Eye size={16} className="mr-2" /> {t.show}</>}</Button>
                          <Button variant="outline" size="sm" className="border-green-500/30 text-green-600 hover:bg-green-50 rounded-xl font-bold uppercase text-[10px] px-6 h-10" onClick={() => updateDocumentNonBlocking(doc(db!, 'committees', committeeId, 'resolutions', res.id), { status: 'approved' })}><CheckCircle size={16} className="mr-2" /> {t.approve}</Button>
                          <Button variant="outline" size="sm" className="border-red-500/30 text-red-600 hover:bg-green-50 rounded-xl font-bold uppercase text-[10px] px-6 h-10" onClick={() => updateDocumentNonBlocking(doc(db!, 'committees', committeeId, 'resolutions', res.id), { status: 'rejected' })}><XCircle size={16} className="mr-2" /> {t.reject}</Button>
                          <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/5 rounded-xl h-10 w-10 p-0" onClick={() => deleteDocumentNonBlocking(doc(db!, 'committees', committeeId, 'resolutions', res.id))}><Trash2 size={16} /></Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="messages" className="space-y-8 mt-6 animate-in fade-in duration-300">
              <Card className="rounded-3xl border-primary/10 glass-card overflow-hidden">
                <CardHeader className="bg-primary/[0.02] border-b border-primary/5 py-6"><CardTitle className="flex items-center gap-3 text-2xl font-black uppercase tracking-tight text-gradient"><Bell size={24} className="text-primary" /> {t.privateInbox}</CardTitle></CardHeader>
                <CardContent className="p-0">
                  <ScrollArea className="h-[700px]">
                    <div className="p-8 space-y-6">
                      {messages.filter(m => m.type !== 'gossip').map(msg => (
                        <div key={msg.id} className={`p-6 border-l-8 rounded-3xl shadow-sm flex flex-col gap-4 transition-all duration-300 hover:shadow-md ${msg.is_read ? 'bg-muted/20 border-muted-foreground/30 opacity-70' : 'bg-primary/[0.02] border-primary shadow-primary/5'}`}>
                          <div className="flex justify-between items-start">
                            <div className="flex items-center gap-4">
                              <Badge className={`uppercase text-[9px] font-black tracking-widest px-3 py-1 rounded-full border-none shadow-sm ${msg.type === 'privilege' ? 'bg-destructive text-white' : 'bg-secondary text-primary'}`}>{msg.type}</Badge>
                              <span className="font-black uppercase tracking-tight text-sm text-foreground/80">{msg.sender_country}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              {!msg.is_read && <Button size="icon" variant="ghost" className="h-10 w-10 text-green-600 hover:bg-green-50 rounded-xl shadow-sm border border-green-100" onClick={() => markMessageAsRead(msg.id)}><Check size={18} /></Button>}
                              <Button size="icon" variant="ghost" className="h-10 w-10 text-destructive hover:bg-destructive/5 rounded-xl border border-destructive/5" onClick={() => deleteMessage(msg.id)}><Trash2 size={18} /></Button>
                            </div>
                          </div>
                          <p className="text-base font-semibold text-foreground/80 leading-relaxed whitespace-pre-wrap pl-2 italic">"{msg.content}"</p>
                          <div className="flex justify-end opacity-40 text-[9px] font-black uppercase tracking-[0.2em]">{msg.timestamp?.toDate ? new Date(msg.timestamp.toDate()).toLocaleTimeString() : "Maintenant"}</div>
                        </div>
                      ))}
                      {messages.filter(m => m.type !== 'gossip').length === 0 && (
                        <div className="text-center py-40 opacity-30 flex flex-col items-center gap-6">
                          <MessageSquareOff size={64} />
                          <p className="text-lg font-black uppercase tracking-widest">{t.noMessage}</p>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="gossip" className="space-y-8 mt-6 animate-in fade-in duration-300">
              <Card className="rounded-3xl border-primary/10 glass-card overflow-hidden">
                <CardHeader className="bg-primary/[0.02] border-b border-primary/5 py-6"><CardTitle className="flex items-center gap-3 text-2xl font-black uppercase tracking-tight text-gradient"><Ghost size={24} className="text-primary" /> {t.gossipBoxTitle}</CardTitle></CardHeader>
                <CardContent className="p-0">
                  <ScrollArea className="h-[700px]">
                    <div className="p-8 space-y-6">
                      {gossipMessages.map(msg => (
                        <div key={msg.id} className="p-6 border-l-8 border-primary rounded-3xl shadow-sm flex flex-col gap-4 transition-all duration-300 hover:shadow-md bg-primary/[0.02]">
                          <div className="flex justify-between items-start">
                            <Badge className="bg-primary text-white uppercase text-[9px] font-black tracking-widest px-3 py-1 rounded-full border-none shadow-sm">GOSSIP ANONYME</Badge>
                            <div className="flex items-center gap-2">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="rounded-xl font-bold uppercase text-[10px] px-6 h-10 border-primary/20 text-primary hover:bg-primary/5"
                                onClick={() => {
                                  const sessionRef = doc(db!, 'committees', committeeId, 'sessionState', 'current');
                                  setDocumentNonBlocking(sessionRef, { activeOverlay: { type: 'message', title: msg.content, status: 'active' } }, { merge: true });
                                  toast({ title: t.messageDisplayed });
                                }}
                              >
                                <Eye size={16} className="mr-2" /> {t.show}
                              </Button>
                              <Button size="icon" variant="ghost" className="h-10 w-10 text-destructive hover:bg-destructive/5 rounded-xl border border-destructive/5" onClick={() => deleteMessage(msg.id)}><Trash2 size={18} /></Button>
                            </div>
                          </div>
                          <p className="text-base font-semibold text-foreground/80 leading-relaxed whitespace-pre-wrap pl-2 italic">"{msg.content}"</p>
                          <div className="flex justify-end opacity-40 text-[9px] font-black uppercase tracking-[0.2em]">{msg.timestamp?.toDate ? new Date(msg.timestamp.toDate()).toLocaleTimeString() : "Maintenant"}</div>
                        </div>
                      ))}
                      {gossipMessages.length === 0 && (
                        <div className="text-center py-40 opacity-30 flex flex-col items-center gap-6">
                          <Ghost size={64} />
                          <p className="text-lg font-black uppercase tracking-widest">{t.noGossip}</p>
                        </div>
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
