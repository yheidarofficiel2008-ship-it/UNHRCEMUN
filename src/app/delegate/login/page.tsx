"use client"

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Globe, Users, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardContent, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { db, auth } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { signInAnonymously } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

export default function DelegateLogin() {
  const [country, setCountry] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await signInAnonymously(auth);

      const q = query(
        collection(db, 'delegates'), 
        where('country_name', '==', country), 
        where('password', '==', password)
      );
      
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        toast({
          title: "Erreur de connexion",
          description: "Nom du pays ou mot de passe incorrect.",
          variant: "destructive"
        });
        setLoading(false);
      } else {
        const delegateDoc = querySnapshot.docs[0];
        const delegateData = { id: delegateDoc.id, ...delegateDoc.data() };
        localStorage.setItem('delegate_session', JSON.stringify(delegateData));
        toast({ title: "Bienvenue", description: `Délégué de ${country} connecté.` });
        router.push('/delegate/dashboard');
      }
    } catch (error: any) {
      console.error(error);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 md:p-6">
      <Card className="w-full max-w-md border-none glass-card rounded-[1.5rem] md:rounded-[2.5rem] p-6 md:p-10 overflow-hidden relative shadow-2xl">
        <div className="absolute top-0 left-0 w-full h-1.5 md:h-2 bg-gradient-to-r from-secondary to-black"></div>
        <CardHeader className="text-center space-y-4 md:space-y-6 pt-4 md:pt-6">
          <div className="p-3 md:p-4 bg-secondary/5 rounded-[1.5rem] md:rounded-[2rem] w-fit mx-auto border border-secondary/10 shadow-inner">
            <Users className="size-8 md:size-12 text-secondary" />
          </div>
          <div className="space-y-1.5 md:space-y-2">
            <CardTitle className="text-2xl md:text-4xl font-black uppercase tracking-tight text-gradient leading-none">Accès Délégué</CardTitle>
            <CardDescription className="font-bold uppercase tracking-[0.2em] text-[8px] md:text-[10px] text-muted-foreground/60">EMUN UNHRC - Simulation</CardDescription>
          </div>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4 md:space-y-6 pt-2 md:pt-4">
            <div className="space-y-1.5 md:space-y-2">
              <Label htmlFor="country" className="text-[8px] md:text-[10px] uppercase font-black tracking-widest text-primary/60 ml-1">Délégation Nationale</Label>
              <div className="relative">
                <Globe className="absolute left-3.5 md:left-4 top-1/2 -translate-y-1/2 size-4 md:size-5 text-primary/30" />
                <Input 
                  id="country" 
                  placeholder="Ex: France" 
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  required
                  className="pl-10 md:pl-12 h-11 md:h-14 rounded-xl md:rounded-2xl border-primary/10 bg-primary/[0.01] font-bold text-sm md:text-base"
                />
              </div>
            </div>
            <div className="space-y-1.5 md:space-y-2">
              <Label htmlFor="password" className="text-[8px] md:text-[10px] uppercase font-black tracking-widest text-primary/60 ml-1">Code d'accès</Label>
              <div className="relative">
                <Lock className="absolute left-3.5 md:left-4 top-1/2 -translate-y-1/2 size-4 md:size-5 text-primary/30" />
                <Input 
                  id="password" 
                  type="password" 
                  className="pl-10 md:pl-12 h-11 md:h-14 rounded-xl md:rounded-2xl border-primary/10 bg-primary/[0.01] font-mono tracking-widest text-sm md:text-base"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-3 md:gap-4 mt-4 md:mt-6">
            <Button type="submit" className="w-full bg-secondary hover:bg-secondary/90 h-12 md:h-16 text-[10px] md:text-xs font-black uppercase tracking-[0.2em] rounded-xl md:rounded-2xl shadow-xl shadow-secondary/20 transition-all active:scale-95" disabled={loading}>
              {loading ? "Connexion..." : "Entrer en séance"}
            </Button>
            <Button asChild variant="ghost" className="w-full text-muted-foreground hover:text-primary rounded-xl h-10 md:h-12 font-bold uppercase tracking-widest text-[9px] md:text-[10px]">
              <Link href="/"><ArrowLeft className="mr-2 size-3.5 md:size-4" /> Retour au Hub</Link>
            </Button>
          </CardFooter>
        </form>
      </Card>
      <p className="mt-8 md:mt-12 text-[8px] md:text-[10px] text-muted-foreground/30 font-black uppercase tracking-[0.3em] md:tracking-[0.5em] text-center">EMUN Excellence v2.0</p>
    </div>
  );
}