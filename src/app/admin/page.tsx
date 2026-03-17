"use client"

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldAlert, Plus, Trash2, Key, Home, AlertCircle, Globe, Languages, LogIn } from 'lucide-react';
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
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
        <Card className="w-full max-w-md border-none glass-card rounded-[2.5rem] p-8">
          <CardHeader className="text-center space-y-6">
            <div className="p-4 bg-destructive/10 rounded-3xl w-fit mx-auto border border-destructive/20">
              <ShieldAlert size={40} className="text-destructive" />
            </div>
            <div className="space-y-2">
              <CardTitle className="text-4xl font-black uppercase tracking-tight text-gradient leading-none">Accès Restreint</CardTitle>
              <CardDescription className="text-sm font-medium uppercase tracking-widest opacity-60">Veuillez authentifier votre session</CardDescription>
            </div>
          </CardHeader>
          <form onSubmit={checkKey}>
            <CardContent className="space-y-6 py-6">
              <div className="space-y-2">
                <Label htmlFor="key" className="text-[10px] uppercase font-black tracking-widest text-primary/60 ml-1">Clé de Sécurité Administrative</Label>
                <div className="relative">
                  <Key className="absolute left-4 top-4 h-5 w-5 text-primary/40" />
                  <Input 
                    id="key" 
                    type="password" 
                    placeholder="••••••••"
                    className="pl-12 h-14 font-mono rounded-2xl border-primary/10 focus:ring-primary/20 transition-all text-xl tracking-[0.5em]" 
                    value={securityKey} 
                    onChange={(e) => setSecurityKey(e.target.value)} 
                    required 
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button type="submit" className="w-full h-14 bg-primary hover:bg-primary/90 rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg shadow-primary/20 group">
                Déverrouiller la Console
                <LogIn className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button asChild variant="ghost" className="w-full text-muted-foreground hover:text-primary h-12 rounded-xl">
                <Link href="/"><Home className="mr-2 h-4 w-4" /> Retour au Hub Public</Link>
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 lg:p-12 md:p-20">
      <div className="max-w-7xl mx-auto space-y-16">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
          <div className="space-y-4">
            <Badge variant="outline" className="font-black uppercase tracking-[0.4em] px-4 py-1.5 border-primary/20 text-primary bg-white/50 backdrop-blur-sm">Admin Panel</Badge>
            <h1 className="text-6xl md:text-8xl font-black uppercase tracking-tighter text-gradient leading-none">Management</h1>
          </div>
          <Button asChild variant="outline" size="lg" className="font-black uppercase tracking-widest text-[10px] h-14 rounded-2xl px-8 border-primary/10 hover:bg-primary/5">
            <Link href="/"><Home className="mr-3 h-5 w-5" /> Hub Principal</Link>
          </Button>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          <div className="lg:col-span-4">
            <Card className="sticky top-12 glass-card rounded-[2.5rem] overflow-hidden border-primary/10 shadow-2xl">
              <CardHeader className="bg-primary/[0.03] border-b border-primary/5 p-8">
                <CardTitle className="flex items-center gap-3 text-2xl font-black uppercase tracking-tight text-gradient"><Plus className="text-primary" /> Nouveau Comité</CardTitle>
                <CardDescription className="font-medium text-muted-foreground/80">Configurez un nouvel espace de travail diplomatique.</CardDescription>
              </CardHeader>
              <form onSubmit={handleCreate}>
                <CardContent className="space-y-6 p-8">
                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase font-black tracking-widest text-primary/60">Nom Officiel</Label>
                    <Input placeholder="Ex: ECOSOC, Conseil de Sécurité..." value={newCommittee.name} onChange={e => setNewCommittee({...newCommittee, name: e.target.value})} required className="rounded-xl h-12 border-primary/10" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase font-black tracking-widest text-primary/60">Langue de Séance</Label>
                    <Select value={newCommittee.language} onValueChange={(val) => setNewCommittee({...newCommittee, language: val})}>
                      <SelectTrigger className="rounded-xl h-12 border-primary/10">
                        <div className="flex items-center gap-2"><Languages className="h-4 w-4 text-primary/60" /><SelectValue /></div>
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="fr">Français (Standard)</SelectItem>
                        <SelectItem value="en">English (International)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase font-black tracking-widest text-primary/60">Email Présidentiel</Label>
                    <Input placeholder="president@mun-os.org" type="email" value={newCommittee.president_email} onChange={e => setNewCommittee({...newCommittee, president_email: e.target.value})} required className="rounded-xl h-12 border-primary/10" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase font-black tracking-widest text-primary/60">Code d'Accès Bureau</Label>
                    <Input type="password" value={newCommittee.president_password} onChange={e => setNewCommittee({...newCommittee, president_password: e.target.value})} required className="rounded-xl h-12 border-primary/10" />
                  </div>
                </CardContent>
                <CardFooter className="p-8 pt-0">
                  <Button type="submit" className="w-full h-14 bg-primary hover:bg-primary/90 rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg shadow-primary/20">Initialiser le Comité</Button>
                </CardFooter>
              </form>
            </Card>
          </div>

          <div className="lg:col-span-8 space-y-8">
            <h2 className="text-xs font-black uppercase tracking-[0.4em] text-primary/40 flex items-center gap-4 before:h-px before:flex-1 before:bg-primary/10 after:h-px after:flex-1 after:bg-primary/10">
              <Globe className="h-4 w-4" /> Comités Opérationnels ({committees?.length || 0})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {committees?.map(c => (
                <Card key={c.id} className="glass-card group hover:border-primary/20 transition-all rounded-[2rem] overflow-hidden">
                  <CardContent className="p-8 flex justify-between items-start gap-4">
                    <div className="space-y-4 flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="text-2xl font-black uppercase tracking-tight text-foreground/90 group-hover:text-primary transition-colors">{c.name}</h3>
                        <Badge variant="outline" className="uppercase text-[9px] font-black tracking-widest border-primary/10 text-primary/60 bg-primary/5 px-2">{c.language || 'fr'}</Badge>
                      </div>
                      <div className="space-y-1.5 opacity-60">
                        <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2"><User size={12} /> {c.president_email}</p>
                        <p className="text-[9px] font-mono uppercase tracking-tighter bg-muted px-3 py-1 rounded-lg w-fit">ID REFERENCE: {c.id}</p>
                      </div>
                    </div>
                    
                    <AlertDialog onOpenChange={(open) => !open && setDeleteVerificationKey('')}>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/5 rounded-2xl h-12 w-12 border border-transparent hover:border-destructive/10">
                          <Trash2 size={24} />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="rounded-[2.5rem] border-destructive/10 p-10">
                        <AlertDialogHeader className="space-y-4">
                          <AlertDialogTitle className="text-3xl font-black uppercase tracking-tight text-destructive">Suppression Critique</AlertDialogTitle>
                          <AlertDialogDescription className="text-base font-medium leading-relaxed">
                            Vous êtes sur le point de supprimer définitivement le comité <span className="text-foreground font-black">"{c.name}"</span>. Cette opération effacera l'intégralité des délégués, résolutions et statistiques associés.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <div className="py-8 space-y-3">
                          <Label htmlFor="delete-key" className="text-[10px] uppercase font-black tracking-widest text-destructive/60 ml-1">Confirmation par Clé Administrateur</Label>
                          <Input 
                            id="delete-key"
                            type="password" 
                            placeholder="Entrez la clé pour confirmer"
                            value={deleteVerificationKey}
                            onChange={(e) => setDeleteVerificationKey(e.target.value)}
                            className="font-mono h-14 rounded-2xl border-destructive/10 text-xl tracking-[0.3em] text-center"
                          />
                        </div>
                        <AlertDialogFooter className="gap-4">
                          <AlertDialogCancel className="rounded-xl h-12 border-primary/10 font-bold" onClick={() => setDeleteVerificationKey('')}>Annuler</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => {
                              handleDelete(c.id);
                              setDeleteVerificationKey('');
                            }}
                            disabled={deleteVerificationKey !== 'MUN-X26'}
                            className="bg-destructive hover:bg-destructive/90 rounded-xl h-12 font-black uppercase tracking-widest text-xs shadow-lg shadow-destructive/20"
                          >
                            Confirmer la Suppression
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </CardContent>
                </Card>
              ))}
              {committees?.length === 0 && (
                <div className="col-span-full py-40 border-4 border-dashed rounded-[3rem] border-primary/5 flex flex-col items-center gap-6 opacity-10">
                  <Globe size={80} />
                  <p className="text-2xl font-black uppercase tracking-widest">Aucune session active</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}