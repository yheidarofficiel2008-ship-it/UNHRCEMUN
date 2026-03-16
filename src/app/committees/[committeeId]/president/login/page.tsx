
"use client"

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Lock, Mail, LogIn, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardContent, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useFirebase, useDoc } from '@/firebase';
import { useMemoFirebase } from '@/firebase';
import { signInAnonymously } from 'firebase/auth';
import { doc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

export default function PresidentLogin() {
  const params = useParams();
  const committeeId = params.committeeId as string;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const { auth, firestore: db } = useFirebase();

  const committeeRef = useMemoFirebase(() => db ? doc(db, 'committees', committeeId) : null, [db, committeeId]);
  const { data: committee } = useDoc(committeeRef);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth || !committee) return;
    setLoading(true);

    // Validation des identifiants par rapport au document Firestore du comité
    if (email !== committee.president_email || password !== committee.president_password) {
      toast({
        title: "Accès Refusé",
        description: "Ces identifiants ne correspondent pas à la présidence de ce comité.",
        variant: "destructive"
      });
      setLoading(false);
      return;
    }

    try {
      // On utilise l'auth anonyme pour obtenir une session valide pour les Security Rules
      await signInAnonymously(auth);
      
      // Stockage de l'ID du comité actif pour le contexte du dashboard
      localStorage.setItem('active_committee_id', committeeId);
      
      toast({ 
        title: "Connexion réussie", 
        description: `Bureau de la présidence - ${committee.name}` 
      });
      
      router.push(`/committees/${committeeId}/president/dashboard`);
    } catch (error: any) {
      toast({
        title: "Erreur d'authentification",
        description: error.message,
        variant: "destructive"
      });
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-2xl border-t-4 border-primary">
        <CardHeader className="text-center space-y-2">
          <CardTitle className="text-3xl font-black uppercase tracking-tighter font-headline">Portail Président</CardTitle>
          <CardDescription className="font-bold uppercase tracking-widest text-[10px]">
            {committee ? `Comité : ${committee.name}` : "Chargement..."}
          </CardDescription>
        </CardHeader>
        
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="login-email">Email Président</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input 
                  id="login-email" 
                  className="pl-10 h-11" 
                  type="email" 
                  placeholder="president@mun.org"
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  required 
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="login-password">Mot de passe</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input 
                  id="login-password" 
                  type="password" 
                  className="pl-10 h-11" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  required 
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-2">
            <Button type="submit" className="w-full bg-primary h-12 text-lg font-bold" disabled={loading}>
              {loading ? "Chargement..." : <><LogIn className="mr-2 h-5 w-5" /> Accéder au Bureau</>}
            </Button>
            <Button asChild variant="ghost" className="w-full">
              <Link href="/"><ArrowLeft className="mr-2 h-4 w-4" /> Retour au Hub</Link>
            </Button>
          </CardFooter>
        </form>
      </Card>
      <p className="mt-8 text-[10px] text-muted-foreground text-center uppercase tracking-widest opacity-30">MUN-OS v2.0</p>
    </div>
  );
}
