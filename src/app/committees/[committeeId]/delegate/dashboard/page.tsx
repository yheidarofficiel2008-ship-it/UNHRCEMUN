
"use client"

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Send, CheckCircle2, XCircle, LogOut, FileText, Monitor, Clock, Timer, MessageSquarePlus, Check, Bold, Italic, Underline, Eye, ShieldAlert, AlertTriangle, User, Users, Lock, ListOrdered } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useFirebase, useDoc } from '@/firebase';
import { useMemoFirebase } from '@/firebase';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, setDoc, doc, increment, updateDoc } from 'firebase/firestore';
import { SuspensionOverlay } from '@/components/SuspensionOverlay';
import { GlobalTimer } from '@/components/GlobalTimer';
import { SpeakingTimer } from '@/components/SpeakingTimer';
import { useToast } from '@/hooks/use-toast';
import { useRealtime } from '@/hooks/use-realtime';

export default function DelegateDashboard() {
  const router = useRouter();
  const params = useParams();
  const committeeId = params.committeeId as string;
  const { toast } = useToast();
  const { firestore: db } = useFirebase();
  const { isSuspended: isGlobalSuspended, allowResolutions, allowGossip, currentAction, activeOverlay } = useRealtime(committeeId);
  
  const committeeRef = useMemoFirebase(() => db ? doc(db, 'committees', committeeId) : null, [db, committeeId]);
  const { data: committee } = useDoc(committeeRef);

  const [delegate, setDelegate] = useState<any>(null);
  const [participationStatus, setParticipationStatus] = useState<string | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [isCountrySuspended, setIsCountrySuspended] = useState(false);
  
  const resTextAreaRef = useRef<HTMLTextAreaElement>(null);
  const lastOverlayType = useRef<string | null>(null);

  const lang = committee?.language || 'fr';
  const t = {
    fr: {
      sessionActive: "Session Active",
      crisis: "CRISE DÉCLENCHÉE",
      msgToPresidency: "Bureau de la Présidence",
      personalPrivilege: "Point de Privilège Personnel",
      generalMsg: "Communication Générale",
      gossipMsg: "Gossip Box (Anonyme)",
      anonymousHint: "Ce message sera transmis de manière totalement anonyme.",
      yourMsg: "Rédigez votre message ici...",
      send: "Transmettre",
      sending: "Transmission...",
      myEnvois: "Historique de mes Envois",
      resolution: "Résolution",
      message: "Message",
      currentSession: "PROCÉDURE EN COURS",
      waitingAction: "En attente de consignes...",
      globalChrono: "Chronomètre Global",
      speakerChrono: "Chrono Orateur",
      participate: "Participer",
      pass: "Passer son tour",
      submitResolution: "Rédaction de Résolution",
      title: "Intitulé",
      spokesperson: "Délégation Porte-parole",
      countryName: "Nom de la délégation",
      sponsors: "Délégations Sponsors",
      content: "Contenu",
      transmit: "Soumettre au Bureau Officiel",
      suspended: "DÉLÉGATION SUSPENDUE",
      suspendedDesc: "Votre droit de parole et d'interaction a été temporairement suspendu.",
      urgency: "URGENCE ABSOLUE : CRISE",
      for: "POUR",
      against: "CONTRE",
      abstention: "ABSTENTION",
      voteRecorded: "Vote enregistré avec succès",
      submissionsSuspended: "ENVOIS BLOQUÉS",
      preview: "Aperçu du rendu final",
      speakersList: "Liste des Orateurs inscrits",
      noSpeaker: "Aucune inscription active",
      officialVote: "SCRUTIN OFFICIEL",
      officialAnnouncement: "ANNONCE OFFICIELLE",
      gossipTitle: "✨ GOSSIP ANONYME ✨",
      projectedRes: "Résolution projetée au Comité"
    },
    en: {
      sessionActive: "Session Active",
      crisis: "CRISIS TRIGGERED",
      msgToPresidency: "Presidency Office",
      personalPrivilege: "Personal Privilege Point",
      generalMsg: "General Communication",
      gossipMsg: "Gossip Box (Anonymous)",
      anonymousHint: "This message will be transmitted completely anonymously.",
      yourMsg: "Type your message here...",
      send: "Transmit",
      sending: "Transmitting...",
      myEnvois: "My Sent Communications",
      resolution: "Resolution",
      message: "Message",
      currentSession: "CURRENT PROCEDURE",
      waitingAction: "Waiting for instructions...",
      globalChrono: "Global Chronometer",
      speakerChrono: "Speaker Timer",
      participate: "Participate",
      pass: "Pass",
      submitResolution: "Resolution Drafting",
      title: "Title",
      spokesperson: "Spokesperson Delegation",
      countryName: "Delegation name",
      sponsors: "Sponsor Delegations",
      content: "Content",
      transmit: "Submit to Official Office",
      suspended: "DELEGATION SUSPENDED",
      suspendedDesc: "Your right to speak and interact has been temporarily suspended.",
      urgency: "ABSOLUTE URGENCY: CRISIS",
      for: "FOR",
      against: "AGAINST",
      abstention: "ABSTAIN",
      voteRecorded: "Vote recorded successfully",
      submissionsSuspended: "SUBMISSIONS BLOCKED",
      preview: "Live Preview",
      speakersList: "Registered Speakers List",
      noSpeaker: "No active registrations",
      officialVote: "OFFICIAL VOTE",
      officialAnnouncement: "OFFICIAL ANNOUNCEMENT",
      gossipTitle: "✨ ANONYMOUS GOSSIP ✨",
      projectedRes: "Resolution projected to Committee"
    }
  }[lang];
  
  const [resolutionForm, setResolutionForm] = useState({ title: '', spokesperson: '', sponsors: '', content: '' });
  const [messageForm, setMessageForm] = useState({ type: 'privilege', content: '' });
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [myResolutions, setMyResolutions] = useState<any[]>([]);
  const [myMessages, setMyMessages] = useState<any[]>([]);
  const [activeSpeakers, setActiveSpeakers] = useState<any[]>([]);
  const [projectedResolutions, setProjectedResolutions] = useState<any[]>([]);

  useEffect(() => {
    const session = localStorage.getItem('delegate_session');
    if (!session) {
      router.push(`/committees/${committeeId}/delegate/login`);
      return;
    }
    const del = JSON.parse(session);
    setDelegate(del);

    if (!db) return;

    const unsubDelegate = onSnapshot(doc(db, 'committees', committeeId, 'delegates', del.id), (docSnap) => {
      if (docSnap.exists()) setIsCountrySuspended(docSnap.data().is_suspended === true);
    });

    const resRef = collection(db, 'committees', committeeId, 'resolutions');
    const qRes = query(resRef, where('proposing_country', '==', del.country_name));
    const unsubRes = onSnapshot(qRes, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), _type: 'resolution' }));
      setMyResolutions(data);
    });

    // Écouteur pour les résolutions projetées par la présidence
    const qProjected = query(resRef, where('is_displayed', '==', true));
    const unsubProjected = onSnapshot(qProjected, (snapshot) => {
      setProjectedResolutions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const msgRef = collection(db, 'committees', committeeId, 'messages');
    const qMsg = query(msgRef, where('sender_country', '==', del.country_name));
    const unsubMsg = onSnapshot(qMsg, (snapshot) => {
      const data = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data(), _type: 'message' }))
        .filter((m: any) => m.type !== 'gossip');
      setMyMessages(data);
    });

    return () => { 
      unsubDelegate(); 
      unsubRes(); 
      unsubMsg(); 
      unsubProjected();
    };
  }, [router, db, committeeId]);

  useEffect(() => {
    if (!currentAction || !delegate || !db) return;
    const partId = `${currentAction.id}_${delegate.id}`;
    const unsub = onSnapshot(doc(db, 'committees', committeeId, 'participations', partId), (snap) => {
      if (snap.exists()) setParticipationStatus(snap.data().status);
      else setParticipationStatus(null);
    });
    return () => unsub();
  }, [currentAction, delegate, db, committeeId]);

  useEffect(() => {
    if (!db || !currentAction?.id) {
      setActiveSpeakers([]);
      return;
    }
    const partRef = collection(db, 'committees', committeeId, 'participations');
    const unsub = onSnapshot(query(partRef, where('action_id', '==', currentAction.id)), (snapshot) => {
      const speakers = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() as any }))
        .filter(p => p.status === 'participating')
        .sort((a, b) => (a.updated_at?.seconds || 0) - (b.updated_at?.seconds || 0));
      setActiveSpeakers(speakers);
    });
    return () => unsub();
  }, [db, currentAction?.id, committeeId]);

  useEffect(() => {
    if (activeOverlay?.type === 'crisis' && lastOverlayType.current !== 'crisis') {
      playCrisisAlarm();
    }
    lastOverlayType.current = activeOverlay?.type || null;
  }, [activeOverlay]);

  const playCrisisAlarm = () => {
    try {
      const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const context = new AudioContextClass();
      const now = context.currentTime;
      const playPulse = (startTime: number) => {
        const osc = context.createOscillator();
        const gain = context.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(440, startTime);
        osc.frequency.exponentialRampToValueAtTime(880, startTime + 0.4);
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.2, startTime + 0.1);
        gain.gain.linearRampToValueAtTime(0, startTime + 0.5);
        osc.connect(gain);
        gain.connect(context.destination);
        osc.start(startTime);
        osc.stop(startTime + 0.5);
      };
      for(let i = 0; i < 8; i++) playPulse(now + i * 0.5);
    } catch (e) { console.warn("Audio blocked"); }
  };

  const handleParticipation = async (status: 'participating' | 'passing') => {
    if (!currentAction || !delegate || isCountrySuspended || !db) return;
    try {
      const participationId = `${currentAction.id}_${delegate.id}`;
      await setDoc(doc(db, 'committees', committeeId, 'participations', participationId), {
        action_id: currentAction.id,
        delegate_id: delegate.id,
        country_name: delegate.country_name,
        status: status,
        updated_at: serverTimestamp()
      });
      toast({ title: lang === 'fr' ? "Inscription effectuée" : "Registration complete" });
    } catch (e) { toast({ title: "Error", variant: "destructive" }); }
  };

  const handleVote = async (choice: 'pour' | 'contre' | 'abstention') => {
    if (!activeOverlay || activeOverlay.type !== 'vote' || hasVoted || isCountrySuspended || !db) return;
    try {
      const sessionRef = doc(db, 'committees', committeeId, 'sessionState', 'current');
      await updateDoc(sessionRef, { [`activeOverlay.results.${choice}`]: increment(1) });
      setHasVoted(true);
      toast({ title: t.voteRecorded });
    } catch (e) { toast({ title: "Error", variant: "destructive" }); }
  };

  const wrapText = (tag: string) => {
    const textArea = resTextAreaRef.current;
    if (!textArea) return;
    const start = textArea.selectionStart;
    const end = textArea.selectionEnd;
    const text = textArea.value;
    const selectedText = text.substring(start, end);
    const openTag = `<${tag}>`;
    const closeTag = `</${tag}>`;
    let newText;
    let newSelectionStart;
    let newSelectionEnd;

    if (selectedText.startsWith(openTag) && selectedText.endsWith(closeTag)) {
      const unwrapped = selectedText.substring(openTag.length, selectedText.length - closeTag.length);
      newText = text.substring(0, start) + unwrapped + text.substring(end);
      newSelectionStart = start;
      newSelectionEnd = start + unwrapped.length;
    } else {
      newText = text.substring(0, start) + openTag + selectedText + closeTag + text.substring(end);
      newSelectionStart = start + openTag.length;
      newSelectionEnd = end + openTag.length;
    }

    setResolutionForm({ ...resolutionForm, content: newText });

    setTimeout(() => {
      textArea.focus();
      textArea.setSelectionRange(newSelectionStart, newSelectionEnd);
    }, 0);
  };

  const submitResolution = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!delegate || !allowResolutions || isCountrySuspended || !db) return;
    try {
      await addDoc(collection(db, 'committees', committeeId, 'resolutions'), {
        title: resolutionForm.title,
        proposing_country: delegate.country_name,
        spokesperson: resolutionForm.spokesperson,
        sponsors: resolutionForm.sponsors,
        content: resolutionForm.content,
        status: 'pending',
        is_displayed: false,
        created_at: serverTimestamp()
      });
      setResolutionForm({ title: '', spokesperson: '', sponsors: '', content: '' });
      toast({ title: lang === 'fr' ? "Résolution transmise" : "Resolution transmitted" });
    } catch (e) { toast({ title: "Error", variant: "destructive" }); }
  };

  const submitMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!delegate || !messageForm.content || isCountrySuspended || !db) return;
    if (messageForm.type === 'gossip' && !allowGossip) {
      toast({ title: "Gossip Box suspendue", variant: "destructive" });
      return;
    }
    setIsSendingMessage(true);
    try {
      await addDoc(collection(db, 'committees', committeeId, 'messages'), {
        sender_country: delegate.country_name,
        type: messageForm.type,
        content: messageForm.content,
        timestamp: serverTimestamp(),
        is_read: false
      });
      setMessageForm({ ...messageForm, content: '' });
      toast({ title: lang === 'fr' ? "Message transmise" : "Message transmitted" });
    } catch (e) { toast({ title: "Error", variant: "destructive" }); } finally { setIsSendingMessage(false); }
  };

  if (!delegate) return null;

  const isActive = currentAction && currentAction.status !== 'completed';
  const myEnvois = [...myResolutions, ...myMessages].sort((a: any, b: any) => {
    const timeA = a.created_at?.seconds || a.timestamp?.seconds || 0;
    const timeB = b.created_at?.seconds || b.timestamp?.seconds || 0;
    return timeB - timeA;
  });

  const parseTimePerDelegate = (timeStr: string) => {
    if (!timeStr) return 60;
    const [mins, secs] = timeStr.split(':').map(Number);
    return (mins * 60) + (secs || 0);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col relative font-body overflow-x-hidden">
      {isGlobalSuspended && <SuspensionOverlay />}
      {isCountrySuspended && (
        <div className="fixed inset-0 z-[10000] bg-destructive flex flex-col items-center justify-center p-6 text-white animate-in fade-in duration-500">
          <ShieldAlert className="size-20 md:size-40 mb-8 animate-pulse" />
          <h1 className="text-3xl md:text-7xl font-black uppercase text-center mb-6 tracking-tight">{t.suspended}</h1>
          <p className="text-lg md:text-2xl text-center opacity-80 max-w-2xl font-medium leading-relaxed">{t.suspendedDesc}</p>
        </div>
      )}
      
      {activeOverlay && activeOverlay.type !== 'none' && activeOverlay.status !== 'inactive' && (
        <div className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center p-4 md:p-6 transition-colors duration-700 ${activeOverlay.type === 'crisis' ? 'bg-red-700 text-white' : 'bg-white/95 backdrop-blur-3xl text-primary'}`}>
          <div className="max-w-5xl w-full text-center space-y-8 md:space-y-12">
            {activeOverlay.type === 'crisis' ? (
              <div className="flex flex-col items-center gap-6 mb-4">
                <AlertTriangle className="size-16 md:size-20 text-white animate-bounce" />
                <h2 className="text-2xl md:text-5xl font-black uppercase tracking-tighter leading-tight border-2 border-white px-6 md:px-8 py-3 md:py-4 shadow-2xl">{t.urgency}</h2>
                <h1 className="text-xl md:text-4xl font-black uppercase tracking-tighter drop-shadow-2xl">{activeOverlay.title}</h1>
              </div>
            ) : (
              <div className="space-y-8 md:space-y-12 animate-in fade-in slide-in-from-bottom-10 duration-700 w-full flex flex-col items-center">
                <div className="space-y-4">
                  <Badge variant="outline" className="font-black uppercase tracking-[0.4em] px-4 py-1.5 text-[9px] md:text-xs border-primary/20 text-primary bg-primary/5">
                    {activeOverlay.type === 'vote' ? t.officialVote : activeOverlay.type === 'gossip' ? t.gossipTitle : t.officialAnnouncement}
                  </Badge>
                  <h1 className="text-2xl md:text-5xl font-black uppercase tracking-tighter leading-tight text-gradient py-2">
                    {activeOverlay.title}
                  </h1>
                </div>
                {activeOverlay.type === 'vote' && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-10 max-w-3xl mx-auto w-full">
                    {['pour', 'contre', 'abstention'].map((choice) => (
                      <div key={choice} className="space-y-2 md:space-y-4">
                        <Button 
                          size="lg" 
                          className={`w-full h-12 md:h-14 ${choice === 'pour' ? 'bg-green-600 hover:bg-green-700' : choice === 'contre' ? 'bg-red-600 hover:bg-red-700' : 'bg-amber-500 hover:bg-amber-600'} text-white text-xs font-black rounded-xl shadow-lg transition-all hover:scale-105 active:scale-95 disabled:opacity-30`} 
                          onClick={() => handleVote(choice as any)} 
                          disabled={hasVoted || isCountrySuspended}
                        >
                          {t[choice as keyof typeof t] || choice.toUpperCase()}
                        </Button>
                        <div className={`text-3xl md:text-5xl font-black tabular-nums ${choice === 'pour' ? 'text-green-600' : choice === 'contre' ? 'text-red-600' : 'text-amber-500'}`}>{activeOverlay.results?.[choice] || 0}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      <header className="bg-white/80 backdrop-blur-md border-b border-primary/10 p-3 md:p-4 shadow-sm flex justify-between items-center z-20 sticky top-0">
        <div className="flex items-center gap-3 md:gap-6 min-w-0">
          <h1 className="text-sm md:text-xl font-black font-headline uppercase tracking-tight text-[#0459ab] truncate">{delegate.country_name}</h1>
          <Badge variant="outline" className="border-primary/20 text-[#0459ab] uppercase text-[7px] md:text-[10px] font-bold px-1.5 md:px-3 whitespace-nowrap">{t.sessionActive}</Badge>
        </div>
        <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive hover:bg-destructive/5 rounded-full" onClick={() => { localStorage.removeItem('delegate_session'); router.push('/'); }}><LogOut className="size-4 md:size-5" /></Button>
      </header>

      <main className="flex-1 p-4 md:p-10 flex flex-col lg:grid lg:grid-cols-12 gap-6 md:gap-8 max-w-[1600px] mx-auto w-full">
        <div className="order-1 lg:col-span-8 lg:row-span-1">
          <Card className="rounded-[1.5rem] md:rounded-[2.5rem] border-primary/10 glass-card overflow-hidden shadow-2xl h-full">
            <CardHeader className="bg-primary/[0.03] border-b border-primary/5 p-6 md:p-10">
              <Badge className="bg-[#0459ab] rounded-lg md:rounded-xl px-3 md:px-4 py-0.5 md:py-1 font-black text-[8px] md:text-[10px] tracking-widest mb-4">{t.currentSession}</Badge>
              <CardTitle className="text-xl md:text-4xl font-black font-headline uppercase tracking-tighter text-[#0459ab] leading-none">{isActive ? currentAction.title : t.waitingAction}</CardTitle>
            </CardHeader>
            <CardContent className="p-6 md:p-10 space-y-8 md:space-y-12">
              {isActive ? (
                <div className="flex flex-col items-center gap-8 md:gap-12 max-w-2xl mx-auto w-full">
                  <div className="w-full">
                    <GlobalTimer status={currentAction.status} startedAt={currentAction.started_at} pausedAt={currentAction.paused_at} totalElapsedSeconds={currentAction.total_elapsed_seconds} durationMinutes={currentAction.duration_minutes} />
                  </div>
                  <div className="flex flex-col items-center gap-3 md:gap-4">
                    <div className="flex items-center gap-2 px-3 md:px-4 py-1 md:py-1.5 bg-primary/5 border border-primary/10 rounded-full">
                      <Timer className="size-3 md:size-4 text-primary/60" />
                      <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-primary/60">{t.speakerChrono}</span>
                    </div>
                    <SpeakingTimer status={currentAction.speaking_timer_status} startedAt={currentAction.speaking_timer_started_at} totalElapsedSeconds={currentAction.speaking_timer_total_elapsed || 0} limitSeconds={parseTimePerDelegate(currentAction.time_per_delegate)} size="md" />
                  </div>
                  {currentAction.allow_participation && currentAction.status === 'launched' && (
                    <div className="pt-6 md:pt-10 border-t border-primary/5 text-center w-full">
                      <div className="grid grid-cols-2 gap-4 md:gap-8 max-w-md mx-auto">
                        <Button size="sm" className={`h-10 md:h-12 rounded-xl font-black uppercase tracking-widest text-[8px] md:text-xs gap-1.5 md:gap-2 shadow-lg transition-all hover:scale-[1.03] ${participationStatus === 'participating' ? 'bg-green-600 shadow-green-600/20' : 'bg-[#0459ab] shadow-[#0459ab]/20'}`} onClick={() => handleParticipation('participating')} disabled={isCountrySuspended || activeOverlay?.type === 'crisis'}><CheckCircle2 className="size-4 md:size-5" /> {t.participate}</Button>
                        <Button size="sm" variant="outline" className={`h-10 md:h-12 rounded-xl font-black uppercase tracking-widest text-[8px] md:text-xs gap-1.5 md:gap-2 border-2 transition-all hover:scale-[1.03] ${participationStatus === 'passing' ? 'border-destructive text-destructive bg-destructive/5' : 'border-primary/20 text-[#0459ab]/60 hover:bg-primary/5'}`} onClick={() => handleParticipation('passing')} disabled={isCountrySuspended || activeOverlay?.type === 'crisis'}><XCircle className="size-4 md:size-5" /> {t.pass}</Button>
                      </div>
                    </div>
                  )}
                </div>
              ) : <div className="py-16 md:py-24 text-center opacity-20"><Monitor className="size-16 md:size-24 mx-auto mb-4 md:mb-6" /></div>}
            </CardContent>
          </Card>
        </div>

        <div className="order-2 lg:col-span-4 lg:row-span-2 space-y-6 md:space-y-8">
          <Card className="rounded-2xl md:rounded-3xl border-primary/10 glass-card">
            <CardHeader className="py-3 px-4 md:py-6 md:px-8 flex flex-row items-center justify-between">
              <div className="flex items-center gap-2 md:gap-3"><ListOrdered className="size-4 md:size-6 text-[#0459ab]" /><CardTitle className="text-xs md:text-lg font-black uppercase tracking-widest text-[#0459ab]/80">{t.speakersList}</CardTitle></div>
              <Badge className="bg-[#0459ab] rounded-lg font-black text-[10px] md:text-sm">{activeSpeakers.length}</Badge>
            </CardHeader>
            <CardContent className="px-4 md:px-8 pb-4 md:pb-8">
              <ScrollArea className="h-[200px] md:h-[300px]">
                <div className="space-y-2 md:space-y-4">
                  {activeSpeakers.map((s, i) => (
                    <div key={s.id} className={`flex justify-between items-center p-3 md:p-5 rounded-xl md:rounded-2xl border transition-all duration-300 ${i === 0 ? 'bg-primary/5 border-primary/20 shadow-sm' : 'bg-white border-primary/5'}`}>
                      <div className="flex items-center gap-3 md:gap-5"><span className={`text-[10px] md:text-sm font-black h-6 w-6 md:h-8 md:w-8 flex items-center justify-center rounded-lg ${i === 0 ? 'bg-[#0459ab] text-white' : 'bg-muted text-muted-foreground'}`}>{i + 1}</span><span className={`text-[10px] md:text-sm font-bold uppercase tracking-tight ${i === 0 ? 'text-[#0459ab]' : 'text-foreground/70'}`}>{s.country_name}</span></div>
                      {i === 0 && <Badge className="bg-[#0459ab]/10 text-[#0459ab] text-[7px] md:text-[10px] font-black animate-pulse px-2">ACTUEL</Badge>}
                    </div>
                  ))}
                  {activeSpeakers.length === 0 && <div className="text-center py-12 md:py-20 text-muted-foreground/50 text-[10px] md:text-sm italic font-medium">{t.noSpeaker}</div>}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          <Card className="rounded-2xl md:rounded-3xl border-primary/10 glass-card">
            <CardHeader className="py-3 px-4 md:py-6 md:px-8 flex flex-row items-center gap-2 md:gap-3">
              <MessageSquarePlus className="size-4 md:size-6 text-[#0459ab]" />
              <CardTitle className="text-xs md:text-sm font-black uppercase tracking-widest text-[#0459ab]/80">{t.msgToPresidency}</CardTitle>
            </CardHeader>
            <form onSubmit={submitMessage}>
              <CardContent className="px-4 md:px-8 pb-3 md:pb-6 space-y-3 md:space-y-5">
                <Select value={messageForm.type} onValueChange={(val) => setMessageForm({...messageForm, type: val})} disabled={isCountrySuspended || activeOverlay?.type === 'crisis'}>
                  <SelectTrigger className="h-9 md:h-12 text-[10px] md:text-sm rounded-xl border-primary/10 bg-white"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="privilege">{t.personalPrivilege}</SelectItem><SelectItem value="general">{t.generalMsg}</SelectItem><SelectItem value="gossip" className="text-primary font-bold">✨ {t.gossipMsg}</SelectItem></SelectContent>
                </Select>
                {messageForm.type === 'gossip' && <p className="text-[9px] md:text-xs font-bold text-primary/60 px-2 italic">{t.anonymousHint}</p>}
                <Textarea placeholder={t.yourMsg} className="min-h-[70px] md:min-h-[100px] text-[10px] md:text-sm resize-none rounded-xl border-primary/10 bg-white p-3 md:p-5" value={messageForm.content} onChange={(e) => setMessageForm({...messageForm, content: e.target.value})} required disabled={isCountrySuspended || activeOverlay?.type === 'crisis' || (messageForm.type === 'gossip' && !allowGossip)} />
              </CardContent>
              <CardFooter className="px-4 md:px-8 pb-4 md:pb-8 pt-0"><Button size="sm" type="submit" className="w-full bg-[#0459ab] hover:bg-[#0459ab]/90 h-9 md:h-12 rounded-xl font-black uppercase tracking-widest text-[9px] md:text-xs" disabled={isSendingMessage || isCountrySuspended || activeOverlay?.type === 'crisis' || (messageForm.type === 'gossip' && !allowGossip)}>{isSendingMessage ? t.sending : t.send}</Button></CardFooter>
            </form>
          </Card>

          <Card className="rounded-2xl md:rounded-3xl border-primary/10 glass-card">
            <CardHeader className="py-3 px-4 md:py-6 md:px-8 flex flex-row items-center gap-2 md:gap-3">
              <Send className="size-4 md:size-6 text-[#0459ab]" />
              <CardTitle className="text-xs md:text-lg font-black uppercase tracking-tight text-[#0459ab]">{t.myEnvois}</CardTitle>
            </CardHeader>
            <CardContent className="px-4 md:px-8 pb-4 md:pb-8">
              <ScrollArea className="h-[250px] md:h-[400px]">
                <div className="space-y-3 md:space-y-5">
                  {myEnvois.map(item => (
                    <div key={item.id} className="p-3 md:p-5 border border-primary/5 rounded-xl md:rounded-2xl bg-white shadow-sm transition-all hover:shadow-md">
                      <div className="flex justify-between items-center mb-2 md:mb-4">
                        <Badge variant="outline" className="text-[8px] md:text-[10px] font-black uppercase tracking-widest border-primary/10 text-[#0459ab]/70">
                          {item._type === 'resolution' ? t.resolution : t.message}
                        </Badge>
                        {item._type === 'resolution' ? <Badge variant={item.status === 'approved' ? 'default' : item.status === 'rejected' ? 'destructive' : 'secondary'} className="uppercase text-[8px] md:text-[10px] font-black">{item.status?.toUpperCase()}</Badge> : <Badge variant="ghost" className="opacity-60">{item.is_read ? <Check className="size-3 md:size-5 text-green-500" /> : <Clock className="size-3 md:size-5" />}</Badge>}
                      </div>
                      {item._type === 'resolution' && <div className="mb-2 font-black uppercase text-[#0459ab] tracking-tight text-xs md:text-sm break-words">{item.title}</div>}
                      <div className="text-[10px] md:text-sm font-medium text-foreground/70 whitespace-pre-wrap break-words prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: item.content }} />
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        <div className="order-3 lg:col-span-8 lg:row-span-1 space-y-6 md:space-y-8">
          {projectedResolutions.map(res => (
            <Card key={res.id} className="rounded-[1.5rem] md:rounded-[2.5rem] border-primary border-4 bg-primary/5 shadow-2xl animate-in fade-in zoom-in duration-500 overflow-hidden">
              <CardHeader className="bg-white/80 border-b border-primary/20 p-6 md:p-8">
                <Badge className="bg-[#0459ab] text-white animate-pulse mb-3">{t.projectedRes}</Badge>
                <CardTitle className="text-xl md:text-3xl font-black uppercase text-[#0459ab]">{res.title}</CardTitle>
                <div className="flex flex-wrap gap-2 mt-2">
                  <Badge variant="outline" className="text-[10px] border-primary/20 text-[#0459ab]">DE: {res.proposing_country}</Badge>
                  {res.spokesperson && <Badge variant="outline" className="text-[10px] border-primary/20 text-[#0459ab]">Porte-parole: {res.spokesperson}</Badge>}
                </div>
              </CardHeader>
              <CardContent className="p-6 md:p-10">
                <div className="text-sm md:text-lg leading-relaxed font-serif text-foreground/80 whitespace-pre-wrap prose max-w-none" dangerouslySetInnerHTML={{ __html: res.content }} />
              </CardContent>
            </Card>
          ))}

          <Card className={`rounded-[1.5rem] md:rounded-[2.5rem] shadow-xl overflow-hidden glass-card transition-all duration-500 ${(!allowResolutions || isCountrySuspended || activeOverlay?.type === 'crisis') ? 'opacity-50 grayscale pointer-events-none' : ''}`}>
            <CardHeader className="bg-secondary/5 border-b border-primary/5 p-6 md:p-8 flex flex-row items-center justify-between">
              <CardTitle className="text-lg md:text-3xl font-black uppercase tracking-tight text-[#0459ab]">{t.submitResolution}</CardTitle>
              {!allowResolutions && <Badge variant="destructive" className="font-black h-7 md:h-8 px-2 md:px-4 text-[8px] md:text-xs"><Lock className="size-3 md:size-4 mr-1.5 md:mr-2" /> {t.submissionsSuspended}</Badge>}
            </CardHeader>
            <form onSubmit={submitResolution}>
              <CardContent className="p-6 md:p-10 space-y-6 md:space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                  <div className="space-y-2"><Label className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-[#0459ab]/60">{t.title}</Label><Input placeholder="..." className="rounded-xl border-primary/10 h-10 md:h-12 font-bold text-xs" value={resolutionForm.title} onChange={e => setResolutionForm({...resolutionForm, title: e.target.value})} required /></div>
                  <div className="space-y-2"><Label className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-[#0459ab]/60">{t.spokesperson}</Label><Input placeholder={t.countryName} className="rounded-xl border-primary/10 h-10 md:h-12 font-bold text-xs" value={resolutionForm.spokesperson} onChange={e => setResolutionForm({...resolutionForm, spokesperson: e.target.value})} required /></div>
                </div>
                <div className="space-y-2"><Label className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-[#0459ab]/60">{t.sponsors}</Label><Input placeholder="..." className="rounded-xl border-primary/10 h-10 md:h-12 font-bold text-xs" value={resolutionForm.sponsors} onChange={e => setResolutionForm({...resolutionForm, sponsors: e.target.value})} /></div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center"><Label className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-[#0459ab]/60">{t.content}</Label><div className="flex gap-1.5 bg-secondary p-1 rounded-lg border border-primary/5">
                    {['b', 'i', 'u'].map(tag => <Button key={tag} type="button" variant="ghost" size="sm" className="h-7 w-7 p-0 rounded-lg hover:bg-white" onClick={() => wrapText(tag)}><span className={tag === 'b' ? 'font-bold' : tag === 'i' ? 'italic' : 'underline'}>{tag.toUpperCase()}</span></Button>)}
                  </div></div>
                  <Textarea ref={resTextAreaRef} className="min-h-[200px] md:min-h-[300px] text-xs md:text-sm leading-relaxed font-serif rounded-2xl border-primary/10 bg-white/50 p-4 md:p-8" value={resolutionForm.content} onChange={e => setResolutionForm({...resolutionForm, content: e.target.value})} required />
                  {resolutionForm.content && <div className="mt-4 p-4 md:p-8 rounded-2xl bg-primary/[0.01] border border-primary/5"><div className="flex items-center gap-2 text-[8px] md:text-[10px] font-black text-[#0459ab]/40 uppercase tracking-widest mb-4"><Eye className="size-4" /> {t.preview}</div><div className="text-xs md:text-sm font-serif leading-relaxed text-left text-foreground/60 whitespace-pre-wrap break-words prose max-w-none" dangerouslySetInnerHTML={{ __html: resolutionForm.content }} /></div>}
                </div>
              </CardContent>
              <CardFooter className="p-6 md:p-10 pt-0"><Button type="submit" className="w-full bg-[#0459ab] hover:bg-[#0459ab]/90 h-10 md:h-12 rounded-xl font-black uppercase tracking-widest text-[9px] md:text-xs shadow-lg shadow-[#0459ab]/20"><Send className="size-4 mr-2" /> {t.transmit}</Button></CardFooter>
            </form>
          </Card>
        </div>
      </main>
    </div>
  );
}
