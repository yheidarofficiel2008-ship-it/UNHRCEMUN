
"use client"

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Send, CheckCircle2, XCircle, Landmark, LogOut, FileText, Monitor, Clock, Timer, Lock, MessageSquarePlus, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, orderBy, addDoc, serverTimestamp, setDoc, doc } from 'firebase/firestore';
import { useRealtime } from '@/hooks/use-realtime';
import { SuspensionOverlay } from '@/components/SuspensionOverlay';
import { GlobalTimer } from '@/components/GlobalTimer';
import { SpeakingTimer } from '@/components/SpeakingTimer';
import { useToast } from '@/hooks/use-toast';

export default function DelegateDashboard() {
  const router = useRouter();
  const { toast } = useToast();
  const { isSuspended, allowResolutions, currentAction } = useRealtime();
  const [delegate, setDelegate] = useState<any>(null);
  const [participationStatus, setParticipationStatus] = useState<string | null>(null);
  
  const [resolutionForm, setResolutionForm] = useState({
    sponsors: '',
    content: ''
  });
  const [messageForm, setMessageForm] = useState({
    type: 'privilege',
    content: ''
  });
  const [isSendingMessage, setIsSendingMessage] = useState(false);

  const [myResolutions, setMyResolutions] = useState<any[]>([]);
  const [displayedResolutions, setDisplayedResolutions] = useState<any[]>([]);

  useEffect(() => {
    const session = localStorage.getItem('delegate_session');
    if (!session) {
      router.push('/delegate/login');
      return;
    }
    const del = JSON.parse(session);
    setDelegate(del);

    // Mes résolutions
    const resRef = collection(db, 'resolutions');
    const q = query(resRef, where('proposing_country', '==', del.country_name), orderBy('created_at', 'desc'));
    const unsubRes = onSnapshot(q, (snapshot) => {
      setMyResolutions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // Résolutions projetées
    const qDisplayed = query(collection(db, 'resolutions'), where('is_displayed', '==', true));
    const unsubDisplayed = onSnapshot(qDisplayed, (snap) => {
      setDisplayedResolutions(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
      unsubRes();
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

  const handleParticipation = async (status: 'participating' | 'passing') => {
    if (!currentAction || !delegate) return;
    
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

  const submitResolution = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!delegate || !allowResolutions) return;
    try {
      await addDoc(collection(db, 'resolutions'), {
        proposing_country: delegate.country_name,
        sponsors: resolutionForm.sponsors,
        content: resolutionForm.content,
        status: 'pending',
        is_displayed: false,
        created_at: serverTimestamp()
      });
      setResolutionForm({ sponsors: '', content: '' });
      toast({ title: "Soumis avec succès" });
    } catch (e) {
      toast({ title: "Erreur lors de l'envoi.", variant: "destructive" });
    }
  };

  const submitMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!delegate || !messageForm.content) return;
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

  const parseTimePerDelegate = (timeStr: string) => {
    if (!timeStr) return 60;
    const [mins, secs] = timeStr.split(':').map(Number);
    return (mins * 60) + (secs || 0);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {isSuspended && <SuspensionOverlay />}

      <header className="bg-secondary text-white p-4 shadow-md flex justify-between items-center z-20">
        <div className="flex items-center gap-4">
          <Landmark className="h-8 w-8" />
          <h1 className="text-xl font-bold font-headline uppercase tracking-widest">{delegate.country_name}</h1>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="ghost" className="text-white hover:bg-white/10" onClick={handleLogout}>
            <LogOut size={20} />
          </Button>
        </div>
      </header>

      <main className="flex-1 p-6 grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-[1400px] mx-auto w-full">
        {/* Barre latérale gauche */}
        <div className="lg:col-span-4 space-y-6">
          {/* Message à la présidence - En haut et compact */}
          <Card className="border-secondary/30 bg-secondary/5">
            <CardHeader className="py-3 px-4 flex flex-row items-center gap-2">
              <MessageSquarePlus size={18} className="text-secondary" />
              <CardTitle className="text-sm font-bold uppercase tracking-tight">Message à la Présidence</CardTitle>
            </CardHeader>
            <form onSubmit={submitMessage}>
              <CardContent className="px-4 pb-3 space-y-3">
                <Select 
                  value={messageForm.type} 
                  onValueChange={(val) => setMessageForm({...messageForm, type: val})}
                >
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
                  className="min-h-[60px] text-xs resize-none"
                  value={messageForm.content}
                  onChange={(e) => setMessageForm({...messageForm, content: e.target.value})}
                  required
                />
              </CardContent>
              <CardFooter className="px-4 pb-3 pt-0">
                <Button size="sm" type="submit" className="w-full bg-secondary text-xs h-8" disabled={isSendingMessage}>
                  {isSendingMessage ? "Envoi..." : "Envoyer"}
                </Button>
              </CardFooter>
            </form>
          </Card>

          <Card className="border-secondary/20 shadow-lg h-fit">
            <CardHeader className="pb-4">
              <Badge className="w-fit mb-2 bg-secondary">SESSION ACTIVE</Badge>
              <CardTitle className="text-2xl">{isActive ? currentAction.title : 'En attente...'}</CardTitle>
              <CardDescription>{isActive ? currentAction.description : 'La présidence lancera bientôt une action.'}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {isActive && (
                <>
                  <GlobalTimer 
                    status={currentAction.status}
                    startedAt={currentAction.started_at}
                    pausedAt={currentAction.paused_at}
                    totalElapsedSeconds={currentAction.total_elapsed_seconds}
                    durationMinutes={currentAction.duration_minutes}
                  />

                  <div className="bg-muted/30 p-4 rounded-xl border border-dashed flex flex-col items-center gap-3">
                    <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                      <Timer size={14} /> Temps de Parole Orateur
                    </div>
                    <SpeakingTimer 
                      status={currentAction.speaking_timer_status}
                      startedAt={currentAction.speaking_timer_started_at}
                      totalElapsedSeconds={currentAction.speaking_timer_total_elapsed || 0}
                      limitSeconds={parseTimePerDelegate(currentAction.time_per_delegate)}
                      size="sm"
                    />
                    <Badge variant="outline" className="text-[10px] opacity-60">Alloué: {currentAction.time_per_delegate}</Badge>
                  </div>
                  
                  {currentAction.allow_participation && currentAction.status === 'launched' && (
                    <div className="space-y-4">
                      <p className="text-sm font-semibold text-center text-muted-foreground uppercase">Inscription liste orateurs</p>
                      <div className="grid grid-cols-2 gap-4">
                        <Button 
                          size="lg" 
                          className={`h-20 text-lg gap-2 ${participationStatus === 'participating' ? 'bg-green-600' : 'bg-primary'}`}
                          onClick={() => handleParticipation('participating')}
                        >
                          <CheckCircle2 /> Participer
                        </Button>
                        <Button 
                          size="lg" 
                          variant="outline" 
                          className={`h-20 text-lg gap-2 ${participationStatus === 'passing' ? 'border-destructive text-destructive' : 'border-secondary'}`}
                          onClick={() => handleParticipation('passing')}
                        >
                          <XCircle /> Passer
                        </Button>
                      </div>
                    </div>
                  )}

                  {currentAction.status === 'started' && (
                    <div className="bg-primary/10 p-4 rounded-xl flex flex-col items-center gap-2 text-primary animate-pulse border-2 border-primary/20">
                      <Clock size={30} />
                      <span className="font-bold text-sm uppercase tracking-widest">DÉBAT EN COURS</span>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg"><FileText size={18} /> Mes Propositions</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[200px]">
                <div className="space-y-4">
                  {myResolutions.map(res => (
                    <div key={res.id} className="p-4 border rounded-xl bg-muted/20">
                      <Badge variant={res.status === 'approved' ? 'default' : res.status === 'rejected' ? 'destructive' : 'secondary'}>
                        {res.status.toUpperCase()}
                      </Badge>
                      <p className="text-xs mt-2 italic line-clamp-2">"{res.content}"</p>
                    </div>
                  ))}
                  {myResolutions.length === 0 && <p className="text-xs text-center text-muted-foreground italic py-4">Aucun projet envoyé.</p>}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Colonne centrale/droite */}
        <div className="lg:col-span-8 space-y-6">
          {displayedResolutions.length > 0 && (
            <div className="space-y-6">
              {displayedResolutions.map((res) => (
                <Card key={res.id} className="border-primary border-2 bg-primary/5 shadow-2xl animate-in fade-in zoom-in duration-300">
                  <CardHeader className="flex flex-row items-center justify-between border-b border-primary/20 pb-4">
                    <div className="space-y-1">
                      <Badge className="gap-1 mb-2"><Monitor size={12} /> EN DISCUSSION</Badge>
                      <CardTitle className="text-xl text-primary">{res.proposing_country}</CardTitle>
                    </div>
                    <Badge variant={res.status === 'approved' ? 'default' : res.status === 'rejected' ? 'destructive' : 'secondary'} className="text-sm px-4 py-1">
                      {res.status.toUpperCase()}
                    </Badge>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <p className="text-lg italic leading-relaxed font-serif">"{res.content}"</p>
                    {res.sponsors && (
                      <p className="mt-4 text-sm text-muted-foreground font-semibold">Sponsors: {res.sponsors}</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <Card className={`shadow-xl transition-opacity ${!allowResolutions ? 'opacity-70 grayscale' : ''}`}>
            <CardHeader className="bg-secondary/5 border-b mb-6 flex flex-row items-center justify-between">
              <CardTitle className="text-2xl font-headline">Rédiger une Résolution</CardTitle>
              {!allowResolutions && (
                <Badge variant="destructive" className="gap-1"><Lock size={12} /> ENVOIS BLOQUÉS</Badge>
              )}
            </CardHeader>
            <form onSubmit={submitResolution}>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="sponsors">Pays Sponsors</Label>
                  <Input 
                    id="sponsors" 
                    placeholder="Bénin, Togo, Mali..." 
                    disabled={!allowResolutions}
                    value={resolutionForm.sponsors} 
                    onChange={e => setResolutionForm({...resolutionForm, sponsors: e.target.value})} 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="content">Texte de la Résolution</Label>
                  <Textarea 
                    id="content" 
                    className="min-h-[250px]" 
                    required 
                    disabled={!allowResolutions}
                    placeholder={allowResolutions ? "Rédigez ici votre projet de résolution..." : "La présidence a suspendu la réception des résolutions."}
                    value={resolutionForm.content} 
                    onChange={e => setResolutionForm({...resolutionForm, content: e.target.value})} 
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  type="submit" 
                  disabled={!allowResolutions}
                  className="w-full h-14 bg-secondary text-lg gap-2"
                >
                  <Send size={20} /> Envoyer au Bureau
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      </main>
    </div>
  );
}
