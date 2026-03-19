
"use client"

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldAlert, Plus, Trash2, Key, Home, AlertCircle, Globe, Languages, LogIn, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useFirebase, useCollection } from '@/firebase';
import { useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, serverTimestamp, doc } from 'firebase/firestore';
import { addDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export default function AdminPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { firestore: db } = useFirebase();
  const [securityKey, setSecurityKey] = useState('');
  const [deleteVerificationKey, setDeleteVerificationKey] = useState('');
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [newCommittee, setNewCommittee] = useState({
    name: '',
    president_email: '',
    president_password: '',
    language: 'fr'
  });

  const committeesQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, 'committees'), orderBy('created_at', 'desc'));
  }, [db]);

  const { data: committees } = useCollection(committeesQuery);

  const checkKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (securityKey === 'MUN-X26') {
      setIsAuthorized(true);
      toast({ title: "Accès Autorisé", description: "Console d'administration déverrouillée." });
    } else {
      toast({ title: "Clé incorrecte", variant: "destructive" });
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db) return;
    try {
      await addDocumentNonBlocking(collection(db, 'committees'), {
        ...newCommittee,
        created_at: serverTimestamp()
      });
      setNewCommittee({ name: '', president_email: '', president_password: '', language: 'fr' });
      toast({ title: "Comité créé avec succès" });
    } catch (e) {
      toast({ title: "Erreur de création", variant: "destructive" });
    }
  };

  const handleDelete = (id: string) => {
    if (!db) return;
    try {
      deleteDocumentNonBlocking(doc(db, 'committees', id));
      toast({ title: "Comité supprimé" });
    } catch (e) {
      toast({ title: "Erreur de suppression", variant: "destructive" });
    }
  };

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <Card className="w-full max-w-md border-none glass-card rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-8">
          <CardHeader className="text-center space-y-4 md:space-y-6">
            <div className="p-3 md:p-4 bg-destructive/10 rounded-[1.5rem] md:rounded-3xl w-fit mx-auto border border-destructive/20">
              <ShieldAlert className="size-8 md:size-10 text-destructive" />
            </div>
            <div className="space-y-2">
              <CardTitle className="text-2xl md:text-4xl font-black uppercase tracking-tight text-gradient leading-none">Accès Restreint</CardTitle>
              <CardDescription className="text-[10px] md:text-sm font-medium uppercase tracking-widest opacity-60">Veuillez authentifier votre session</CardDescription>
            </div>
          </CardHeader>
          <form onSubmit={checkKey}>
            <CardContent className="space-y-4 md:space-y-6 py-4 md:py-6">
              <div className="space-y-2">
                <Label htmlFor="key" className="text-[9px] md:text-[10px] uppercase font-black tracking-widest text-primary/60 ml-1">Clé de Sécurité Administrative</Label>
                <div className="relative">
                  <Key className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-primary/40" />
                  <Input 
                    id="key" 
                    type="password" 
                    placeholder="••••••••"
                    className="pl-12 h-12 md:h-14 font-mono rounded-xl md:rounded-2xl border-primary/10 focus:ring-primary/20 transition-all text-lg md:text-xl tracking-[0.5em]" 
                    value={securityKey} 
                    onChange={(e) => setSecurityKey(e.target.value)} 
                    required 
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-3 md:gap-4">
              <Button type="submit" className="w-full h-12 md:h-14 bg-primary hover:bg-primary/90 rounded-xl md:rounded-2xl font-black uppercase tracking-widest text-[10px] md:text-xs shadow-lg shadow-primary/20 group">
                Déverrouiller
                <LogIn className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button asChild variant="ghost" className="w-full text-muted-foreground hover:text-primary h-10 md:h-12 rounded-xl text-[10px] md:text-sm">
                <Link href="/"><Home className="mr-2 h-4 w-4" /> Retour au Hub Public</Link>
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-12 lg:p-20">
      <div className="max-w-7xl mx-auto space-y-8 md:space-y-16">
        <header className="flex flex-col md:flex-row justify-between items-center md:items-end gap-6 md:gap-8 text-center md:text-left">
          <div className="space-y-2 md:space-y-4">
            <Badge variant="outline" className="font-black uppercase tracking-widest px-4 py-1.5 border-primary/20 text-primary bg-white/50 backdrop-blur-sm text-[8px] md:text-xs">Admin Panel</Badge>
            <h1 className="text-3xl md:text-8xl font-black uppercase tracking-tighter text-gradient leading-none">Management</h1>
          </div>
          <Button asChild variant="outline" size="lg" className="font-black uppercase tracking-widest text-[9px] md:text-[10px] h-10 md:h-14 rounded-xl md:rounded-2xl px-6 md:px-8 border-primary/10 hover:bg-primary/5">
            <Link href="/"><Home className="mr-3 size-4 md:size-5" /> Hub Principal</Link>
          </Button>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12 items-start">
          <div className="lg:col-span-4">
            <Card className="glass-card rounded-[1.5rem] md:rounded-[2.5rem] overflow-hidden border-primary/10 shadow-2xl">
              <CardHeader className="bg-primary/[0.03] border-b border-primary/5 p-6 md:p-8">
                <CardTitle className="flex items-center gap-3 text-lg md:text-2xl font-black uppercase tracking-tight text-gradient"><Plus className="text-primary size-5 md:size-6" /> Nouveau Comité</CardTitle>
                <CardDescription className="text-[10px] md:text-sm font-medium text-muted-foreground/80">Configurez un nouvel espace de travail.</CardDescription>
              </CardHeader>
              <form onSubmit={handleCreate}>
                <CardContent className="space-y-4 md:space-y-6 p-6 md:p-8">
                  <div className="space-y-1">
                    <Label className="text-[9px] md:text-[10px] uppercase font-black tracking-widest text-primary/60">Nom Officiel</Label>
                    <Input placeholder="..." value={newCommittee.name} onChange={e => setNewCommittee({...newCommittee, name: e.target.value})} required className="rounded-xl h-10 md:h-12 border-primary/10 text-xs md:text-sm" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[9px] md:text-[10px] uppercase font-black tracking-widest text-primary/60">Langue de Séance</Label>
                    <Select value={newCommittee.language} onValueChange={(val) => setNewCommittee({...newCommittee, language: val})}>
                      <SelectTrigger className="rounded-xl h-10 md:h-12 border-primary/10 text-[10px] md:text-xs">
                        <div className="flex items-center gap-2"><Languages className="size-4 text-primary/60" /><SelectValue /></div>
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="fr">Français</SelectItem>
                        <SelectItem value="en">English</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[9px] md:text-[10px] uppercase font-black tracking-widest text-primary/60">Email Présidentiel</Label>
                    <Input placeholder="president@mun-os.org" type="email" value={newCommittee.president_email} onChange={e => setNewCommittee({...newCommittee, president_email: e.target.value})} required className="rounded-xl h-10 md:h-12 border-primary/10 text-xs md:text-sm" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[9px] md:text-[10px] uppercase font-black tracking-widest text-primary/60">Code d'Accès Bureau</Label>
                    <Input type="password" value={newCommittee.president_password} onChange={e => setNewCommittee({...newCommittee, president_password: e.target.value})} required className="rounded-xl h-10 md:h-12 border-primary/10 text-xs md:text-sm" />
                  </div>
                </CardContent>
                <CardFooter className="p-6 md:p-8 pt-0">
                  <Button type="submit" className="w-full h-10 md:h-14 bg-primary hover:bg-primary/90 rounded-xl md:rounded-2xl font-black uppercase tracking-widest text-[9px] md:text-[10px] shadow-lg shadow-primary/20">Initialiser</Button>
                </CardFooter>
              </form>
            </Card>
          </div>

          <div className="lg:col-span-8 space-y-6 md:space-y-8">
            <h2 className="text-[9px] md:text-xs font-black uppercase tracking-[0.4em] text-primary/40 flex items-center gap-4 before:h-px before:flex-1 before:bg-primary/10 after:h-px after:flex-1 after:bg-primary/10 whitespace-nowrap">
              <Globe className="size-4" /> Comités ({committees?.length || 0})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              {committees?.map(c => (
                <Card key={c.id} className="glass-card group hover:border-primary/20 transition-all rounded-[1rem] md:rounded-[2rem] overflow-hidden">
                  <CardContent className="p-4 md:p-8 flex justify-between items-start gap-4">
                    <div className="space-y-3 md:space-y-4 min-w-0 flex-1">
                      <div className="flex items-center gap-2 md:gap-3 flex-wrap">
                        <h3 className="text-lg md:text-2xl font-black uppercase tracking-tight text-gradient group-hover:text-primary transition-colors truncate">{c.name}</h3>
                        <Badge variant="outline" className="uppercase text-[7px] md:text-[8px] font-black tracking-widest border-primary/10 text-primary/60 bg-primary/5 px-2">{c.language || 'fr'}</Badge>
                      </div>
                      <div className="space-y-1 md:space-y-1.5 opacity-60">
                        <p className="text-[7px] md:text-[9px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2 truncate"><User className="size-2.5 md:size-3" /> {c.president_email}</p>
                        <p className="text-[7px] md:text-[9px] font-mono uppercase tracking-tighter bg-muted px-2 py-0.5 rounded-lg w-fit">ID: {c.id}</p>
                      </div>
                    </div>
                    
                    <AlertDialog onOpenChange={(open) => !open && setDeleteVerificationKey('')}>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/5 rounded-xl md:rounded-2xl h-8 w-8 md:h-12 md:w-12 border border-transparent hover:border-destructive/10 shrink-0">
                          <Trash2 className="size-4.5 md:size-6" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="rounded-[1.5rem] md:rounded-[2.5rem] border-destructive/10 p-6 md:p-10 w-[95vw] max-w-lg">
                        <AlertDialogHeader className="space-y-2 md:space-y-4">
                          <AlertDialogTitle className="text-xl md:text-3xl font-black uppercase tracking-tight text-destructive">Suppression Critique</AlertDialogTitle>
                          <AlertDialogDescription className="text-[10px] md:text-base font-medium leading-relaxed">
                            Vous allez supprimer le comité <span className="text-foreground font-black">"{c.name}"</span>. Cette opération est irréversible.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <div className="py-4 md:py-8 space-y-2 md:space-y-3">
                          <Label htmlFor="delete-key" className="text-[9px] md:text-[10px] uppercase font-black tracking-widest text-destructive/60 ml-1">Clé de Confirmation</Label>
                          <Input 
                            id="delete-key"
                            type="password" 
                            placeholder="..."
                            value={deleteVerificationKey}
                            onChange={(e) => setDeleteVerificationKey(e.target.value)}
                            className="font-mono h-11 md:h-14 rounded-xl md:rounded-2xl border-destructive/10 text-lg md:text-xl tracking-[0.3em] text-center"
                          />
                        </div>
                        <AlertDialogFooter className="flex flex-col md:flex-row gap-2 md:gap-4">
                          <AlertDialogCancel className="rounded-xl h-10 md:h-12 border-primary/10 font-bold text-[10px] md:text-xs" onClick={() => setDeleteVerificationKey('')}>Annuler</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => {
                              handleDelete(c.id);
                              setDeleteVerificationKey('');
                            }}
                            disabled={deleteVerificationKey !== 'MUN-X26'}
                            className="bg-destructive hover:bg-destructive/90 rounded-xl h-10 md:h-12 font-black uppercase tracking-widest text-[9px] md:text-[10px] shadow-lg shadow-destructive/20"
                          >
                            Confirmer
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </CardContent>
                </Card>
              ))}
              {committees?.length === 0 && (
                <div className="col-span-full py-16 md:py-40 border-2 md:border-4 border-dashed rounded-[1.5rem] md:rounded-[3rem] border-primary/5 flex flex-col items-center gap-4 md:gap-6 opacity-10">
                  <Globe className="size-10 md:size-20" />
                  <p className="text-lg md:text-2xl font-black uppercase tracking-widest">Aucune session</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
