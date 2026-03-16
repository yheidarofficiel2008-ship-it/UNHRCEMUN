
"use client"

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Mail, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardContent, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useFirebase } from '@/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';

export default function PresidentLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const { auth } = useFirebase();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth) return;
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast({ title: "Connexion réussie", description: "Bienvenue au bureau de la présidence." });
      router.push('/president/dashboard');
    } catch (error: any) {
      toast({
        title: "Erreur d'authentification",
        description: "Identifiants incorrects ou accès non autorisé.",
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
          <CardDescription className="font-bold uppercase tracking-widest text-[10px]">Accès réservé EMUN UNHRC</CardDescription>
        </CardHeader>
        
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="login-email">Email Professionnel</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input 
                  id="login-email" 
                  className="pl-10 h-11" 
                  type="email" 
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
          <CardFooter>
            <Button type="submit" className="w-full bg-primary h-12 text-lg font-bold" disabled={loading}>
              {loading ? "Chargement..." : <><LogIn className="mr-2 h-5 w-5" /> Accéder au Bureau</>}
            </Button>
          </CardFooter>
        </form>
      </Card>
      <p className="mt-8 text-[10px] text-muted-foreground text-center uppercase tracking-widest opacity-50">EMUN UNHRC - Management Suite</p>
    </div>
  );
}
