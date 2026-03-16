
"use client"

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardContent, CardTitle, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { db, auth } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { signInAnonymously } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

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
      
      const querySnapshot = await getDocs(q).catch((err) => {
        const permissionError = new FirestorePermissionError({
          path: 'delegates',
          operation: 'list'
        });
        errorEmitter.emit('permission-error', permissionError);
        throw err;
      });

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
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-2xl border-t-4 border-secondary">
        <CardHeader className="text-center space-y-2">
          <CardTitle className="text-3xl font-black uppercase tracking-tighter font-headline">Accès Délégué</CardTitle>
          <p className="text-sm text-muted-foreground uppercase tracking-widest font-bold">EMUN UNHRC</p>
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
          <CardFooter className="pt-2">
            <Button type="submit" className="w-full bg-secondary hover:bg-secondary/90 h-12 text-lg font-bold" disabled={loading}>
              {loading ? "Connexion..." : "Entrer en séance"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
