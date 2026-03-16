"use client"

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Send, CheckCircle2, XCircle, Landmark, LogOut, FileText, Monitor, Clock, Timer, Lock, MessageSquarePlus, MessageSquare, Check } from 'lucide-react';
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

    // Écoute des résolutions envoyées par ce pays
    const resRef = collection(db, 'resolutions');
    const qRes = query(resRef, where('proposing_country', '==', del.country_name));
    const unsubRes = onSnapshot(qRes, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), _type: 'resolution' }));
      setMyResolutions(data.sort((a: any, b: any) => (b.created_at?.seconds || 0) - (a.created_at?.seconds || 0)));
    });

    // Écoute des messages envoyés par ce pays
    const msgRef = collection(db, 'messages');
    const qMsg = query(msgRef, where('sender_country', '==', del.country_name));
    const unsubMsg = onSnapshot(qMsg, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), _type: 'message' }));
      setMyMessages(data.sort((a: any, b: any) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0)));
    });

    // Résolutions projetées
    const qDisplayed = query(collection(db, 'resolutions'), where('is_displayed', '==', true));
    const unsubDisplayed = onSnapshot(qDisplayed, (snap) => {
      setDisplayedResolutions(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
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
        {/* Colonne latérale GAUCHE (Plus petite) */}
        <div className="lg:col-span-4 space-y-6">
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

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg"><Send size={18} /> Mes Envois</CardTitle>
            </CardHeader>
            <CardContent className="px-4">
              <ScrollArea className="h-[400px]">
                <div className="space-y-3">
                  {myEnvois.map(item => (
                    <div key={item.id} className="p-3 border rounded-lg bg-muted/10 text-xs">
                      <div className="flex justify-between items-center mb-1">
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
                      <p className="italic text-muted-foreground line-clamp-2">"{item.content}"</p>
                    </div>
                  ))}
                  {myEnvois.length === 0 && <p className="text-xs text-center text-muted-foreground italic py-4">Aucun envoi trouvé.</p>}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Colonne CENTRALE (Principale) */}
        <div className="lg:col-span-8 space-y-6">
          {/* SESSION ACTIVE - PLACE PRINCIPALE */}
          <Card className="border-secondary/20 shadow-xl overflow-hidden">
            <CardHeader className="bg-secondary/5 border-b pb-4">
              <div className="flex justify-between items-center">
                <Badge className="bg-secondary">SÉANCE EN COURS</Badge>
                {isActive && <Badge variant="outline" className="text-[10px] opacity-60">Alloué par orateur: {currentAction.time_per_delegate}</Badge>}
              </div>
              <CardTitle className="text-3xl font-headline mt-2">{isActive ? currentAction.title : 'En attente d\'une action...'}</CardTitle>
              {isActive && <CardDescription className="text-lg">{currentAction.description}</CardDescription>}
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
                    <div className="pt-6 border-t">
                      <p className="text-sm font-bold text-center text-muted-foreground uppercase mb-4 tracking-tighter">Souhaitez-vous vous inscrire sur la liste des orateurs ?</p>
                      <div className="grid grid-cols-2 gap-6 max-w-md mx-auto">
                        <Button 
                          size="lg" 
                          className={`h-24 text-xl gap-3 shadow-lg transition-transform hover:scale-105 ${participationStatus === 'participating' ? 'bg-green-600' : 'bg-primary'}`}
                          onClick={() => handleParticipation('participating')}
                        >
                          <CheckCircle2 size={28} /> Participer
                        </Button>
                        <Button 
                          size="lg" 
                          variant="outline" 
                          className={`h-24 text-xl gap-3 border-2 transition-transform hover:scale-105 ${participationStatus === 'passing' ? 'border-destructive text-destructive' : 'border-secondary text-secondary'}`}
                          onClick={() => handleParticipation('passing')}
                        >
                          <XCircle size={28} /> Passer
                        </Button>
                      </div>
                    </div>
                  )}

                  {currentAction.status === 'started' && (
                    <div className="bg-primary/5 p-4 rounded-xl flex items-center justify-center gap-3 text-primary animate-pulse border border-primary/20">
                      <Clock size={20} />
                      <span className="font-black text-sm uppercase tracking-[0.2em]">DÉBAT OUVERT - LA PAROLE EST AUX DÉLÉGUÉS</span>
                    </div>
                  )}
                </>
              ) : (
                <div className="py-20 text-center space-y-4">
                  <Monitor size={60} className="mx-auto text-muted-foreground/30" />
                  <p className="text-muted-foreground italic">Le Bureau de la Présidence n'a pas encore lancé d'action de débat.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* RÉSOLUTIONS PROJETÉES */}
          {displayedResolutions.length > 0 && (
            <div className="space-y-6">
              {displayedResolutions.map((res) => (
                <Card key={res.id} className="border-primary border-4 bg-primary/5 shadow-2xl animate-in fade-in zoom-in duration-500">
                  <CardHeader className="flex flex-row items-center justify-between border-b border-primary/20 pb-4">
                    <div className="space-y-1">
                      <Badge className="gap-1 mb-2 bg-primary"><Monitor size={12} /> PROJETÉ AU COMITÉ</Badge>
                      <CardTitle className="text-2xl text-primary">{res.proposing_country}</CardTitle>
                    </div>
                    <Badge variant={res.status === 'approved' ? 'default' : res.status === 'rejected' ? 'destructive' : 'secondary'} className="text-lg px-6 py-2">
                      {res.status.toUpperCase()}
                    </Badge>
                  </CardHeader>
                  <CardContent className="pt-8">
                    <p className="text-2xl italic leading-relaxed font-serif text-center px-4">"{res.content}"</p>
                    {res.sponsors && (
                      <div className="mt-8 pt-4 border-t border-primary/10 flex justify-center">
                        <p className="text-sm text-muted-foreground font-bold uppercase tracking-widest">Sponsors: <span className="text-primary">{res.sponsors}</span></p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* RÉDACTION DE RÉSOLUTION */}
          <Card className={`shadow-xl transition-all ${!allowResolutions ? 'opacity-70 grayscale pointer-events-none' : 'hover:shadow-2xl'}`}>
            <CardHeader className="bg-secondary/5 border-b mb-6 flex flex-row items-center justify-between">
              <CardTitle className="text-2xl font-headline">Soumettre une Résolution</CardTitle>
              {!allowResolutions && (
                <Badge variant="destructive" className="gap-1"><Lock size={12} /> ENVOIS SUSPENDUS PAR LA PRÉSIDENCE</Badge>
              )}
            </CardHeader>
            <form onSubmit={submitResolution}>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="sponsors" className="font-bold">Pays Sponsors</Label>
                  <Input 
                    id="sponsors" 
                    placeholder="Listez les pays qui soutiennent votre texte (ex: France, Japon, Brésil...)" 
                    disabled={!allowResolutions}
                    value={resolutionForm.sponsors} 
                    onChange={e => setResolutionForm({...resolutionForm, sponsors: e.target.value})} 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="content" className="font-bold">Texte de la Résolution</Label>
                  <Textarea 
                    id="content" 
                    className="min-h-[200px] text-lg leading-relaxed" 
                    required 
                    disabled={!allowResolutions}
                    placeholder={allowResolutions ? "Rédigez ici le contenu de votre projet de résolution..." : "L'envoi de résolutions est actuellement désactivé."}
                    value={resolutionForm.content} 
                    onChange={e => setResolutionForm({...resolutionForm, content: e.target.value})} 
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  type="submit" 
                  disabled={!allowResolutions}
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
