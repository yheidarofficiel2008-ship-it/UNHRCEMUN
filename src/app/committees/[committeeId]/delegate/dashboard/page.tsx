"use client"

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Send, CheckCircle2, XCircle, LogOut, FileText, Monitor, Clock, Timer, MessageSquarePlus, MessageSquare, Check, Bold, Italic, Underline, Eye, ThumbsUp, ThumbsDown, CircleSlash, ShieldAlert, AlertTriangle, User, Users, Lock, ListOrdered } from 'lucide-react';
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
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, setDoc, doc, increment, updateDoc, orderBy } from 'firebase/firestore';
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
  const { isSuspended: isGlobalSuspended, allowResolutions, currentAction, activeOverlay } = useRealtime(committeeId);
  
  const committeeRef = useMemoFirebase(() => db ? doc(db, 'committees', committeeId) : null, [db, committeeId]);
  const { data: committee } = useDoc(committeeRef);

  const [delegate, setDelegate] = useState<any>(null);
  const [participationStatus, setParticipationStatus] = useState<string | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [isCountrySuspended, setIsCountrySuspended] = useState(false);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const lastOverlayType = useRef<string | null>(null);

  const lang = committee?.language || 'fr';
  const t = {
    fr: {
      sessionActive: "Session Active",
      crisis: "CRISE DÉCLENCHÉE",
      msgToPresidency: "Bureau de la Présidence",
      personalPrivilege: "Point de Privilège Personnel",
      generalMsg: "Communication Générale",
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
      participate: "S'inscrire",
      pass: "Passer son tour",
      projected: "EN DIFFUSION SUR ÉCRAN GÉANT",
      submitResolution: "Rédaction de Résolution",
      title: "Intitulé du Projet",
      spokesperson: "Délégation Porte-parole",
      countryName: "Nom de la délégation",
      sponsors: "Délégations Sponsors",
      content: "Contenu de la Résolution",
      transmit: "Soumettre au Bureau Officiel",
      suspended: "DÉLÉGATION SUSPENDUE",
      suspendedDesc: "Votre droit de parole et d'interaction a été temporairement suspendu.",
      urgency: "URGENCE ABSOLUE : CRISE",
      for: "POUR",
      against: "CONTRE",
      abstention: "ABSTENTION",
      voteRecorded: "Vote enregistré avec succès",
      submissionsSuspended: "ENVOIS BLOQUÉS",
      preview: "Aperçu du rendu final (sans balises)",
      speakersList: "Liste des Orateurs inscrits",
      noSpeaker: "Aucune inscription active"
    },
    en: {
      sessionActive: "Session Active",
      crisis: "CRISIS TRIGGERED",
      msgToPresidency: "Presidency Office",
      personalPrivilege: "Personal Privilege Point",
      generalMsg: "General Communication",
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
      participate: "Sign Up",
      pass: "Pass Turn",
      projected: "PROJECTED ON MAIN SCREEN",
      submitResolution: "Resolution Drafting",
      title: "Project Title",
      spokesperson: "Spokesperson Delegation",
      countryName: "Delegation name",
      sponsors: "Sponsor Delegations",
      content: "Resolution Content",
      transmit: "Submit to Official Office",
      suspended: "DELEGATION SUSPENDED",
      suspendedDesc: "Your right to speak and interact has been temporarily suspended.",
      urgency: "ABSOLUTE URGENCY: CRISIS",
      for: "FOR",
      against: "AGAINST",
      abstention: "ABSTAIN",
      voteRecorded: "Vote recorded successfully",
      submissionsSuspended: "SUBMISSIONS BLOCKED",
      preview: "Live Preview (Clean rendering)",
      speakersList: "Registered Speakers List",
      noSpeaker: "No active registrations"
    }
  }[lang];
  
  const [resolutionForm, setResolutionForm] = useState({ title: '', spokesperson: '', sponsors: '', content: '' });
  const [messageForm, setMessageForm] = useState({ type: 'privilege', content: '' });
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [myResolutions, setMyResolutions] = useState<any[]>([]);
  const [myMessages, setMyMessages] = useState<any[]>([]);
  const [displayedResolutions, setDisplayedResolutions] = useState<any[]>([]);
  const [activeSpeakers, setActiveSpeakers] = useState<any[]>([]);

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
      setMyResolutions(data.sort((a: any, b: any) => (b.created_at?.seconds || 0) - (a.created_at?.seconds || 0)));
    });

    const msgRef = collection(db, 'committees', committeeId, 'messages');
    const qMsg = query(msgRef, where('sender_country', '==', del.country_name));
    const unsubMsg = onSnapshot(qMsg, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), _type: 'message' }));
      setMyMessages(data.sort((a: any, b: any) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0)));
    });

    const qDisplayed = query(collection(db, 'committees', committeeId, 'resolutions'), where('is_displayed', '==', true));
    const unsubDisplayed = onSnapshot(qDisplayed, (snap) => {
      setDisplayedResolutions(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => { unsubDelegate(); unsubRes(); unsubMsg(); unsubDisplayed(); };
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

  useEffect(() => {
    setHasVoted(false);
  }, [activeOverlay?.voteId]);

  const playCrisisAlarm = () => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
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

      for(let i = 0; i < 8; i++) {
        playPulse(now + i * 0.5);
      }
    } catch (e) {
      console.warn("Audio blocked");
    }
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
    } catch (e) {
      toast({ title: "Error", variant: "destructive" });
    }
  };

  const handleVote = async (choice: 'pour' | 'contre' | 'abstention') => {
    if (!activeOverlay || activeOverlay.type !== 'vote' || hasVoted || isCountrySuspended || !db) return;
    try {
      const sessionRef = doc(db, 'committees', committeeId, 'sessionState', 'current');
      await updateDoc(sessionRef, { [`activeOverlay.results.${choice}`]: increment(1) });
      setHasVoted(true);
      toast({ title: t.voteRecorded });
    } catch (e) {
      toast({ title: "Error", variant: "destructive" });
    }
  };

  const wrapText = (tag: string) => {
    if (!textAreaRef.current) return;
    const textarea = textAreaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
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
    } else if (text.substring(start - openTag.length, start) === openTag && text.substring(end, end + closeTag.length) === closeTag) {
      newText = text.substring(0, start - openTag.length) + selectedText + text.substring(end + closeTag.length);
      newSelectionStart = start - openTag.length;
      newSelectionEnd = end - openTag.length;
    } else {
      newText = text.substring(0, start) + openTag + selectedText + closeTag + text.substring(end);
      newSelectionStart = start + openTag.length;
      newSelectionEnd = end + openTag.length;
    }

    setResolutionForm({ ...resolutionForm, content: newText });
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(newSelectionStart, newSelectionEnd);
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
    } catch (e) {
      toast({ title: "Error", variant: "destructive" });
    }
  };

  const submitMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!delegate || !messageForm.content || isCountrySuspended || !db) return;
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
      toast({ title: lang === 'fr' ? "Message transmis" : "Message transmitted" });
    } catch (e) {
      toast({ title: "Error", variant: "destructive" });
    } finally {
      setIsSendingMessage(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('delegate_session');
    router.push('/');
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
    <div className="min-h-screen bg-background flex flex-col relative font-body">
      {isGlobalSuspended && <SuspensionOverlay />}
      {isCountrySuspended && (
        <div className="fixed inset-0 z-[10000] bg-destructive/95 backdrop-blur-md flex flex-col items-center justify-center p-8 text-white animate-in fade-in duration-500">
          <ShieldAlert size={120} className="mb-8" />
          <h1 className="text-6xl font-black uppercase text-center mb-6 tracking-tight">{t.suspended}</h1>
          <p className="text-2xl text-center opacity-80 max-w-2xl font-medium">{t.suspendedDesc}</p>
        </div>
      )}
      {activeOverlay && activeOverlay.type !== 'none' && (
        <div className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center p-6 text-white animate-in fade-in zoom-in duration-500 ${activeOverlay.type === 'crisis' ? 'bg-red-700' : 'bg-primary'}`}>
          <div className="max-w-4xl w-full text-center space-y-12">
            {activeOverlay.type === 'crisis' && (
              <div className="flex flex-col items-center gap-6 mb-4 animate-pulse">
                <AlertTriangle size={100} className="text-white" />
                <h2 className="text-5xl md:text-7xl font-black uppercase tracking-tighter leading-tight bg-white text-red-700 px-12 py-4 rounded-3xl shadow-2xl">{t.urgency}</h2>
              </div>
            )}
            <h1 className="text-5xl md:text-8xl font-black uppercase tracking-tighter leading-tight border-b-2 md:border-b-4 border-white/20 pb-10 break-words drop-shadow-lg">
              {activeOverlay.title}
            </h1>
            {activeOverlay.type === 'vote' && (
              <div className="space-y-12">
                <div className="grid grid-cols-3 gap-6 md:gap-12">
                  <div className="flex flex-col items-center gap-6">
                    <Button size="lg" className="w-full h-32 md:h-44 bg-green-500 hover:bg-green-600 text-2xl md:text-4xl font-black rounded-[2rem] shadow-2xl transition-all active:scale-95 disabled:opacity-50" onClick={() => handleVote('pour')} disabled={hasVoted || isCountrySuspended}>
                      <ThumbsUp className="h-8 w-8 md:h-12 md:w-12" /> {t.for}
                    </Button>
                    <div className="text-4xl md:text-7xl font-black tabular-nums">{activeOverlay.results?.pour || 0}</div>
                  </div>
                  <div className="flex flex-col items-center gap-6">
                    <Button size="lg" className="w-full h-32 md:h-44 bg-red-500 hover:bg-red-600 text-2xl md:text-4xl font-black rounded-[2rem] shadow-2xl transition-all active:scale-95 disabled:opacity-50" onClick={() => handleVote('contre')} disabled={hasVoted || isCountrySuspended}>
                      <ThumbsDown className="h-8 w-8 md:h-12 md:w-12" /> {t.against}
                    </Button>
                    <div className="text-4xl md:text-7xl font-black tabular-nums">{activeOverlay.results?.contre || 0}</div>
                  </div>
                  <div className="flex flex-col items-center gap-6">
                    <Button size="lg" className="w-full h-32 md:h-44 bg-amber-500 hover:bg-amber-600 text-2xl md:text-4xl font-black rounded-[2rem] shadow-2xl transition-all active:scale-95 disabled:opacity-50" onClick={() => handleVote('abstention')} disabled={hasVoted || isCountrySuspended}>
                      <CircleSlash className="h-8 w-8 md:h-12 md:w-12" /> {t.abstention}
                    </Button>
                    <div className="text-4xl md:text-7xl font-black tabular-nums">{activeOverlay.results?.abstention || 0}</div>
                  </div>
                </div>
                {hasVoted && <div className="text-xl md:text-2xl font-black uppercase tracking-widest text-white animate-pulse bg-white/10 py-6 rounded-full border border-white/20">{t.voteRecorded}</div>}
              </div>
            )}
          </div>
        </div>
      )}

      <header className="bg-white/80 backdrop-blur-md border-b border-primary/10 p-4 shadow-sm flex justify-between items-center z-20 sticky top-0">
        <div className="flex items-center gap-6">
          <h1 className="text-xl font-black font-headline uppercase tracking-tight text-gradient">{delegate.country_name}</h1>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="border-primary/20 text-primary uppercase text-[10px] font-bold px-3">{t.sessionActive}</Badge>
            {activeOverlay?.type === 'crisis' && <Badge variant="destructive" className="animate-pulse bg-red-600 text-white font-black px-4">{t.crisis}</Badge>}
          </div>
        </div>
        <Button variant="ghost" className="text-muted-foreground hover:text-destructive hover:bg-destructive/5 rounded-full" onClick={handleLogout}><LogOut size={20} /></Button>
      </header>

      <main className="flex-1 p-6 lg:p-10 grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-[1500px] mx-auto w-full">
        <div className="lg:col-span-4 space-y-8">
          <Card className="rounded-3xl border-primary/10 glass-card">
            <CardHeader className="py-4 px-6 flex flex-row items-center gap-3">
              <MessageSquarePlus size={20} className="text-primary" />
              <CardTitle className="text-sm font-black uppercase tracking-widest text-primary/80">{t.msgToPresidency}</CardTitle>
            </CardHeader>
            <form onSubmit={submitMessage}>
              <CardContent className="px-6 pb-4 space-y-4">
                <Select value={messageForm.type} onValueChange={(val) => setMessageForm({...messageForm, type: val})} disabled={isCountrySuspended || activeOverlay?.type === 'crisis'}>
                  <SelectTrigger className="h-10 text-xs rounded-xl border-primary/10 bg-white"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="privilege">{t.personalPrivilege}</SelectItem>
                    <SelectItem value="general">{t.generalMsg}</SelectItem>
                  </SelectContent>
                </Select>
                <Textarea placeholder={t.yourMsg} className="min-h-[80px] text-xs resize-none rounded-xl border-primary/10 bg-white p-4" value={messageForm.content} onChange={(e) => setMessageForm({...messageForm, content: e.target.value})} required disabled={isCountrySuspended || activeOverlay?.type === 'crisis'} />
              </CardContent>
              <CardFooter className="px-6 pb-6 pt-0">
                <Button size="sm" type="submit" className="w-full bg-primary hover:bg-primary/90 h-11 rounded-xl font-black uppercase tracking-widest text-[10px]" disabled={isSendingMessage || isCountrySuspended || activeOverlay?.type === 'crisis'}>
                  {isSendingMessage ? t.sending : t.send}
                </Button>
              </CardFooter>
            </form>
          </Card>

          <Card className="rounded-3xl border-primary/10 glass-card">
            <CardHeader className="py-4 px-6 flex flex-row items-center justify-between">
              <div className="flex items-center gap-3">
                <ListOrdered size={20} className="text-primary" />
                <CardTitle className="text-sm font-black uppercase tracking-widest text-primary/80">{t.speakersList}</CardTitle>
              </div>
              <Badge className="bg-primary rounded-lg font-black">{activeSpeakers.length}</Badge>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              <ScrollArea className="h-[280px]">
                <div className="space-y-3">
                  {activeSpeakers.map((s, i) => (
                    <div key={s.id} className={`flex justify-between items-center p-4 rounded-2xl border transition-all duration-300 ${i === 0 ? 'bg-primary/5 border-primary/20 shadow-sm' : 'bg-white border-primary/5 shadow-inner'}`}>
                      <div className="flex items-center gap-4">
                        <span className={`text-xs font-black h-7 w-7 flex items-center justify-center rounded-xl ${i === 0 ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}`}>{i + 1}</span>
                        <span className={`text-xs font-bold uppercase tracking-tight ${i === 0 ? 'text-primary' : 'text-foreground/70'}`}>{s.country_name}</span>
                      </div>
                      {i === 0 && <Badge className="bg-primary/10 text-primary border-primary/20 text-[9px] font-black animate-pulse px-2">ORATEUR ACTUEL</Badge>}
                    </div>
                  ))}
                  {activeSpeakers.length === 0 && (
                    <div className="text-center py-16 text-muted-foreground/50 text-xs italic font-medium">{t.noSpeaker}</div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-primary/10 glass-card">
            <CardHeader className="pb-4 px-6"><CardTitle className="flex items-center gap-3 text-lg font-black uppercase tracking-tight text-gradient"><Send size={18} /> {t.myEnvois}</CardTitle></CardHeader>
            <CardContent className="px-6 pb-6">
              <ScrollArea className="h-[350px]">
                <div className="space-y-4">
                  {myEnvois.map(item => (
                    <div key={item.id} className="p-4 border border-primary/5 rounded-2xl bg-white shadow-sm transition-all hover:shadow-md">
                      <div className="flex justify-between items-center mb-3">
                        <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest border-primary/10 text-primary/70">{item._type === 'resolution' ? t.resolution : t.message}</Badge>
                        {item._type === 'resolution' ? <Badge variant={item.status === 'approved' ? 'default' : item.status === 'rejected' ? 'destructive' : 'secondary'} className="uppercase text-[9px] font-black">{item.status.toUpperCase()}</Badge> : <Badge variant="ghost" className="opacity-60">{item.is_read ? <Check size={14} className="text-green-500" /> : <Clock size={14} />}</Badge>}
                      </div>
                      {item._type === 'resolution' && <div className="mb-2 font-black uppercase text-primary tracking-tight text-sm break-words">{item.title}</div>}
                      <div className="text-xs font-medium text-foreground/70 whitespace-pre-wrap break-words italic" dangerouslySetInnerHTML={{ __html: item.content }} />
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-8 space-y-8">
          <Card className="rounded-[2.5rem] border-primary/10 glass-card overflow-hidden shadow-2xl">
            <CardHeader className="bg-primary/[0.03] border-b border-primary/5 p-8">
              <div className="flex justify-between items-center mb-4">
                <Badge className="bg-primary rounded-xl px-4 py-1 font-black text-[10px] tracking-widest">{t.currentSession}</Badge>
              </div>
              <CardTitle className="text-4xl md:text-5xl font-black font-headline uppercase tracking-tighter text-gradient leading-none">{isActive ? currentAction.title : t.waitingAction}</CardTitle>
            </CardHeader>
            <CardContent className="p-10 space-y-12">
              {isActive ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
                    <GlobalTimer status={currentAction.status} startedAt={currentAction.started_at} pausedAt={currentAction.paused_at} totalElapsedSeconds={currentAction.total_elapsed_seconds} durationMinutes={currentAction.duration_minutes} />
                    <div className="bg-primary/[0.02] p-10 rounded-[2.5rem] border-2 border-dashed border-primary/10 flex flex-col items-center justify-center gap-6 shadow-inner">
                      <div className="flex items-center gap-3 text-[10px] font-black text-primary/60 uppercase tracking-[0.3em]"><Timer size={20} /> {t.speakerChrono}</div>
                      <SpeakingTimer status={currentAction.speaking_timer_status} startedAt={currentAction.speaking_timer_started_at} totalElapsedSeconds={currentAction.speaking_timer_total_elapsed || 0} limitSeconds={parseTimePerDelegate(currentAction.time_per_delegate)} size="lg" />
                    </div>
                  </div>
                  {currentAction.allow_participation && currentAction.status === 'launched' && (
                    <div className="pt-10 border-t border-primary/5 text-center">
                      <div className="grid grid-cols-2 gap-8 max-w-xl mx-auto">
                        <Button size="lg" className={`h-24 md:h-28 text-2xl font-black uppercase tracking-tight rounded-[2rem] gap-4 shadow-xl transition-all hover:scale-[1.03] ${participationStatus === 'participating' ? 'bg-green-600 shadow-green-600/20' : 'bg-primary shadow-primary/20'}`} onClick={() => handleParticipation('participating')} disabled={isCountrySuspended || activeOverlay?.type === 'crisis'}><CheckCircle2 size={32} /> {t.participate}</Button>
                        <Button size="lg" variant="outline" className={`h-24 md:h-28 text-2xl font-black uppercase tracking-tight rounded-[2rem] gap-4 border-2 transition-all hover:scale-[1.03] ${participationStatus === 'passing' ? 'border-destructive text-destructive bg-destructive/5' : 'border-primary/20 text-primary/60 hover:bg-primary/5'}`} onClick={() => handleParticipation('passing')} disabled={isCountrySuspended || activeOverlay?.type === 'crisis'}><XCircle size={32} /> {t.pass}</Button>
                      </div>
                    </div>
                  )}
                </>
              ) : <div className="py-24 text-center opacity-20"><Monitor size={80} className="mx-auto mb-6" /></div>}
            </CardContent>
          </Card>

          {displayedResolutions.map((res) => (
            <Card key={res.id} className="rounded-[2.5rem] border-primary border-4 bg-primary/[0.02] shadow-2xl animate-in fade-in zoom-in duration-500 overflow-hidden relative">
              <div className="absolute top-0 right-0 p-8">
                <Badge variant={res.status === 'approved' ? 'default' : res.status === 'rejected' ? 'destructive' : 'secondary'} className="uppercase font-black px-4 h-8 text-[10px] tracking-widest">{res.status.toUpperCase()}</Badge>
              </div>
              <CardHeader className="border-b border-primary/10 p-10 bg-white/60 backdrop-blur-sm">
                <div className="space-y-3">
                  <Badge className="bg-primary rounded-xl px-4 py-1 font-black text-[10px] tracking-widest"><Monitor size={14} className="mr-2" /> {t.projected}</Badge>
                  <CardTitle className="text-4xl font-black text-gradient uppercase tracking-tight break-words pr-24">{res.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-10 text-left">
                <div className="mb-8 flex flex-wrap gap-3 items-center">
                  <Badge variant="outline" className="bg-primary/5 border-primary/10 text-primary py-2 px-4 text-[10px] font-black uppercase tracking-widest">DÉLÉGATION: {res.proposing_country}</Badge>
                  {res.spokesperson && <Badge variant="outline" className="bg-secondary text-foreground/60 border-primary/10 py-2 px-4 text-[10px] font-black uppercase tracking-widest gap-2"><User size={12} /> {t.spokesperson}: {res.spokesperson}</Badge>}
                  {res.sponsors && <Badge variant="outline" className="bg-muted text-muted-foreground border-primary/10 py-2 px-4 text-[10px] font-black uppercase tracking-widest gap-2"><Users size={12} /> {t.sponsors}: {res.sponsors}</Badge>}
                </div>
                <div className="text-xl leading-relaxed font-serif italic text-foreground/80 whitespace-pre-wrap break-words prose prose-xl max-w-none border-l-4 border-primary/20 pl-8" dangerouslySetInnerHTML={{ __html: res.content }} />
              </CardContent>
            </Card>
          ))}

          <Card className={`rounded-[2.5rem] shadow-xl overflow-hidden glass-card transition-all duration-500 ${(!allowResolutions || isCountrySuspended || activeOverlay?.type === 'crisis') ? 'opacity-50 grayscale pointer-events-none' : ''}`}>
            <CardHeader className="bg-secondary/50 border-b border-primary/5 p-8 flex flex-row items-center justify-between">
              <CardTitle className="text-3xl font-black uppercase tracking-tight text-gradient">{t.submitResolution}</CardTitle>
              {(!allowResolutions || isCountrySuspended || activeOverlay?.type === 'crisis') && <Badge variant="destructive" className="font-black h-8 px-4"><Lock size={14} className="mr-2" /> {t.submissionsSuspended}</Badge>}
            </CardHeader>
            <form onSubmit={submitResolution}>
              <CardContent className="p-8 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-primary/60">{t.title}</Label>
                    <Input placeholder="..." className="rounded-2xl border-primary/10 h-14 font-bold" value={resolutionForm.title} onChange={e => setResolutionForm({...resolutionForm, title: e.target.value})} required disabled={!allowResolutions} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-primary/60">{t.spokesperson}</Label>
                    <Input placeholder={t.countryName} className="rounded-2xl border-primary/10 h-14 font-bold" value={resolutionForm.spokesperson} onChange={e => setResolutionForm({...resolutionForm, spokesperson: e.target.value})} required disabled={!allowResolutions} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-primary/60">{t.sponsors}</Label>
                  <Input placeholder="..." className="rounded-2xl border-primary/10 h-14 font-bold" value={resolutionForm.sponsors} onChange={e => setResolutionForm({...resolutionForm, sponsors: e.target.value})} disabled={!allowResolutions} />
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-primary/60">{t.content}</Label>
                    <div className="flex gap-2 bg-secondary p-1 rounded-xl border border-primary/5">
                      <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg hover:bg-white" onClick={() => wrapText('b')}><Bold size={16} /></Button>
                      <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg hover:bg-white" onClick={() => wrapText('i')}><Italic size={16} /></Button>
                      <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg hover:bg-white" onClick={() => wrapText('u')}><Underline size={16} /></Button>
                    </div>
                  </div>
                  <Textarea ref={textAreaRef} className="min-h-[350px] text-xl leading-relaxed font-serif rounded-[2rem] border-primary/10 bg-white/50 p-8 shadow-inner" value={resolutionForm.content} onChange={e => setResolutionForm({...resolutionForm, content: e.target.value})} required disabled={!allowResolutions} />
                  
                  {resolutionForm.content && (
                    <div className="mt-6 p-8 rounded-[2rem] bg-primary/[0.01] border border-primary/5 shadow-inner">
                      <div className="flex items-center gap-2 text-[10px] font-black text-primary/40 uppercase tracking-[0.3em] mb-6">
                        <Eye size={16} /> {t.preview}
                      </div>
                      <div 
                        className="text-xl font-serif leading-relaxed text-left italic text-foreground/60 whitespace-pre-wrap break-words prose prose-lg max-w-none"
                        dangerouslySetInnerHTML={{ __html: resolutionForm.content }}
                      />
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter className="p-8 pt-0">
                <Button type="submit" disabled={!allowResolutions} className="w-full h-20 bg-primary hover:bg-primary/90 text-2xl font-black uppercase tracking-widest rounded-[2rem] gap-4 shadow-2xl shadow-primary/20 transition-all hover:scale-[1.01]">
                  <Send size={28} /> {t.transmit}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      </main>
    </div>
  );
}