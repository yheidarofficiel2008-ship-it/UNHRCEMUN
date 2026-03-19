"use client"

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Lock, ArrowLeft, Users, Globe } from 'lucide-react';
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

  const lang = committee?.language || 'fr';
  const t = {
    fr: {
      portal: "Portail des Délégués",
      committeeLabel: "Comité",
      loading: "Vérification...",
      delegation: "Délégation Nationale",
      accessCode: "Code de Séance",
      enterButton: "Rejoindre la Session",
      backHub: "Retour au Hub",
      errorTitle: "Accès Invalidé",
      errorDesc: "Délégation ou code d'accès erroné.",
      welcome: "Accès Autorisé"
    },
    en: {
      portal: "Delegates Portal",
      committeeLabel: "Committee",
      loading: "Verifying...",
      delegation: "National Delegation",
      accessCode: "Session Code",
      enterButton: "Join the Session",
      backHub: "Back to Hub",
      errorTitle: "Invalid Access",
      errorDesc: "Incorrect delegation or access code.",
      welcome: "Access Granted"
    }
  }[lang];

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
        toast({ title: t.errorTitle, description: t.errorDesc, variant: "destructive" });
        setLoading(false);
      } else {
        const delegateDoc = querySnapshot.docs[0];
        const delegateData = { id: delegateDoc.id, committeeId, ...delegateDoc.data() };
        localStorage.setItem('delegate_session', JSON.stringify(delegateData));
        toast({ title: t.welcome, description: `${country} connecté à ${committee?.name}.` });
        router.push(`/committees/${committeeId}/delegate/dashboard`);
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 md:p-6 bg-background">
      <Card className="w-full max-w-md border-none glass-card rounded-[1.5rem] md:rounded-[2.5rem] p-6 md:p-10 overflow-hidden relative shadow-2xl">
        <div className="absolute top-0 left-0 w-full h-1.5 md:h-2 bg-gradient-to-r from-primary to-black"></div>
        <CardHeader className="text-center space-y-4 md:space-y-6 pt-4 md:pt-6">
          <div className="p-3 md:p-4 bg-primary/5 rounded-[1.5rem] md:rounded-[2rem] w-fit mx-auto border border-primary/10 shadow-inner">
            <Users className="size-8 md:size-12 text-primary" />
          </div>
          <div className="space-y-1.5 md:space-y-2">
            <CardTitle className="text-2xl md:text-4xl font-black uppercase tracking-tight text-gradient leading-none">{t.portal}</CardTitle>
            <CardDescription className="font-bold uppercase tracking-[0.2em] text-[8px] md:text-[10px] text-primary/60">
              {committee ? `${t.committeeLabel} ${committee.name}` : t.loading}
            </CardDescription>
          </div>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4 md:space-y-6 pt-2 md:pt-4">
            <div className="space-y-1.5 md:space-y-2">
              <Label className="text-[8px] md:text-[10px] uppercase font-black tracking-widest text-primary/60 ml-1">{t.delegation}</Label>
              <div className="relative">
                <Globe className="absolute left-3.5 md:left-4 top-1/2 -translate-y-1/2 size-4 md:size-5 text-primary/30" />
                <Input placeholder="Ex: France, Japon..." value={country} onChange={(e) => setCountry(e.target.value)} required className="pl-10 md:pl-12 h-11 md:h-14 rounded-xl md:rounded-2xl border-primary/10 bg-primary/[0.01] font-bold text-sm md:text-base" />
              </div>
            </div>
            <div className="space-y-1.5 md:space-y-2">
              <Label className="text-[8px] md:text-[10px] uppercase font-black tracking-widest text-primary/60 ml-1">{t.accessCode}</Label>
              <div className="relative">
                <Lock className="absolute left-3.5 md:left-4 top-1/2 -translate-y-1/2 size-4 md:size-5 text-primary/30" />
                <Input type="password" className="pl-10 md:pl-12 h-11 md:h-14 rounded-xl md:rounded-2xl border-primary/10 bg-primary/[0.01] font-mono tracking-widest text-sm md:text-base" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-3 md:gap-4 mt-4 md:mt-6">
            <Button type="submit" className="w-full bg-primary hover:bg-primary/90 h-12 md:h-16 text-[10px] md:text-xs font-black uppercase tracking-[0.2em] rounded-xl md:rounded-2xl shadow-xl shadow-primary/20 transition-all active:scale-95" disabled={loading}>
              {loading ? t.loading : t.enterButton}
            </Button>
            <Button asChild variant="ghost" className="w-full text-muted-foreground hover:text-primary rounded-xl h-10 md:h-12 font-bold uppercase tracking-widest text-[9px] md:text-[10px]">
              <Link href="/"><ArrowLeft className="mr-2 size-3.5 md:size-4" /> {t.backHub}</Link>
            </Button>
          </CardFooter>
        </form>
      </Card>
      <p className="mt-8 md:mt-12 text-[8px] md:text-[10px] text-primary/30 font-black uppercase tracking-[0.3em] md:tracking-[0.5em] text-center">MUN-OS Diplomacy v2.0</p>
    </div>
  );
}