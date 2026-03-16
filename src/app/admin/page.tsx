
"use client"

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldAlert, Plus, Trash2, Key, Home, AlertCircle, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [newCommittee, setNewCommittee] = useState({
    name: '',
    president_email: '',
    president_password: ''
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
      toast({ title: "Accès Autorisé", description: "Bienvenue dans le panneau d'administration." });
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
      setNewCommittee({ name: '', president_email: '', president_password: '' });
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
        <Card className="w-full max-w-md border-t-4 border-destructive shadow-2xl">
          <CardHeader className="text-center">
            <ShieldAlert size={40} className="mx-auto text-destructive mb-4" />
            <CardTitle className="text-2xl font-black uppercase tracking-tighter">Accès Restreint</CardTitle>
            <CardDescription>Veuillez entrer la clé de sécurité MUN-X26 pour continuer.</CardDescription>
          </CardHeader>
          <form onSubmit={checkKey}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="key">Clé Administrateur</Label>
                <div className="relative">
                  <Key className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="key" 
                    type="password" 
                    className="pl-10 h-12 font-mono" 
                    value={securityKey} 
                    onChange={(e) => setSecurityKey(e.target.value)} 
                    required 
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-2">
              <Button type="submit" variant="destructive" className="w-full h-12 font-bold">Valider la clé</Button>
              <Button asChild variant="ghost" className="w-full">
                <Link href="/"><Home className="mr-2 h-4 w-4" /> Retour au Hub</Link>
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6 lg:p-12">
      <div className="max-w-6xl mx-auto space-y-12">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div className="space-y-2">
            <Badge variant="destructive" className="font-black uppercase tracking-widest px-3">Admin Panel</Badge>
            <h1 className="text-5xl md:text-6xl font-black uppercase tracking-tight">Gestion des Comités</h1>
          </div>
          <Button asChild variant="outline" size="lg" className="font-bold">
            <Link href="/"><Home className="mr-2 h-5 w-5" /> Hub Public</Link>
          </Button>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          <div className="lg:col-span-4">
            <Card className="sticky top-12 border-2 border-primary/20 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Plus className="text-primary" /> Nouveau Comité</CardTitle>
                <CardDescription>Configurez un nouvel espace de travail.</CardDescription>
              </CardHeader>
              <form onSubmit={handleCreate}>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Nom du Comité (ex: ECOSOC)</Label>
                    <Input placeholder="ECOSOC" value={newCommittee.name} onChange={e => setNewCommittee({...newCommittee, name: e.target.value})} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Email du Président</Label>
                    <Input placeholder="president@mun.org" type="email" value={newCommittee.president_email} onChange={e => setNewCommittee({...newCommittee, president_email: e.target.value})} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Mot de passe Président</Label>
                    <Input type="password" value={newCommittee.president_password} onChange={e => setNewCommittee({...newCommittee, president_password: e.target.value})} required />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button type="submit" className="w-full h-12 font-black uppercase tracking-widest">Créer le Comité</Button>
                </CardFooter>
              </form>
            </Card>
          </div>

          <div className="lg:col-span-8 space-y-6">
            <h2 className="text-2xl font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2 border-b-2 pb-2">
              <Globe className="text-primary" /> Comités Existants ({committees?.length || 0})
            </h2>
            <div className="grid grid-cols-1 gap-4">
              {committees?.map(c => (
                <Card key={c.id} className="group hover:border-destructive transition-all hover:shadow-lg">
                  <CardContent className="p-6 flex justify-between items-center">
                    <div className="space-y-1">
                      <h3 className="text-xl font-black uppercase tracking-tight group-hover:text-primary transition-colors">{c.name}</h3>
                      <p className="text-xs text-muted-foreground font-mono bg-muted px-2 py-1 rounded w-fit">ID: {c.id}</p>
                      <p className="text-xs text-muted-foreground font-medium pt-1">Président : {c.president_email}</p>
                    </div>
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10">
                          <Trash2 size={20} />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Supprimer le comité {c.name} ?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Cette action est irréversible. Toutes les données (délégués, résolutions, actions) liées à ce comité seront perdues.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Annuler</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => handleDelete(c.id)}
                            className="bg-destructive hover:bg-destructive/90"
                          >
                            Supprimer définitivement
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </CardContent>
                </Card>
              ))}
              {committees?.length === 0 && (
                <div className="text-center py-24 border-4 border-dashed rounded-3xl opacity-20 flex flex-col items-center gap-4">
                  <Globe size={60} />
                  <p className="text-xl font-bold uppercase tracking-widest">Aucun comité actif.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
