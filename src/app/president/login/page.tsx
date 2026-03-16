"use client"

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, Lock, Mail, UserPlus, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardContent, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { auth } from '@/lib/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function PresidentLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast({ title: "Connexion réussie", description: "Bienvenue, Monsieur le Président." });
      router.push('/president/dashboard');
    } catch (error: any) {
      toast({
        title: "Erreur d'authentification",
        description: "Identifiants incorrects ou compte inexistant.",
        variant: "destructive"
      });
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await createUserWithEmailAndPassword(auth, email, password);
      toast({ title: "Compte créé", description: "Vous pouvez maintenant accéder au panel." });
      router.push('/president/dashboard');
    } catch (error: any) {
      toast({
        title: "Erreur de création",
        description: error.message,
        variant: "destructive"
      });
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-2xl border-t-4 border-primary">
        <CardHeader className="text-center space-y-4">
          <Shield className="mx-auto h-12 w-12 text-primary" />
          <CardTitle className="text-2xl font-bold font-headline">Portail Président</CardTitle>
          <CardDescription>Accès réservé au bureau de la présidence Immune UERC</CardDescription>
        </CardHeader>
        
        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2 px-6 bg-transparent">
            <TabsTrigger value="login" className="data-[state=active]:border-b-2 border-primary rounded-none">Connexion</TabsTrigger>
            <TabsTrigger value="signup" className="data-[state=active]:border-b-2 border-primary rounded-none">Initialiser</TabsTrigger>
          </TabsList>

          <TabsContent value="login">
            <form onSubmit={handleLogin}>
              <CardContent className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="email-login">Email de la Présidence</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input 
                      id="email-login" 
                      type="email" 
                      className="pl-10"
                      placeholder="president@immune-uerc.org"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password-login">Mot de passe</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input 
                      id="password-login" 
                      type="password" 
                      className="pl-10"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={loading}>
                  {loading ? "Chargement..." : <><LogIn className="mr-2 h-4 w-4" /> Accéder au Panel</>}
                </Button>
              </CardFooter>
            </form>
          </TabsContent>

          <TabsContent value="signup">
            <form onSubmit={handleSignUp}>
              <CardContent className="space-y-4 pt-4">
                <p className="text-xs text-muted-foreground mb-4 italic">
                  Utilisez cet onglet uniquement pour créer le premier compte président de votre session.
                </p>
                <div className="space-y-2">
                  <Label htmlFor="email-signup">Email souhaité</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input 
                      id="email-signup" 
                      type="email" 
                      className="pl-10"
                      placeholder="votre-email@mun.org"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password-signup">Définir un mot de passe</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input 
                      id="password-signup" 
                      type="password" 
                      className="pl-10"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" variant="outline" className="w-full border-primary text-primary hover:bg-primary/5" disabled={loading}>
                  {loading ? "Création..." : <><UserPlus className="mr-2 h-4 w-4" /> Créer le compte Président</>}
                </Button>
              </CardFooter>
            </form>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}
