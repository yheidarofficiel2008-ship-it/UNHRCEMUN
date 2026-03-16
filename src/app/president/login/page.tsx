"use client"

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Landmark, Lock, Mail, UserPlus, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardContent, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useFirebase } from '@/firebase';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function PresidentLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const { auth, firestore: db } = useFirebase();

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
        description: "Identifiants incorrects ou bloqueur de scripts actif.",
        variant: "destructive"
      });
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth || !db) return;
    setLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const roleDoc = doc(db, 'roles_president', user.uid);
      const roleData = {
        email: user.email,
        role: 'president',
        createdAt: serverTimestamp()
      };

      setDocumentNonBlocking(roleDoc, roleData, { merge: true });

      toast({ title: "Compte créé", description: "Votre accès président est activé." });
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
          <Landmark className="mx-auto h-12 w-12 text-primary" />
          <CardTitle className="text-2xl font-bold font-headline">Portail Président</CardTitle>
          <CardDescription>Accès réservé Immune UERC</CardDescription>
        </CardHeader>
        
        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2 px-6 bg-transparent">
            <TabsTrigger value="login">Connexion</TabsTrigger>
            <TabsTrigger value="signup">Initialiser</TabsTrigger>
          </TabsList>

          <TabsContent value="login">
            <form onSubmit={handleLogin}>
              <CardContent className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input id="login-email" className="pl-10" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">Mot de passe</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input id="login-password" className="pl-10" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" className="w-full bg-primary" disabled={loading}>
                  {loading ? "Chargement..." : <><LogIn className="mr-2 h-4 w-4" /> Accéder</>}
                </Button>
              </CardFooter>
            </form>
          </TabsContent>

          <TabsContent value="signup">
            <form onSubmit={handleSignUp}>
              <CardContent className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input id="signup-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Mot de passe</Label>
                  <Input id="signup-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" variant="outline" className="w-full border-primary text-primary" disabled={loading}>
                  {loading ? "Création..." : <><UserPlus className="mr-2 h-4 w-4" /> Créer le compte</>}
                </Button>
              </CardFooter>
            </form>
          </TabsContent>
        </Tabs>
      </Card>
      <p className="mt-8 text-xs text-muted-foreground text-center">Note: Si vous rencontrez des erreurs "Blocked by Client", désactivez AdBlock.</p>
    </div>
  );
}