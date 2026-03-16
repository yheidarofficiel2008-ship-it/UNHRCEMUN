"use client"

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Landmark, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardContent, CardTitle, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

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
        router.push('/delegate/dashboard');
      }
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: "Un problème est survenu lors de la connexion.",
        variant: "destructive"
      });
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center space-y-4">
          <Landmark className="mx-auto h-12 w-12 text-secondary" />
          <CardTitle className="text-2xl font-bold font-headline">Accès Délégué</CardTitle>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="country">Nom du Pays</Label>
              <Input 
                id="country" 
                placeholder="Ex: France" 
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input 
                  id="password" 
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
            <Button type="submit" className="w-full bg-secondary hover:bg-secondary/90" disabled={loading}>
              {loading ? "Connexion..." : "Entrer en séance"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
