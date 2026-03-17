"use client"

import { useState, useEffect, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Play, Pause, Square, LogOut, FileText, Eye, EyeOff, CheckCircle, XCircle, ListOrdered, Clock, Timer, MessageSquareOff, MessageSquare, Plus, Trash2, Bell, Check, Stars, X, ThumbsUp, ThumbsDown, CircleSlash, BarChart3, UserPlus, History, ShieldOff, ShieldAlert, User, Monitor, Users, AlertTriangle, Languages, Award, Calculator, TrendingUp } from 'lucide-react';
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
  const { isSuspended, allowResolutions, currentAction, activeOverlay } = useRealtime(committeeId);
  
  const committeeRef = useMemoFirebase(() => db ? doc(db, 'committees', committeeId) : null, [db, committeeId]);
  const { data: committee } = useDoc(committeeRef);

  const lang = committee?.language || 'fr';
  const t = {
    fr: {
      presidency: "Présidence",
      specialAction: "Action Spéciale",
      crisisMode: "Mode Crise Actif",
      voteLaunched: "Vote lancé",
      crisisTriggered: "CRISE DÉCLENCHÉE",
      messageDisplayed: "Message affiché",
      resolutionsAllowed: "Résolutions autorisées",
      resolutionsBlocked: "Résolutions bloquées",
      resume: "Reprendre",
      suspend: "Suspendre",
      newAction: "Nouvelle Action",
      title: "Titre",
      duration: "Durée (min)",
      speakingTime: "Temps de parole",
      allowOptional: "Autoriser participation facultative",
      launchAction: "Lancer l'Action",
      start: "Démarrer",
      pause: "Pause",
      stop: "Arrêter",
      speakerChrono: "Chrono Orateur",
      speakersList: "Liste des Orateurs",
      noSpeaker: "Aucun orateur",
      addCountry: "Ajouter un Pays",
      countryName: "Nom du Pays",
      password: "Mot de passe",
      addToList: "Ajouter à la liste",
      registeredDelegates: "Délégués Enregistrés",
      participationStats: "Participations aux Débats",
      actionsHistory: "Historique des Actions",
      resolutionsSubmitted: "Resolutions Soumises",
      privateInbox: "Boîte de réception Privée",
      noResolution: "Aucune résolution soumise",
      noMessage: "Aucun message",
      approve: "Approuver",
      reject: "Rejeter",
      hide: "Masquer",
      show: "Afficher",
      spokesperson: "Porte-parole",
      sponsors: "Sponsors",
      specialTitle: "Annonce, Vote ou Crise",
      overlayType: "Type d'affichage",
      overlaySubject: "Titre / Sujet",
      crisisSubject: "Sujet de la Crise",
      launchEverywhere: "Lancer sur tous les écrans",
      launchCrisis: "Lancer la Crise",
      auth: "Authentification...",
      actions: "Actions",
      countries: "Pays",
      stats: "Stats & Notation",
      resolutionsTab: "Projets de Résolution",
      messagesTab: "Messages Privés",
      gradingTitle: "Notation des Délégués",
      speaking: "Prise de parole",
      diplomacy: "Diplomatie & participation",
      knowledge: "Connaissance & cohérence",
      average: "Moyenne",
      rank: "Rang",
      saveGrade: "Note enregistrée",
      calculate: "Calculer le classement",
      markAsSpoken: "A déjà parlé"
    },
    en: {
      presidency: "Presidency",
      specialAction: "Special Action",
      crisisMode: "Crisis Mode Active",
      voteLaunched: "Vote launched",
      crisisTriggered: "CRISIS TRIGGERED",
      messageDisplayed: "Message displayed",
      resolutionsAllowed: "Resolutions allowed",
      resolutionsBlocked: "Resolutions blocked",
      resume: "Resume",
      suspend: "Suspend",
      newAction: "New Action",
      title: "Title",
      duration: "Duration (min)",
      speakingTime: "Speaking time",
      allowOptional: "Allow optional participation",
      launchAction: "Launch Action",
      start: "Start",
      pause: "Pause",
      stop: "Stop",
      speakerChrono: "Speaker Timer",
      speakersList: "Speakers List",
      noSpeaker: "No speaker",
      addCountry: "Add Country",
      countryName: "Country Name",
      password: "Password",
      addToList: "Add to list",
      registeredDelegates: "Registered Delegates",
      participationStats: "Debate Participation",
      actionsHistory: "Actions History",
      resolutionsSubmitted: "Submitted Resolutions",
      privateInbox: "Private Inbox",
      noResolution: "No resolution submitted",
      noMessage: "No message",
      approve: "Approve",
      reject: "Reject",
      hide: "Hide",
      show: "Show",
      spokesperson: "Spokesperson",
      sponsors: "Sponsors",
      specialTitle: "Announcement, Vote or Crisis",
      overlayType: "Display Type",
      overlaySubject: "Title / Subject",
      crisisSubject: "Crisis Subject",
      launchEverywhere: "Launch on all screens",
      launchCrisis: "Launch Crisis",
      auth: "Authentication...",
      actions: "Actions",
      countries: "Countries",
      stats: "Stats & Grading",
      resolutionsTab: "Draft Resolutions",
      messagesTab: "Private Messages",
      gradingTitle: "Delegate Grading",
      speaking: "Speaking",
      diplomacy: "Diplomacy & Participation",
      knowledge: "Knowledge & Coherence",
      average: "Average",
      rank: "Rank",
      saveGrade: "Grade saved",
      calculate: "Calculate Ranking",
      markAsSpoken: "Has spoken"
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
      setResolutions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const messagesRef = collection(db, 'committees', committeeId, 'messages');
    const unsubMessages = onSnapshot(query(messagesRef, orderBy('timestamp', 'desc')), (snapshot) => {
      setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
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

      // Identifier les IDs déjà présents
      const existingIds = new Set(prev.map(p => p.id));
      
      // Filtrer pour garder uniquement ceux qui existent encore dans currentDelegatesData
      const currentIds = new Set(currentDelegatesData.map(d => d.id));
      const updatedPrev = prev
        .filter(p => currentIds.has(p.id))
        .map(p => {
          const updated = currentDelegatesData.find(d => d.id === p.id);
          return updated || p;
        });

      // Ajouter les nouveaux délégués
      const newDelegates = currentDelegatesData.filter(d => !existingIds.has(d.id));
      
      return [...updatedPrev, ...newDelegates];
    });
  }, [delegates]);

  const handleCalculateRanks = () => {
    const sorted = [...displayGradedDelegates].sort((a, b) => b.average - a.average);
    setDisplayGradedDelegates(sorted);
    toast({ title: t.calculate + " : OK" });
  };

  const statsData = useMemo(() => {
    const counts: Record<string, number> = {};
    delegates.forEach(d => { counts[d.country_name] = 0; });
    allParticipations.forEach(p => {
      if (p.status === 'participating' && counts[p.country_name] !== undefined) counts[p.country_name]++;
    });
    return Object.entries(counts).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
  }, [allParticipations, delegates]);

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
  };

  const handleLogout = async () => {
    if (!auth) return;
    await signOut(auth);
    router.push('/');
  };

  if (isUserLoading) return <div className="min-h-screen flex items-center justify-center font-bold uppercase tracking-widest animate-pulse">{t.auth}</div>;

  const orateursInscrits = participants;
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
          <h1 className="text-xl font-bold font-headline uppercase tracking-widest">{committee?.name || "Comité"} - {t.presidency}</h1>
          {isSuspended && <Badge variant="destructive" className="animate-pulse">{lang === 'fr' ? 'SÉANCE SUSPENDUE' : 'SESSION SUSPENDED'}</Badge>}
          {activeOverlay?.type === 'crisis' && <Badge variant="destructive" className="bg-red-600 animate-bounce uppercase font-black px-4 shadow-2xl">{t.crisisMode}</Badge>}
        </div>
        <div className="flex items-center gap-6">
          <Dialog open={isOverlayDialogOpen} onOpenChange={setIsOverlayDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-amber-500 hover:bg-amber-600 font-bold gap-2"><Stars size={18} /> {t.specialAction}</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{t.specialTitle}</DialogTitle></DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>{t.overlayType}</Label>
                  <Select value={overlayForm.type} onValueChange={(val) => setOverlayForm({...overlayForm, type: val})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="message">{lang === 'fr' ? 'Message à afficher' : 'Message to display'}</SelectItem>
                      <SelectItem value="vote">{lang === 'fr' ? 'Procédure de vote' : 'Voting procedure'}</SelectItem>
                      <SelectItem value="crisis" className="text-red-600 font-bold">🚨 {lang === 'fr' ? 'CRISE (Écran rouge + Alarme)' : 'CRISIS (Red screen + Alarm)'}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{overlayForm.type === 'crisis' ? t.crisisSubject : t.overlaySubject}</Label>
                  <Input placeholder={overlayForm.type === 'crisis' ? (lang === 'fr' ? "Situation d'urgence..." : "Emergency situation...") : "..."} value={overlayForm.title} onChange={(e) => setOverlayForm({...overlayForm, title: e.target.value})} />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={launchOverlay} className={overlayForm.type === 'crisis' ? "bg-red-600 hover:bg-red-700 w-full font-black uppercase" : "bg-primary w-full"}>
                  {overlayForm.type === 'crisis' ? t.launchCrisis : t.launchEverywhere}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {activeOverlay && activeOverlay.type !== 'none' && (
            <div className="flex items-center gap-4 bg-white/10 px-4 py-1.5 rounded-full border border-white/20 animate-in fade-in zoom-in duration-300">
              <span className="text-xs font-bold uppercase tracking-widest truncate max-w-[150px]">{activeOverlay.title}</span>
              {activeOverlay.type === 'vote' && (
                <div className="flex gap-2 ml-2 border-l border-white/20 pl-4 items-center">
                  <div className="flex items-center gap-1 bg-green-500/20 px-2 py-0.5 rounded border border-green-500/30">
                    <ThumbsUp size={12} className="text-green-400" /><span className="font-bold tabular-nums text-xs">{activeOverlay.results?.pour || 0}</span>
                  </div>
                  <div className="flex items-center gap-1 bg-red-500/20 px-2 py-0.5 rounded border border-red-500/30">
                    <ThumbsDown size={12} className="text-red-400" /><span className="font-bold tabular-nums text-xs">{activeOverlay.results?.contre || 0}</span>
                  </div>
                  <div className="flex items-center gap-1 bg-yellow-500/20 px-2 py-0.5 rounded border border-yellow-500/30">
                    <CircleSlash size={12} className="text-yellow-400" /><span className="font-bold tabular-nums text-xs">{activeOverlay.results?.abstention || 0}</span>
                  </div>
                </div>
              )}
              <Button variant="ghost" size="icon" className="h-6 w-6 text-white hover:bg-white/20 ml-2" onClick={stopOverlay}><X size={14} /></Button>
            </div>
          )}

          <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-full border border-white/20">
            {allowResolutions ? <MessageSquare size={16} /> : <MessageSquareOff size={16} />}
            <span className="text-xs font-bold uppercase tracking-tighter">Res.</span>
            <Switch checked={allowResolutions} onCheckedChange={toggleResolutions} className="data-[state=checked]:bg-green-500" />
          </div>
          <div className="h-6 w-px bg-white/20" />
          <Button variant="destructive" onClick={toggleSuspension}>{isSuspended ? t.resume : t.suspend}</Button>
          <Button variant="ghost" className="text-white hover:bg-white/10" onClick={handleLogout}><LogOut size={20} /></Button>
        </div>
      </header>

      <main className="flex-1 p-6 grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-[1600px] mx-auto w-full">
        <div className="lg:col-span-4 space-y-6">
          <Tabs defaultValue="actions">
            <TabsList className="w-full">
              <TabsTrigger value="actions" className="flex-1">{t.actions}</TabsTrigger>
              <TabsTrigger value="delegates" className="flex-1">{t.countries}</TabsTrigger>
              <TabsTrigger value="stats" className="flex-1">{t.stats}</TabsTrigger>
            </TabsList>
            <TabsContent value="actions" className="space-y-6 mt-4">
              <Card>
                <CardHeader className="pb-4"><CardTitle className="text-lg">{t.newAction}</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>{t.title}</Label>
                    <Input value={newAction.title} onChange={e => setNewAction({...newAction, title: e.target.value})} placeholder="..." />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1"><Label className="text-[10px] uppercase">{t.duration}</Label><Input type="number" value={newAction.duration} onChange={e => setNewAction({...newAction, duration: parseInt(e.target.value)})} /></div>
                    <div className="space-y-1"><Label className="text-[10px] uppercase">{t.speakingTime}</Label><Input value={newAction.timePerDelegate} onChange={e => setNewAction({...newAction, timePerDelegate: e.target.value})} placeholder="1:00" /></div>
                  </div>
                  <div className="flex items-center space-x-2 p-2 border rounded-lg bg-muted/30">
                    <Checkbox id="participation" checked={newAction.allowParticipation} onCheckedChange={(checked) => setNewAction({...newAction, allowParticipation: !!checked})} />
                    <Label htmlFor="participation" className="text-sm cursor-pointer">{t.allowOptional}</Label>
                  </div>
                  <Button className="w-full bg-primary" onClick={createAction}>{t.launchAction}</Button>
                </CardContent>
              </Card>

              {currentAction && currentAction.status !== 'completed' && (
                <Card className="border-primary/20 shadow-lg">
                  <CardHeader className="bg-primary/5 pb-2">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <Badge className="mb-1">{currentAction.status.toUpperCase()}</Badge>
                        <CardTitle className="text-xl break-words">{currentAction.title}</CardTitle>
                      </div>
                      <div className="flex items-center gap-1 bg-white/50 p-1 rounded-lg border">
                        <Input type="number" className="w-12 h-8 p-1 text-center" value={customMinutes} onChange={(e) => setCustomMinutes(e.target.value)} />
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-primary" onClick={() => extendTime(parseInt(customMinutes))}><Plus size={16} /></Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6 space-y-6">
                    <GlobalTimer status={currentAction.status} startedAt={currentAction.started_at} pausedAt={currentAction.paused_at} totalElapsedSeconds={currentAction.total_elapsed_seconds} durationMinutes={currentAction.duration_minutes} />
                    <div className="grid grid-cols-2 gap-3">
                      {(currentAction.status === 'launched' || currentAction.status === 'paused') ? (
                        <Button className="bg-green-600 hover:bg-green-700 h-12 gap-2" onClick={startTimer}><Play size={18} fill="currentColor" /> {t.start}</Button>
                      ) : (
                        <Button variant="outline" className="border-amber-500 text-amber-600 h-12 gap-2" onClick={pauseTimer}><Pause size={18} fill="currentColor" /> {t.pause}</Button>
                      )}
                      <Button variant="destructive" className="h-12 gap-2" onClick={stopAction}><Square size={18} fill="currentColor" /> {t.stop}</Button>
                    </div>

                    <div className="pt-4 border-t space-y-4">
                      <div className="flex justify-between items-center">
                        <h3 className="font-bold text-[10px] text-muted-foreground uppercase flex items-center gap-2"><Timer size={14} /> {t.speakerChrono}</h3>
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
                      <div className="grid grid-cols-3 gap-2">
                        {currentAction.speaking_timer_status === 'started' ? (
                          <Button variant="outline" size="sm" className="border-amber-500 text-amber-600" onClick={pauseSpeakingTimer}><Pause size={14} /> {t.pause}</Button>
                        ) : (
                          <Button variant="secondary" size="sm" onClick={startSpeakingTimer}><Play size={14} /> {t.start}</Button>
                        )}
                        <Button variant="ghost" size="sm" className="border" onClick={resetSpeakingTimer}>Reset</Button>
                        <Button variant="outline" size="sm" onClick={() => handleMarkAsSpoken(orateursInscrits[0]?.id)} disabled={!orateursInscrits[0]}><Check size={14} /></Button>
                      </div>
                    </div>

                    <div className="space-y-3 pt-4 border-t">
                      <h3 className="font-bold text-sm text-muted-foreground uppercase flex items-center justify-between">
                        <span className="flex items-center gap-2"><ListOrdered size={14} /> {t.speakersList}</span>
                        <Badge variant="secondary">{orateursInscrits.length}</Badge>
                      </h3>
                      <ScrollArea className="h-[180px] border rounded-xl p-3 bg-muted/10">
                        {orateursInscrits.length > 0 ? orateursInscrits.map((p, i) => (
                          <div key={i} className="flex justify-between items-center p-3 mb-2 bg-white border rounded-lg shadow-sm">
                            <span className="font-bold text-sm">{i + 1}. {p.country_name}</span>
                            <div className="flex items-center gap-1">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-green-600 hover:bg-green-50" onClick={() => handleMarkAsSpoken(p.id)}><Check size={16} /></Button>
                                  </TooltipTrigger>
                                  <TooltipContent><p>{t.markAsSpoken}</p></TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                          </div>
                        )) : (
                          <div className="text-center py-10 text-muted-foreground text-xs italic">{t.noSpeaker}</div>
                        )}
                      </ScrollArea>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="delegates" className="space-y-6 mt-4">
              <Card>
                <CardHeader className="pb-3 flex flex-row items-center gap-2"><UserPlus size={18} className="text-secondary" /><CardTitle className="text-lg">{t.addCountry}</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2"><Label>{t.countryName}</Label><Input value={newDelegate.name} onChange={e => setNewDelegate({...newDelegate, name: e.target.value})} placeholder="..." /></div>
                  <div className="space-y-2"><Label>{t.password}</Label><Input value={newDelegate.password} onChange={e => setNewDelegate({...newDelegate, password: e.target.value})} placeholder="..." /></div>
                  <Button className="w-full bg-secondary" onClick={handleAddDelegate}>{t.addToList}</Button>
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="text-lg">{t.registeredDelegates} ({delegates.length})</CardTitle></CardHeader>
                <CardContent>
                  <ScrollArea className="h-[400px]">
                    {delegates.map(d => (
                      <div key={d.id} className={`flex justify-between items-center p-3 mb-2 rounded-lg border transition-colors ${d.is_suspended ? 'bg-destructive/5 border-destructive/20' : 'bg-muted/50 border-transparent'}`}>
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm break-words">{d.country_name}</span>
                            {d.is_suspended && <Badge variant="destructive" className="h-4 text-[8px] px-1 uppercase"><ShieldAlert size={10} className="mr-0.5" /> {lang === 'fr' ? 'Suspendu' : 'Suspended'}</Badge>}
                          </div>
                          <span className="text-[10px] text-muted-foreground font-mono">Pass: {d.password}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" className={`h-8 w-8 ${d.is_suspended ? 'text-green-600' : 'text-amber-600'}`} onClick={() => toggleDelegateSuspension(d.id, d.is_suspended)}>{d.is_suspended ? <ShieldOff size={16} /> : <ShieldAlert size={16} />}</Button>
                          <Button variant="ghost" size="icon" className="text-destructive h-8 w-8" onClick={() => deleteDocumentNonBlocking(doc(db!, 'committees', committeeId, 'delegates', d.id))}><Trash2 size={16} /></Button>
                        </div>
                      </div>
                    ))}
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="stats" className="space-y-6 mt-4">
              <Card>
                <CardHeader className="flex flex-row items-center gap-2"><Award size={18} className="text-primary" /><CardTitle className="text-lg">{t.gradingTitle}</CardTitle></CardHeader>
                <CardContent className="px-2">
                  <div className="px-4 mb-4"><Button onClick={handleCalculateRanks} className="w-full bg-primary gap-2 shadow-lg"><Calculator size={18} /> {t.calculate}</Button></div>
                  <ScrollArea className="h-[500px]">
                    <div className="space-y-6 p-2">
                      {displayGradedDelegates.map((d, index) => (
                        <div key={d.id} className="p-4 border rounded-xl bg-muted/20 relative">
                          <div className="flex justify-between items-center mb-4">
                            <div className="flex items-center gap-3"><Badge variant="secondary" className="h-8 w-8 rounded-full p-0 flex items-center justify-center font-black text-xs">{index + 1}</Badge><span className="font-black uppercase tracking-tight text-sm">{d.country_name}</span></div>
                            <div className="flex flex-col items-end"><span className="text-[10px] font-bold text-muted-foreground uppercase">{t.average}</span><span className={`text-xl font-black tabular-nums ${d.average >= 7 ? 'text-green-600' : d.average >= 4 ? 'text-amber-600' : 'text-red-600'}`}>{d.average.toFixed(1)}/10</span></div>
                          </div>
                          <div className="grid grid-cols-1 gap-4">
                            <div className="space-y-1"><Label className="text-[9px] uppercase font-bold text-muted-foreground">{t.speaking}</Label><Input type="number" min="0" max="10" step="0.5" className="h-8 text-xs font-bold" value={d.grades.speaking} onChange={(e) => handleUpdateGrade(d.id, 'speaking', Number(e.target.value))} /></div>
                            <div className="space-y-1"><Label className="text-[9px] uppercase font-bold text-muted-foreground">{t.diplomacy}</Label><Input type="number" min="0" max="10" step="0.5" className="h-8 text-xs font-bold" value={d.grades.diplomacy} onChange={(e) => handleUpdateGrade(d.id, 'diplomacy', Number(e.target.value))} /></div>
                            <div className="space-y-1"><Label className="text-[9px] uppercase font-bold text-muted-foreground">{t.knowledge}</Label><Input type="number" min="0" max="10" step="0.5" className="h-8 text-xs font-bold" value={d.grades.knowledge} onChange={(e) => handleUpdateGrade(d.id, 'knowledge', Number(e.target.value))} /></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center gap-2"><BarChart3 size={18} className="text-primary" /><CardTitle className="text-lg">{t.participationStats}</CardTitle></CardHeader>
                <CardContent className="h-[300px] pt-4">
                  {statsData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={statsData} layout="vertical">
                        <XAxis type="number" hide />
                        <YAxis dataKey="name" type="category" width={100} fontSize={10} tick={{ fill: 'currentColor' }} />
                        <RechartsTooltip 
                          cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              return (
                                <div className="bg-white border p-2 rounded-lg shadow-xl text-xs">
                                  <p className="font-bold">{payload[0].payload.name}</p>
                                  <p className="text-primary">{payload[0].value} participation(s)</p>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                          {statsData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={index % 2 === 0 ? 'hsl(var(--primary))' : 'hsl(var(--secondary))'} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : <div className="h-full flex flex-col items-center justify-center text-muted-foreground italic">{lang === 'fr' ? 'Aucune donnée' : 'No data'}</div>}
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center gap-2"><History size={18} className="text-muted-foreground" /><CardTitle className="text-lg">{t.actionsHistory}</CardTitle></CardHeader>
                <CardContent className="px-4">
                  <ScrollArea className="h-[300px]">
                    <div className="space-y-3">
                      {allActions.map(action => (
                        <div key={action.id} className="flex justify-between items-center p-3 bg-muted/30 rounded-lg border text-xs"><div className="flex flex-col gap-1"><span className="font-bold break-words">{action.title}</span><div className="flex gap-2"><Badge variant="outline" className="text-[10px]">{action.status}</Badge></div></div><Button variant="ghost" size="icon" className="text-destructive h-8 w-8" onClick={() => handleDeleteAction(action.id)}><Trash2 size={16} /></Button></div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <div className="lg:col-span-8 space-y-6">
          <Tabs defaultValue="resolutions">
            <TabsList className="w-full">
              <TabsTrigger value="resolutions" className="flex-1">{t.resolutionsTab}</TabsTrigger>
              <TabsTrigger value="messages" className="flex-1 relative">{t.messagesTab}{unreadMessagesCount > 0 && <Badge variant="destructive" className="ml-2 h-5 w-5 p-0 flex items-center justify-center rounded-full">{unreadMessagesCount}</Badge>}</TabsTrigger>
            </TabsList>
            <TabsContent value="resolutions" className="space-y-6 mt-4">
              <Card>
                <CardHeader className="bg-muted/30 flex flex-row items-center justify-between"><CardTitle className="flex items-center gap-2"><FileText /> {t.resolutionsSubmitted}</CardTitle><Badge variant="outline">{resolutions.length}</Badge></CardHeader>
                <CardContent className="p-6 space-y-6">
                  {resolutions.map(res => (
                    <Card key={res.id} className={`overflow-hidden border-2 ${res.is_displayed ? 'border-primary' : ''}`}>
                      <div className="bg-muted/50 p-4 flex justify-between items-center"><div className="flex items-center gap-2"><span className="font-bold text-primary uppercase tracking-tight break-words">{res.title || "..."}</span>{res.is_displayed && <Badge className="bg-primary"><Monitor className="h-3 w-3 mr-1" /> {lang === 'fr' ? 'PROJETÉ' : 'PROJECTED'}</Badge>}</div><Badge variant={res.status === 'approved' ? 'default' : res.status === 'rejected' ? 'destructive' : 'secondary'}>{res.status?.toUpperCase()}</Badge></div>
                      <CardContent className="p-4 space-y-4">
                        <div className="flex flex-wrap gap-2 items-center mb-4"><Badge variant="outline" className="bg-primary/10 border-primary/30 text-primary py-1 px-2 text-[10px] font-bold uppercase">DE: {res.proposing_country}</Badge>{res.spokesperson && <Badge variant="outline" className="bg-secondary/10 border-secondary/30 text-secondary py-1 px-2 text-[10px] font-bold uppercase gap-1"><User size={10} /> {t.spokesperson}: {res.spokesperson}</Badge>}{res.sponsors && <Badge variant="outline" className="bg-muted border-muted-foreground/30 text-muted-foreground py-1 px-2 text-[10px] font-bold uppercase gap-1"><Users size={10} /> {t.sponsors}: {res.sponsors}</Badge>}</div>
                        <div className="text-sm leading-relaxed whitespace-pre-wrap break-words prose prose-sm max-w-none text-left" dangerouslySetInnerHTML={{ __html: res.content }} />
                        <div className="flex gap-2 justify-end pt-4 border-t">
                          <Button variant={res.is_displayed ? "default" : "outline"} size="sm" onClick={() => updateDocumentNonBlocking(doc(db!, 'committees', committeeId, 'resolutions', res.id), { is_displayed: !res.is_displayed })}>{res.is_displayed ? <><EyeOff size={16} /> {t.hide}</> : <><Eye size={16} /> {t.show}</>}</Button>
                          <Button variant="outline" size="sm" className="text-green-600" onClick={() => updateDocumentNonBlocking(doc(db!, 'committees', committeeId, 'resolutions', res.id), { status: 'approved' })}><CheckCircle size={16} /> {t.approve}</Button>
                          <Button variant="outline" size="sm" className="text-red-600" onClick={() => updateDocumentNonBlocking(doc(db!, 'committees', committeeId, 'resolutions', res.id), { status: 'rejected' })}><XCircle size={16} /> {t.reject}</Button>
                          <Button variant="ghost" size="sm" className="text-destructive" onClick={() => deleteDocumentNonBlocking(doc(db!, 'committees', committeeId, 'resolutions', res.id))}><Trash2 size={16} /></Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="messages" className="space-y-6 mt-4">
              <Card>
                <CardHeader className="bg-muted/30"><CardTitle className="flex items-center gap-2"><Bell size={18} /> {t.privateInbox}</CardTitle></CardHeader>
                <CardContent className="p-0">
                  <ScrollArea className="h-[600px]">
                    <div className="p-6 space-y-4">
                      {messages.map(msg => (
                        <div key={msg.id} className={`p-4 border-l-4 rounded-r-xl shadow-sm flex flex-col gap-3 ${msg.is_read ? 'bg-muted/10 border-muted-foreground/30' : 'bg-secondary/5 border-secondary'}`}>
                          <div className="flex justify-between items-start"><div className="flex items-center gap-2"><Badge variant={msg.type === 'privilege' ? 'destructive' : 'secondary'} className="uppercase text-[10px]">{msg.type}</Badge><span className="font-bold text-sm">{msg.sender_country}</span></div><div className="flex items-center gap-1">{!msg.is_read && <Button size="icon" variant="ghost" className="h-8 w-8 text-green-600" onClick={() => markMessageAsRead(msg.id)}><Check size={16} /></Button>}<Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => deleteMessage(msg.id)}><Trash2 size={16} /></Button></div></div>
                          <p className="text-sm font-medium leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                        </div>
                      ))}
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
