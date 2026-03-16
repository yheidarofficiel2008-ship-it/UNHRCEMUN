
"use client"

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Lock, ArrowLeft, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardContent, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useFirebase, useDoc } from '@/firebase';
import { useMemoFirebase } from '@/firebase';
import { collection, query, where, getDocs, doc } from 'firebase/firestore';
import { signInAnonymously } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

export default function DelegateLogin() {
  const params = useParams();
  const committeeId = params.committeeId as string;
  const [country, setCountry] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const { auth, firestore: db } = useFirebase();

  const committeeRef = useMemoFirebase(() => db ? doc(db, 'committees', committeeId) : null, [db, committeeId]);
  const { data: committee } = useDoc(committeeRef);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !auth) return;
    setLoading(true);

    try {
      await signInAnonymously(auth);

      const q = query(
        collection(db, 'committees', committeeId, 'delegates'), 
        where('country_name', '==', country), 
        where('password', '==', password)
      );
      
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        toast({
          title: "Erreur de connexion",
          description: "Nom du pays ou mot de passe incorrect pour ce comité.",
          variant: "destructive"
        });
        setLoading(false);
      } else {
        const delegateDoc = querySnapshot.docs[0];
        const delegateData = { id: delegateDoc.id, committeeId, ...delegateDoc.data() };
        
        localStorage.setItem('delegate_session', JSON.stringify(delegateData));
        
        toast({ title: "Bienvenue", description: `Délégué de ${country} connecté au comité ${committee?.name}.` });
        router.push(`/committees/${committeeId}/delegate/dashboard`);
      }
    } catch (error: any) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-2xl border-t-4 border-secondary">
        <CardHeader className="text-center space-y-2">
          <CardTitle className="text-3xl font-black uppercase tracking-tighter font-headline">Accès Délégué</CardTitle>
          <CardDescription className="font-bold uppercase tracking-widest text-[10px]">
             {committee ? `Comité : ${committee.name}` : "Chargement..."}
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="country" className="font-bold uppercase text-[10px] tracking-widest">Nom de la Délégation</Label>
              <Input 
                id="country" 
                placeholder="Ex: France" 
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                required
                className="h-12"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="font-bold uppercase text-[10px] tracking-widest">Code d'accès</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-4 h-4 w-4 text-muted-foreground" />
                <Input 
                  id="password" 
                  type="password" 
                  className="pl-10 h-12"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-2">
            <Button type="submit" className="w-full bg-secondary hover:bg-secondary/90 h-12 text-lg font-bold" disabled={loading}>
              {loading ? "Connexion..." : "Entrer en séance"}
            </Button>
            <Button asChild variant="ghost" className="w-full">
              <Link href="/"><ArrowLeft className="mr-2 h-4 w-4" /> Retour au Hub</Link>
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
