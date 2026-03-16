"use client"

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Play, Pause, Plus, List, CheckCircle2, XCircle, FileText, Sparkles, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/lib/supabase';
import { useRealtime } from '@/hooks/use-realtime';
import { SuspensionOverlay } from '@/components/SuspensionOverlay';
import { GlobalTimer } from '@/components/GlobalTimer';
import { aiResolutionSummarizer } from '@/ai/flows/ai-resolution-summarizer';
import { useToast } from '@/hooks/use-toast';

export default function PresidentDashboard() {
  const router = useRouter();
  const { toast } = useToast();
  const { isSuspended, currentAction } = useRealtime();
  
  const [newAction, setNewAction] = useState({
    title: '',
    duration: 15,
    timePerDelegate: '1:00',
    description: '',
    allowParticipation: true
  });

  const [resolutions, setResolutions] = useState<any[]>([]);
  const [participants, setParticipants] = useState<any[]>([]);
  const [aiAnalysis, setAiAnalysis] = useState<Record<string, any>>({});

  useEffect(() => {
    const fetchInitial = async () => {
      const { data: res } = await supabase.from('resolutions').select('*').order('created_at', { ascending: false });
      if (res) setResolutions(res);

      if (currentAction?.id) {
        const { data: part } = await supabase
          .from('participations')
          .select('*, delegates(country_name)')
          .eq('action_id', currentAction.id);
        if (part) setParticipants(part);
      }
    };
    fetchInitial();

    // Subscribe to resolutions
    const resSub = supabase.channel('dashboard_res').on('postgres_changes', { event: '*', table: 'resolutions' }, payload => {
      setResolutions(prev => {
        if (payload.eventType === 'INSERT') return [payload.new, ...prev];
        return prev.map(r => r.id === payload.new.id ? payload.new : r);
      });
    }).subscribe();

    // Subscribe to participations
    const partSub = supabase.channel('dashboard_part').on('postgres_changes', { event: '*', table: 'participations' }, payload => {
       fetchInitial(); // Refresh to get country names
    }).subscribe();

    return () => {
      supabase.removeChannel(resSub);
      supabase.removeChannel(partSub);
    };
  }, [currentAction]);

  const toggleSuspension = async () => {
    await supabase.from('settings').update({ value: !isSuspended }).eq('key', 'session_suspended');
  };

  const createAction = async () => {
    const { data, error } = await supabase.from('actions').insert({
      title: newAction.title,
      duration_minutes: newAction.duration,
      time_per_delegate: newAction.timePerDelegate,
      description: newAction.description,
      allow_participation: newAction.allowParticipation,
      status: 'launched'
    }).select().single();

    if (error) {
       toast({ title: "Erreur", description: "Impossible de créer l'action", variant: "destructive" });
    } else {
       toast({ title: "Succès", description: "Action lancée !" });
       setNewAction({ title: '', duration: 15, timePerDelegate: '1:00', description: '', allowParticipation: true });
    }
  };

  const startAction = async () => {
    if (!currentAction) return;
    await supabase.from('actions').update({ 
      status: 'started', 
      started_at: new Date().toISOString() 
    }).eq('id', currentAction.id);
  };

  const updateResolution = async (id: string, status: string) => {
    await supabase.from('resolutions').update({ status }).eq('id', id);
    toast({ title: "Statut mis à jour", description: `La résolution est maintenant : ${status}` });
  };

  const analyzeResolution = async (res: any) => {
    setAiAnalysis(prev => ({ ...prev, [res.id]: { loading: true } }));
    try {
      const summary = await aiResolutionSummarizer({ resolutionText: res.content });
      setAiAnalysis(prev => ({ ...prev, [res.id]: { ...summary, loading: false } }));
    } catch (e) {
      setAiAnalysis(prev => ({ ...prev, [res.id]: { error: true, loading: false } }));
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {isSuspended && <SuspensionOverlay />}
      
      <header className="bg-primary text-white p-4 shadow-md flex justify-between items-center z-20">
        <div className="flex items-center gap-4">
          <Landmark className="h-8 w-8" />
          <h1 className="text-xl font-bold font-headline uppercase tracking-widest">Immune UERC - Présidence</h1>
        </div>
        <div className="flex items-center gap-4">
          <Button 
            variant={isSuspended ? "destructive" : "outline"} 
            className={`${isSuspended ? 'bg-white text-destructive hover:bg-white/90' : 'bg-destructive text-white border-none hover:bg-destructive/90'}`}
            onClick={toggleSuspension}
          >
            {isSuspended ? "Reprendre la séance" : "Suspendre la séance"}
          </Button>
          <Button variant="ghost" className="text-white hover:bg-white/10" onClick={handleLogout}>
            <LogOut size={20} />
          </Button>
        </div>
      </header>

      <main className="flex-1 p-6 grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-[1600px] mx-auto w-full">
        {/* Left Column: Action Management */}
        <div className="lg:col-span-4 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="text-primary" /> Nouvelle Action
              </CardTitle>
              <CardDescription>Définissez l'ordre du jour actuel</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Nom de l'Action</Label>
                <Input value={newAction.title} onChange={e => setNewAction({...newAction, title: e.target.value})} placeholder="ex: Débat Général" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Durée (min)</Label>
                  <Input type="number" value={newAction.duration} onChange={e => setNewAction({...newAction, duration: parseInt(e.target.value)})} />
                </div>
                <div className="space-y-2">
                  <Label>Temps par délégué</Label>
                  <Input value={newAction.timePerDelegate} onChange={e => setNewAction({...newAction, timePerDelegate: e.target.value})} placeholder="1:00" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea value={newAction.description} onChange={e => setNewAction({...newAction, description: e.target.value})} placeholder="Détails de l'action..." />
              </div>
              <div className="flex items-center justify-between">
                <Label>Autoriser participation</Label>
                <Switch checked={newAction.allowParticipation} onCheckedChange={val => setNewAction({...newAction, allowParticipation: val})} />
              </div>
              <Button className="w-full bg-primary" onClick={createAction}>Lancer l'Action</Button>
            </CardContent>
          </Card>

          {currentAction && (
            <Card className="border-primary/20 shadow-lg">
              <CardHeader className="pb-2">
                <Badge className="w-fit mb-2 bg-accent">{currentAction.status === 'launched' ? 'PRÊT' : 'EN COURS'}</Badge>
                <CardTitle>{currentAction.title}</CardTitle>
                <CardDescription>{currentAction.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <GlobalTimer startedAt={currentAction.started_at} durationMinutes={currentAction.duration_minutes} />
                
                {currentAction.status === 'launched' && (
                  <Button className="w-full h-16 text-xl gap-3" onClick={startAction}>
                    <Play fill="currentColor" /> Démarrer le Décompte
                  </Button>
                )}
                
                <div className="space-y-3">
                  <h3 className="font-bold flex items-center gap-2 text-sm text-muted-foreground uppercase tracking-wider">
                    <List size={16} /> Participants ({participants.filter(p => p.status === 'participating').length})
                  </h3>
                  <ScrollArea className="h-[200px] border rounded-md p-2 bg-muted/50">
                    <div className="space-y-2">
                      {participants.map((p, i) => (
                        <div key={i} className={`p-2 rounded flex justify-between items-center ${p.status === 'participating' ? 'bg-primary/10 text-primary border border-primary/20' : 'bg-muted opacity-50'}`}>
                          <span className="font-medium">{(p.delegates as any)?.country_name}</span>
                          <Badge variant={p.status === 'participating' ? 'default' : 'secondary'}>{p.status === 'participating' ? 'Présent' : 'Passe'}</Badge>
                        </div>
                      ))}
                      {participants.length === 0 && <p className="text-center text-muted-foreground text-sm mt-4">Aucun délégué n'a encore répondu.</p>}
                    </div>
                  </ScrollArea>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column: Resolutions */}
        <div className="lg:col-span-8">
          <Tabs defaultValue="resolutions" className="w-full">
            <TabsList className="w-full h-12 bg-muted/50 p-1 mb-6">
              <TabsTrigger value="resolutions" className="flex-1 text-base gap-2">
                <FileText size={18} /> Résolutions Reçues
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="resolutions" className="space-y-6">
              {resolutions.length === 0 && (
                <div className="text-center py-20 border-2 border-dashed rounded-3xl">
                  <FileText className="mx-auto h-16 w-16 text-muted-foreground opacity-20 mb-4" />
                  <p className="text-muted-foreground">Aucune proposition de résolution pour le moment.</p>
                </div>
              )}
              {resolutions.map(res => (
                <Card key={res.id} className="overflow-hidden border-2 transition-all hover:border-primary/50">
                  <div className="bg-muted/30 p-4 border-b flex justify-between items-center">
                    <div>
                      <h3 className="text-lg font-bold text-primary">{res.proposing_country}</h3>
                      <p className="text-sm text-muted-foreground">Sponsors: {res.sponsors || 'Aucun'}</p>
                    </div>
                    <Badge className={
                      res.status === 'approved' ? 'bg-green-600' : 
                      res.status === 'rejected' ? 'bg-red-600' : 
                      res.status === 'modification_requested' ? 'bg-orange-500' : 'bg-blue-600'
                    }>
                      {res.status === 'pending' ? 'EN ATTENTE' : res.status.replace('_', ' ').toUpperCase()}
                    </Badge>
                  </div>
                  <CardContent className="p-6 space-y-6">
                    <div className="whitespace-pre-wrap text-sm leading-relaxed bg-muted/20 p-4 rounded-lg border italic">
                      {res.content}
                    </div>

                    {aiAnalysis[res.id] && (
                      <div className="bg-accent/5 p-4 rounded-xl border border-accent/20 animate-in slide-in-from-top duration-300">
                        <div className="flex items-center gap-2 mb-3 text-accent font-bold">
                          <Sparkles size={20} /> Analyse IA de la Présidence
                        </div>
                        {aiAnalysis[res.id].loading ? (
                          <div className="animate-pulse space-y-2">
                            <div className="h-4 bg-accent/20 rounded w-3/4"></div>
                            <div className="h-4 bg-accent/20 rounded w-1/2"></div>
                          </div>
                        ) : aiAnalysis[res.id].error ? (
                          <p className="text-destructive text-sm">Erreur lors de l'analyse.</p>
                        ) : (
                          <div className="space-y-4">
                            <div>
                              <h4 className="text-xs font-black uppercase text-accent mb-1">Résumé</h4>
                              <p className="text-sm">{aiAnalysis[res.id].summary}</p>
                            </div>
                            <div>
                              <h4 className="text-xs font-black uppercase text-accent mb-1">Points Clés</h4>
                              <ul className="list-disc list-inside text-sm space-y-1">
                                {aiAnalysis[res.id].keyPoints.map((kp: string, i: number) => <li key={i}>{kp}</li>)}
                              </ul>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex flex-wrap gap-3 pt-4">
                      <Button variant="outline" className="gap-2 text-accent border-accent hover:bg-accent hover:text-white" onClick={() => analyzeResolution(res)}>
                        <Sparkles size={16} /> Synthèse IA
                      </Button>
                      <div className="ml-auto flex gap-2">
                        <Button variant="outline" className="gap-2 text-green-600 hover:bg-green-50" onClick={() => updateResolution(res.id, 'approved')}>
                          <CheckCircle2 size={16} /> Approuver
                        </Button>
                        <Button variant="outline" className="gap-2 text-orange-600 hover:bg-orange-50" onClick={() => updateResolution(res.id, 'modification_requested')}>
                          Demander Modif.
                        </Button>
                        <Button variant="outline" className="gap-2 text-red-600 hover:bg-red-50" onClick={() => updateResolution(res.id, 'rejected')}>
                          <XCircle size={16} /> Rejeter
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}