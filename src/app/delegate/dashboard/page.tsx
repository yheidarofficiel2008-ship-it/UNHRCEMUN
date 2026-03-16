"use client"

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Send, CheckCircle2, XCircle, Landmark, LogOut, FileText, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/lib/supabase';
import { useRealtime } from '@/hooks/use-realtime';
import { SuspensionOverlay } from '@/components/SuspensionOverlay';
import { GlobalTimer } from '@/components/GlobalTimer';
import { useToast } from '@/hooks/use-toast';

export default function DelegateDashboard() {
  const router = useRouter();
  const { toast } = useToast();
  const { isSuspended, currentAction } = useRealtime();
  const [delegate, setDelegate] = useState<any>(null);
  const [participationStatus, setParticipationStatus] = useState<string | null>(null);
  
  const [resolutionForm, setResolutionForm] = useState({
    sponsors: '',
    content: ''
  });
  const [myResolutions, setMyResolutions] = useState<any[]>([]);

  useEffect(() => {
    const session = localStorage.getItem('delegate_session');
    if (!session) {
      router.push('/delegate/login');
      return;
    }
    const del = JSON.parse(session);
    setDelegate(del);

    const fetchMyRes = async () => {
      const { data } = await supabase
        .from('resolutions')
        .select('*')
        .eq('proposing_country', del.country_name)
        .order('created_at', { ascending: false });
      if (data) setMyResolutions(data);
    };
    fetchMyRes();

    // Subscribe to status changes of my resolutions
    const resSub = supabase.channel('delegate_res').on('postgres_changes', { 
      event: 'UPDATE', 
      table: 'resolutions', 
      filter: `proposing_country=eq.${del.country_name}` 
    }, payload => {
      setMyResolutions(prev => prev.map(r => r.id === payload.new.id ? payload.new : r));
      toast({ title: "Notification de Présidence", description: `Le statut de votre résolution a changé : ${payload.new.status}` });
    }).subscribe();

    return () => {
      supabase.removeChannel(resSub);
    };
  }, []);

  const handleParticipation = async (status: 'participating' | 'passing') => {
    if (!currentAction || !delegate) return;
    
    const { error } = await supabase.from('participations').upsert({
      action_id: currentAction.id,
      delegate_id: delegate.id,
      status: status,
      updated_at: new Date().toISOString()
    });

    if (error) {
      toast({ title: "Erreur", description: "Impossible d'enregistrer votre choix.", variant: "destructive" });
    } else {
      setParticipationStatus(status);
      toast({ title: "Choix enregistré", description: status === 'participating' ? "Vous participez à l'action." : "Vous passez votre tour." });
    }
  };

  const submitResolution = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!delegate) return;

    const { data, error } = await supabase.from('resolutions').insert({
      proposing_country: delegate.country_name,
      sponsors: resolutionForm.sponsors,
      content: resolutionForm.content
    }).select().single();

    if (error) {
      toast({ title: "Erreur", description: "Échec de la soumission.", variant: "destructive" });
    } else {
      setMyResolutions([data, ...myResolutions]);
      setResolutionForm({ sponsors: '', content: '' });
      toast({ title: "Soumis avec succès", description: "Votre résolution est en attente de validation." });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('delegate_session');
    router.push('/');
  };

  if (!delegate) return null;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {isSuspended && <SuspensionOverlay />}

      <header className="bg-secondary text-white p-4 shadow-md flex justify-between items-center z-20">
        <div className="flex items-center gap-4">
          <Landmark className="h-8 w-8" />
          <h1 className="text-xl font-bold font-headline uppercase tracking-widest">{delegate.country_name} - Délégué</h1>
        </div>
        <Button variant="ghost" className="text-white hover:bg-white/10" onClick={handleLogout}>
          <LogOut size={20} />
        </Button>
      </header>

      <main className="flex-1 p-6 grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-[1400px] mx-auto w-full">
        {/* Left: Action Status */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="border-secondary/20 shadow-lg h-fit">
            <CardHeader>
              <Badge className="w-fit mb-2 bg-secondary">SESSION ACTIVE</Badge>
              <CardTitle className="text-2xl">{currentAction?.title || 'Attente d\'action'}</CardTitle>
              <CardDescription>{currentAction?.description || 'La présidence n\'a pas encore lancé d\'action.'}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {currentAction && (
                <>
                  <GlobalTimer startedAt={currentAction.started_at} durationMinutes={currentAction.duration_minutes} />
                  
                  {currentAction.allow_participation && currentAction.status === 'launched' && (
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
                        className={`h-20 text-lg gap-2 ${participationStatus === 'passing' ? 'border-destructive text-destructive' : 'border-secondary text-secondary'}`}
                        onClick={() => handleParticipation('passing')}
                      >
                        <XCircle /> Passer
                      </Button>
                    </div>
                  )}

                  {!currentAction.allow_participation && currentAction.status !== 'completed' && (
                    <div className="bg-muted p-4 rounded-lg flex items-center gap-3 text-muted-foreground italic">
                      <AlertCircle size={20} /> La participation directe des délégués n'est pas requise pour cette action.
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><FileText /> Mes Résolutions</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px] pr-4">
                <div className="space-y-4">
                  {myResolutions.map(res => (
                    <div key={res.id} className="p-4 border rounded-xl bg-muted/20">
                      <div className="flex justify-between items-start mb-2">
                        <Badge variant={
                          res.status === 'approved' ? 'default' : 
                          res.status === 'rejected' ? 'destructive' : 'secondary'
                        }>
                          {res.status.replace('_', ' ').toUpperCase()}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground">{new Date(res.created_at).toLocaleDateString()}</span>
                      </div>
                      <p className="text-sm font-semibold truncate mb-1">Sponsors: {res.sponsors || 'N/A'}</p>
                      <p className="text-xs text-muted-foreground line-clamp-2 italic">"{res.content}"</p>
                      {res.feedback && (
                        <div className="mt-2 p-2 bg-orange-50 border border-orange-200 rounded text-xs text-orange-800">
                          <strong>Note de présidence:</strong> {res.feedback}
                        </div>
                      )}
                    </div>
                  ))}
                  {myResolutions.length === 0 && <p className="text-center text-muted-foreground text-sm py-10">Aucune résolution soumise.</p>}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Right: Submit Resolution */}
        <div className="lg:col-span-7">
          <Card className="shadow-xl">
            <CardHeader className="bg-secondary/5 border-b mb-6">
              <CardTitle className="text-2xl font-headline">Soumettre une Proposition</CardTitle>
              <CardDescription>Rédigez votre résolution pour examen par la présidence.</CardDescription>
            </CardHeader>
            <form onSubmit={submitResolution}>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Nom du Pays (Proposant)</Label>
                  <Input disabled value={delegate.country_name} className="bg-muted" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sponsors">Sponsors / Co-proposants</Label>
                  <Input 
                    id="sponsors" 
                    placeholder="Séparez par des virgules..." 
                    value={resolutionForm.sponsors}
                    onChange={e => setResolutionForm({...resolutionForm, sponsors: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="content">Contenu de la Résolution</Label>
                  <Textarea 
                    id="content" 
                    className="min-h-[300px] font-body text-base leading-relaxed" 
                    placeholder="Écrivez ici le texte intégral de votre proposition..." 
                    required
                    value={resolutionForm.content}
                    onChange={e => setResolutionForm({...resolutionForm, content: e.target.value})}
                  />
                </div>
              </CardContent>
              <CardFooter className="bg-muted/30 pt-6">
                <Button type="submit" className="w-full h-14 bg-secondary text-lg gap-2">
                  <Send size={20} /> Envoyer à la Présidence
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      </main>
    </div>
  );
}