"use client"

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Send, CheckCircle2, XCircle, LogOut, FileText, Monitor, Clock, Timer, MessageSquarePlus, MessageSquare, Check, Bold, Italic, Underline, Eye, ThumbsUp, ThumbsDown, CircleSlash, ShieldAlert, Lock, AlertTriangle, User, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, setDoc, doc, increment, updateDoc } from 'firebase/firestore';
import { useRealtime } from '@/hooks/use-realtime';
import { SuspensionOverlay } from '@/components/SuspensionOverlay';
import { GlobalTimer } from '@/components/GlobalTimer';
import { SpeakingTimer } from '@/components/SpeakingTimer';
import { useToast } from '@/hooks/use-toast';

export default function DelegateDashboard() {
  const router = useRouter();
  const { toast } = useToast();
  const { isSuspended: isGlobalSuspended, allowResolutions, currentAction, activeOverlay } = useRealtime();
  const [delegate, setDelegate] = useState<any>(null);
  const [participationStatus, setParticipationStatus] = useState<string | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [isCountrySuspended, setIsCountrySuspended] = useState(false);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const lastOverlayType = useRef<string | null>(null);
  
  const [resolutionForm, setResolutionForm] = useState({
    title: '',
    spokesperson: '',
    sponsors: '',
    content: ''
  });
  const [messageForm, setMessageForm] = useState({
    type: 'privilege',
    content: ''
  });
  const [isSendingMessage, setIsSendingMessage] = useState(false);

  const [myResolutions, setMyResolutions] = useState<any[]>([]);
  const [myMessages, setMyMessages] = useState<any[]>([]);
  const [displayedResolutions, setDisplayedResolutions] = useState<any[]>([]);

  useEffect(() => {
    const session = localStorage.getItem('delegate_session');
    if (!session) {
      router.push('/delegate/login');
      return;
    }
    const del = JSON.parse(session);
    setDelegate(del);

    const unsubDelegate = onSnapshot(doc(db, 'delegates', del.id), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setIsCountrySuspended(data.is_suspended === true);
      }
    });

    const resRef = collection(db, 'resolutions');
    const qRes = query(resRef, where('proposing_country', '==', del.country_name));
    const unsubRes = onSnapshot(qRes, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), _type: 'resolution' }));
      setMyResolutions(data.sort((a: any, b: any) => (b.created_at?.seconds || 0) - (a.created_at?.seconds || 0)));
    });

    const msgRef = collection(db, 'messages');
    const qMsg = query(msgRef, where('sender_country', '==', del.country_name));
    const unsubMsg = onSnapshot(qMsg, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), _type: 'message' }));
      setMyMessages(data.sort((a: any, b: any) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0)));
    });

    const qDisplayed = query(collection(db, 'resolutions'), where('is_displayed', '==', true));
    const unsubDisplayed = onSnapshot(qDisplayed, (snap) => {
      setDisplayedResolutions(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
      unsubDelegate();
      unsubRes();
      unsubMsg();
      unsubDisplayed();
    };
  }, [router]);

  useEffect(() => {
    if (!currentAction || !delegate) return;
    const partId = `${currentAction.id}_${delegate.id}`;
    const unsub = onSnapshot(doc(db, 'participations', partId), (snap) => {
      if (snap.exists()) {
        setParticipationStatus(snap.data().status);
      } else {
        setParticipationStatus(null);
      }
    });
    return () => unsub();
  }, [currentAction, delegate]);

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
      const context = new (window.AudioContext || (window as any).webkitAudioContext)();
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

      for(let i = 0; i < 4; i++) {
        playPulse(now + i * 0.6);
      }
    } catch (e) {
      console.warn("Audio Context blocked");
    }
  };

  const handleParticipation = async (status: 'participating' | 'passing') => {
    if (!currentAction || !delegate || isCountrySuspended) return;
    try {
      const participationId = `${currentAction.id}_${delegate.id}`;
      await setDoc(doc(db, 'participations', participationId), {
        action_id: currentAction.id,
        delegate_id: delegate.id,
        country_name: delegate.country_name,
        status: status,
        updated_at: serverTimestamp()
      });
      toast({ title: "Choix enregistré" });
    } catch (e) {
      toast({ title: "Erreur", description: "Échec de l'enregistrement.", variant: "destructive" });
    }
  };

  const handleVote = async (choice: 'pour' | 'contre' | 'abstention') => {
    if (!activeOverlay || activeOverlay.type !== 'vote' || hasVoted || isCountrySuspended) return;
    try {
      const sessionRef = doc(db, 'sessionState', 'current');
      await updateDoc(sessionRef, {
        [`activeOverlay.results.${choice}`]: increment(1)
      });
      setHasVoted(true);
      toast({ title: "Vote enregistré" });
    } catch (e) {
      toast({ title: "Erreur lors du vote", variant: "destructive" });
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
    } 
    else if (
      text.substring(start - openTag.length, start) === openTag &&
      text.substring(end, end + closeTag.length) === closeTag
    ) {
      newText = text.substring(0, start - openTag.length) + selectedText + text.substring(end + closeTag.length);
      newSelectionStart = start - openTag.length;
      newSelectionEnd = end - openTag.length;
    }
    else {
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
    if (!delegate || !allowResolutions || isCountrySuspended) return;
    try {
      await addDoc(collection(db, 'resolutions'), {
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
      toast({ title: "Soumis avec succès" });
    } catch (e) {
      toast({ title: "Erreur lors de l'envoi.", variant: "destructive" });
    }
  };

  const submitMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!delegate || !messageForm.content || isCountrySuspended) return;
    setIsSendingMessage(true);
    try {
      await addDoc(collection(db, 'messages'), {
        sender_country: delegate.country_name,
        type: messageForm.type,
        content: messageForm.content,
        timestamp: serverTimestamp(),
        is_read: false
      });
      setMessageForm({ ...messageForm, content: '' });
      toast({ title: "Message envoyé à la présidence" });
    } catch (e) {
      toast({ title: "Erreur d'envoi", variant: "destructive" });
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
    <div className="min-h-screen bg-background flex flex-col relative">
      {isGlobalSuspended && <SuspensionOverlay />}
      
      {isCountrySuspended && (
        <div className="fixed inset-0 z-[10000] bg-destructive/95 flex flex-col items-center justify-center p-8 text-white animate-in fade-in zoom-in duration-300">
          <ShieldAlert size={100} className="mb-8" />
          <h1 className="text-5xl font-black uppercase text-center mb-4">Délégation Suspendue</h1>
          <p className="text-2xl text-center opacity-90 max-w-2xl">
            Votre délégation a été suspendue de parole et d'interaction par la présidence. Veuillez patienter jusqu'au rétablissement officiel.
          </p>
        </div>
      )}
      
      {activeOverlay && activeOverlay.type !== 'none' && (
        <div className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center p-6 text-white animate-in fade-in zoom-in duration-500 ${activeOverlay.type === 'crisis' ? 'bg-red-700' : 'bg-primary'}`}>
          <div className="max-w-4xl w-full text-center space-y-8">
            {activeOverlay.type === 'crisis' && (
              <div className="flex flex-col items-center gap-4 mb-4 animate-pulse">
                <AlertTriangle size={80} className="text-white" />
                <h2 className="text-2xl md:text-4xl font-black uppercase tracking-tighter leading-tight bg-white text-red-700 px-10 py-3">URGENCE : CRISE</h2>
              </div>
            )}
            
            <h1 className="text-4xl md:text-7xl font-black uppercase tracking-tighter leading-tight border-b-4 md:border-b-8 border-white pb-6 break-words">
              {activeOverlay.title}
            </h1>
            
            {activeOverlay.type === 'vote' && (
              <div className="space-y-10">
                <div className="grid grid-cols-3 gap-4 md:gap-8">
                  <div className="flex flex-col items-center gap-4">
                    <Button 
                      size="lg" 
                      className="w-full h-24 md:h-32 bg-green-500 hover:bg-green-600 text-xl md:text-3xl font-bold gap-2 md:gap-4 shadow-2xl transition-transform active:scale-95 disabled:opacity-50"
                      onClick={() => handleVote('pour')}
                      disabled={hasVoted || isCountrySuspended}
                    >
                      <ThumbsUp className="h-6 w-6 md:h-10 md:w-10" /> POUR
                    </Button>
                    <div className="text-3xl md:text-5xl font-black tabular-nums">{activeOverlay.results?.pour || 0}</div>
                  </div>
                  <div className="flex flex-col items-center gap-4">
                    <Button 
                      size="lg" 
                      className="w-full h-24 md:h-32 bg-red-500 hover:bg-red-600 text-xl md:text-3xl font-bold gap-2 md:gap-4 shadow-2xl transition-transform active:scale-95 disabled:opacity-50"
                      onClick={() => handleVote('contre')}
                      disabled={hasVoted || isCountrySuspended}
                    >
                      <ThumbsDown className="h-6 w-6 md:h-10 md:w-10" /> CONTRE
                    </Button>
                    <div className="text-3xl md:text-5xl font-black tabular-nums">{activeOverlay.results?.contre || 0}</div>
                  </div>
                  <div className="flex flex-col items-center gap-4">
                    <Button 
                      size="lg" 
                      className="w-full h-24 md:h-32 bg-yellow-500 hover:bg-yellow-600 text-xl md:text-3xl font-bold gap-2 md:gap-4 shadow-2xl transition-transform active:scale-95 disabled:opacity-50"
                      onClick={() => handleVote('abstention')}
                      disabled={hasVoted || isCountrySuspended}
                    >
                      <CircleSlash className="h-6 w-6 md:h-10 md:w-10" /> ABST.
                    </Button>
                    <div className="text-3xl md:text-5xl font-black tabular-nums">{activeOverlay.results?.abstention || 0}</div>
                  </div>
                </div>
                {hasVoted && <div className="text-lg md:text-xl font-bold uppercase tracking-widest text-white/80 animate-pulse bg-white/20 py-4 rounded-full">Vote enregistré avec succès</div>}
              </div>
            )}
            
            {(activeOverlay.type === 'message' || activeOverlay.type === 'crisis') && (
              <div className="space-y-4">
                <div className="text-xl md:text-2xl font-black uppercase tracking-[0.2em] text-white/80 animate-pulse">
                  {activeOverlay.type === 'crisis' ? "APPEL À L'ACTION" : "Annonce de la Présidence"}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <header className="bg-secondary text-white p-4 shadow-md flex justify-between items-center z-20">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold font-headline uppercase tracking-widest">{delegate.country_name}</h1>
          <Badge variant="outline" className="text-white border-white/30 uppercase text-[10px]">Session Active</Badge>
          {activeOverlay?.type === 'crisis' && <Badge variant="destructive" className="bg-red-600 animate-bounce font-black uppercase">Crise en cours</Badge>}
        </div>
        <div className="flex items-center gap-4">
          <Button variant="ghost" className="text-white hover:bg-white/10" onClick={handleLogout}>
            <LogOut size={20} />
          </Button>
        </div>
      </header>

      <main className="flex-1 p-6 grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-[1400px] mx-auto w-full">
        <div className="lg:col-span-4 space-y-6">
          <Card className="border-secondary/30 bg-secondary/5">
            <CardHeader className="py-3 px-4 flex flex-row items-center gap-2">
              <MessageSquarePlus size={18} className="text-secondary" />
              <CardTitle className="text-sm font-bold uppercase tracking-tight">Message à la Présidence</CardTitle>
            </CardHeader>
            <form onSubmit={submitMessage}>
              <CardContent className="px-4 pb-3 space-y-3">
                <Select value={messageForm.type} onValueChange={(val) => setMessageForm({...messageForm, type: val})} disabled={isCountrySuspended || activeOverlay?.type === 'crisis'}>
                  <SelectTrigger className="h-8 text-xs bg-white">
                    <SelectValue placeholder="Type de message" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="privilege">Point de privilège personnel</SelectItem>
                    <SelectItem value="general">Message général</SelectItem>
                  </SelectContent>
                </Select>
                <Textarea 
                  placeholder="Votre message..." 
                  className="min-h-[60px] text-xs resize-none break-words"
                  value={messageForm.content}
                  onChange={(e) => setMessageForm({...messageForm, content: e.target.value})}
                  required
                  disabled={isCountrySuspended || activeOverlay?.type === 'crisis'}
                />
              </CardContent>
              <CardFooter className="px-4 pb-3 pt-0">
                <Button size="sm" type="submit" className="w-full bg-secondary text-xs h-8" disabled={isSendingMessage || isCountrySuspended || activeOverlay?.type === 'crisis'}>
                  {isSendingMessage ? "Envoi..." : "Envoyer"}
                </Button>
              </CardFooter>
            </form>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg"><Send size={18} /> Mes Envois</CardTitle>
            </CardHeader>
            <CardContent className="px-4">
              <ScrollArea className="h-[500px]">
                <div className="space-y-3">
                  {myEnvois.map(item => (
                    <div key={item.id} className="p-3 border rounded-lg bg-muted/10 text-xs">
                      <div className="flex justify-between items-center mb-2">
                        <Badge variant="outline" className="text-[10px] uppercase">
                          {item._type === 'resolution' ? 'Résolution' : item.type === 'privilege' ? 'Privilège' : 'Message'}
                        </Badge>
                        {item._type === 'resolution' ? (
                          <Badge variant={item.status === 'approved' ? 'default' : item.status === 'rejected' ? 'destructive' : 'secondary'}>
                            {item.status.toUpperCase()}
                          </Badge>
                        ) : (
                          <Badge variant="ghost" className="opacity-60">
                            {item.is_read ? <Check size={12} className="text-green-500" /> : <Clock size={12} />}
                          </Badge>
                        )}
                      </div>
                      {item._type === 'resolution' && (
                        <div className="mb-2 font-black uppercase text-secondary break-words">{item.title}</div>
                      )}
                      <div 
                        className="text-foreground whitespace-pre-wrap break-words prose prose-sm max-w-none"
                        dangerouslySetInnerHTML={{ __html: item.content }}
                      />
                    </div>
                  ))}
                  {myEnvois.length === 0 && <p className="text-xs text-center text-muted-foreground italic py-4">Aucun envoi trouvé.</p>}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-8 space-y-6">
          <Card className="border-secondary/20 shadow-xl overflow-hidden">
            <CardHeader className="bg-secondary/5 border-b pb-4">
              <div className="flex justify-between items-center">
                <Badge className="bg-secondary">SÉANCE EN COURS</Badge>
                {isActive && <Badge variant="outline" className="text-[10px] opacity-60">Temps alloué: {currentAction.time_per_delegate}</Badge>}
              </div>
              <CardTitle className="text-3xl font-headline mt-2 break-words">{isActive ? currentAction.title : 'En attente d\'une action...'}</CardTitle>
              {isActive && <CardDescription className="text-lg break-words">{currentAction.description}</CardDescription>}
            </CardHeader>
            <CardContent className="p-8 space-y-8">
              {isActive ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                    <GlobalTimer 
                      status={currentAction.status}
                      startedAt={currentAction.started_at}
                      pausedAt={currentAction.paused_at}
                      totalElapsedSeconds={currentAction.total_elapsed_seconds}
                      durationMinutes={currentAction.duration_minutes}
                    />
                    
                    <div className="bg-muted/30 p-8 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-4">
                      <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-widest">
                        <Timer size={18} /> Chrono Orateur
                      </div>
                      <SpeakingTimer 
                        status={currentAction.speaking_timer_status}
                        startedAt={currentAction.speaking_timer_started_at}
                        totalElapsedSeconds={currentAction.speaking_timer_total_elapsed || 0}
                        limitSeconds={parseTimePerDelegate(currentAction.time_per_delegate)}
                        size="lg"
                      />
                    </div>
                  </div>
                  
                  {currentAction.allow_participation && currentAction.status === 'launched' && (
                    <div className="pt-6 border-t text-center">
                      <p className="text-sm font-bold text-muted-foreground uppercase mb-4">Inscription sur la liste des orateurs</p>
                      <div className="grid grid-cols-2 gap-6 max-w-md mx-auto">
                        <Button 
                          size="lg" 
                          className={`h-24 text-xl gap-3 shadow-lg transition-transform hover:scale-105 ${participationStatus === 'participating' ? 'bg-green-600' : 'bg-primary'}`}
                          onClick={() => handleParticipation('participating')}
                          disabled={isCountrySuspended || activeOverlay?.type === 'crisis'}
                        >
                          <CheckCircle2 size={28} /> Participer
                        </Button>
                        <Button 
                          size="lg" 
                          variant="outline" 
                          className={`h-24 text-xl gap-3 border-2 transition-transform hover:scale-105 ${participationStatus === 'passing' ? 'border-destructive text-destructive' : 'border-secondary text-secondary'}`}
                          onClick={() => handleParticipation('passing')}
                          disabled={isCountrySuspended || activeOverlay?.type === 'crisis'}
                        >
                          <XCircle size={28} /> Passer
                        </Button>
                      </div>
                    </div>
                  )}

                  {currentAction.status === 'started' && (
                    <div className="bg-primary/5 p-4 rounded-xl flex items-center justify-center gap-3 text-primary animate-pulse border border-primary/20">
                      <span className="font-black text-sm uppercase tracking-[0.2em]">DÉBAT OUVERT - LA PAROLE EST AUX DÉLÉGUÉS</span>
                    </div>
                  )}
                </>
              ) : (
                <div className="py-20 text-center space-y-4">
                  <Monitor size={60} className="mx-auto text-muted-foreground/30" />
                  <p className="text-muted-foreground italic">En attente d'une action de la présidence.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {displayedResolutions.length > 0 && (
            <div className="space-y-6">
              {displayedResolutions.map((res) => (
                <Card key={res.id} className="border-primary border-4 bg-primary/5 shadow-2xl animate-in fade-in zoom-in duration-500 overflow-hidden">
                  <CardHeader className="flex flex-row items-center justify-between border-b border-primary/20 pb-4 bg-white/50">
                    <div className="space-y-1">
                      <Badge className="gap-1 mb-2 bg-primary"><Monitor size={12} /> PROJETÉ AU COMITÉ</Badge>
                      <CardTitle className="text-2xl text-primary font-black uppercase tracking-tight break-words">{res.title}</CardTitle>
                    </div>
                    <Badge variant={res.status === 'approved' ? 'default' : res.status === 'rejected' ? 'destructive' : 'secondary'} className="h-fit py-0 px-2 text-[10px]">
                      {res.status.toUpperCase()}
                    </Badge>
                  </CardHeader>
                  <CardContent className="pt-8 text-left">
                    <div className="mb-6 flex flex-wrap gap-2 items-center">
                      <Badge variant="outline" className="bg-primary/10 border-primary/30 text-primary py-1 px-2 text-xs font-bold uppercase tracking-widest break-words">
                        DE: {res.proposing_country}
                      </Badge>
                      {res.spokesperson && (
                        <Badge variant="outline" className="bg-secondary/10 border-secondary/30 text-secondary py-1 px-2 text-xs font-bold uppercase tracking-widest break-words gap-1">
                          <User size={12} /> Porte-parole: {res.spokesperson}
                        </Badge>
                      )}
                      {res.sponsors && (
                        <Badge variant="outline" className="bg-muted border-muted-foreground/30 text-muted-foreground py-1 px-2 text-xs font-bold uppercase tracking-widest break-words gap-1">
                          <Users size={12} /> Sponsors: {res.sponsors}
                        </Badge>
                      )}
                    </div>
                    <div 
                      className="text-lg leading-relaxed font-serif whitespace-pre-wrap break-words prose prose-lg max-w-none text-left"
                      dangerouslySetInnerHTML={{ __html: res.content }}
                    />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <Card className={`shadow-xl transition-all ${(!allowResolutions || isCountrySuspended || activeOverlay?.type === 'crisis') ? 'opacity-70 grayscale pointer-events-none' : 'hover:shadow-2xl'}`}>
            <CardHeader className="bg-secondary/5 border-b mb-6 flex flex-row items-center justify-between">
              <CardTitle className="text-2xl font-headline">Soumettre une Résolution</CardTitle>
              {(!allowResolutions || isCountrySuspended || activeOverlay?.type === 'crisis') && (
                <Badge variant="destructive" className="gap-1"><Lock size={12} /> ENVOIS SUSPENDUS</Badge>
              )}
            </CardHeader>
            <form onSubmit={submitResolution}>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="title" className="font-bold">Titre de la Résolution</Label>
                    <Input 
                      id="title" 
                      placeholder="Ex: Protection des civils en zone de conflit" 
                      disabled={!allowResolutions || isCountrySuspended || activeOverlay?.type === 'crisis'}
                      value={resolutionForm.title} 
                      onChange={e => setResolutionForm({...resolutionForm, title: e.target.value})} 
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="spokesperson" className="font-bold">Porte-parole</Label>
                    <Input 
                      id="spokesperson" 
                      placeholder="Nom du pays" 
                      disabled={!allowResolutions || isCountrySuspended || activeOverlay?.type === 'crisis'}
                      value={resolutionForm.spokesperson} 
                      onChange={e => setResolutionForm({...resolutionForm, spokesperson: e.target.value})} 
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sponsors" className="font-bold">Pays Sponsors</Label>
                  <Input 
                    id="sponsors" 
                    placeholder="France, Japon, Brésil..." 
                    disabled={!allowResolutions || isCountrySuspended || activeOverlay?.type === 'crisis'}
                    value={resolutionForm.sponsors} 
                    onChange={e => setResolutionForm({...resolutionForm, sponsors: e.target.value})} 
                  />
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="content" className="font-bold">Texte de la Résolution</Label>
                    <div className="flex gap-1">
                      <Button type="button" variant="outline" size="sm" className="h-7 w-7 p-0" onClick={() => wrapText('b')} disabled={isCountrySuspended || activeOverlay?.type === 'crisis'}><Bold size={14} /></Button>
                      <Button type="button" variant="outline" size="sm" className="h-7 w-7 p-0" onClick={() => wrapText('i')} disabled={isCountrySuspended || activeOverlay?.type === 'crisis'}><Italic size={14} /></Button>
                      <Button type="button" variant="outline" size="sm" className="h-7 w-7 p-0" onClick={() => wrapText('u')} disabled={isCountrySuspended || activeOverlay?.type === 'crisis'}><Underline size={14} /></Button>
                    </div>
                  </div>
                  <Textarea 
                    id="content" 
                    ref={textAreaRef}
                    className="min-h-[250px] text-lg leading-relaxed whitespace-pre-wrap break-words font-serif" 
                    required 
                    disabled={!allowResolutions || isCountrySuspended || activeOverlay?.type === 'crisis'}
                    placeholder="Rédigez ici votre projet. Utilisez les boutons ci-dessus pour le style."
                    value={resolutionForm.content} 
                    onChange={e => setResolutionForm({...resolutionForm, content: e.target.value})} 
                  />
                  
                  {resolutionForm.content && (
                    <div className="mt-4 p-4 border rounded-lg bg-muted/5">
                      <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase mb-2">
                        <Eye size={12} /> Aperçu en temps réel
                      </div>
                      <div 
                        className="text-lg font-serif leading-relaxed text-left whitespace-pre-wrap break-words prose prose-neutral max-w-none"
                        dangerouslySetInnerHTML={{ __html: resolutionForm.content }}
                      />
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  type="submit" 
                  disabled={!allowResolutions || isCountrySuspended || activeOverlay?.type === 'crisis'}
                  className="w-full h-16 bg-secondary text-xl font-bold gap-3 shadow-lg"
                >
                  <Send size={24} /> Transmettre au Bureau
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      </main>
    </div>
  );
}
