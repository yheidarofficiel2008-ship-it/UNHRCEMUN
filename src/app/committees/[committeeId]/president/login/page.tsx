"use client"

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Lock, Mail, LogIn, ArrowLeft, Shield } from 'lucide-react';
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

  const lang = committee?.language || 'fr';
  const t = {
    fr: {
      portal: "Bureau de la Présidence",
      committeeLabel: "Comité",
      loading: "Authentification...",
      emailLabel: "Email Présidentiel",
      passLabel: "Code d'Accès",
      accessButton: "Déverrouiller le Bureau",
      backHub: "Retour au Hub",
      errorTitle: "Accès Refusé",
      errorDesc: "Ces identifiants ne correspondent pas à l'autorité de ce comité.",
      successTitle: "Session Initialisée",
      successDesc: "Ouverture du bureau"
    },
    en: {
      portal: "Presidential Office",
      committeeLabel: "Committee",
      loading: "Authenticating...",
      emailLabel: "Presidential Email",
      passLabel: "Access Code",
      accessButton: "Unlock Office",
      backHub: "Back to Hub",
      errorTitle: "Access Denied",
      errorDesc: "Credentials do not match the authority of this committee.",
      successTitle: "Session Initialized",
      successDesc: "Opening office"
    }
  }[lang];

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth || !committee) return;
    setLoading(true);

    if (email !== committee.president_email || password !== committee.president_password) {
      toast({
        title: t.errorTitle,
        description: t.errorDesc,
        variant: "destructive"
      });
      setLoading(false);
      return;
    }

    try {
      await signInAnonymously(auth);
      localStorage.setItem('active_committee_id', committeeId);
      toast({ title: t.successTitle, description: `${t.successDesc} - ${committee.name}` });
      router.push(`/committees/${committeeId}/president/dashboard`);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <Card className="w-full max-w-md border-none glass-card rounded-[2.5rem] p-10 overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary to-black"></div>
        <CardHeader className="text-center space-y-6 pt-6">
          <div className="p-4 bg-primary/5 rounded-[2rem] w-fit mx-auto border border-primary/10 shadow-inner">
            <Shield size={48} className="text-primary" />
          </div>
          <div className="space-y-2">
            <CardTitle className="text-4xl font-black uppercase tracking-tight text-gradient leading-none">{t.portal}</CardTitle>
            <CardDescription className="font-bold uppercase tracking-[0.2em] text-[10px] text-primary/60">
              {committee ? `${t.committeeLabel} ${committee.name}` : t.loading}
            </CardDescription>
          </div>
        </CardHeader>
        
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-6 pt-4">
            <div className="space-y-2">
              <Label className="text-[10px] uppercase font-black tracking-widest text-primary/60 ml-1">{t.emailLabel}</Label>
              <div className="relative">
                <Mail className="absolute left-4 top-4 h-5 w-5 text-primary/30" />
                <Input className="pl-12 h-14 rounded-2xl border-primary/10 bg-primary/[0.01] font-medium" type="email" placeholder="president@mun-os.org" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] uppercase font-black tracking-widest text-primary/60 ml-1">{t.passLabel}</Label>
              <div className="relative">
                <Lock className="absolute left-4 top-4 h-5 w-5 text-primary/30" />
                <Input type="password" className="pl-12 h-14 rounded-2xl border-primary/10 bg-primary/[0.01] font-mono tracking-widest" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4 mt-6">
            <Button type="submit" className="w-full bg-primary hover:bg-primary/90 h-16 text-xs font-black uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-primary/20 transition-all active:scale-95" disabled={loading}>
              {loading ? t.loading : <><LogIn className="mr-3 h-5 w-5" /> {t.accessButton}</>}
            </Button>
            <Button asChild variant="ghost" className="w-full text-muted-foreground hover:text-primary rounded-xl h-12 font-bold uppercase tracking-widest text-[10px]">
              <Link href="/"><ArrowLeft className="mr-2 h-4 w-4" /> {t.backHub}</Link>
            </Button>
          </CardFooter>
        </form>
      </Card>
      <p className="mt-12 text-[10px] text-primary/30 font-black uppercase tracking-[0.5em]">MUN-OS Excellence v2.0</p>
    </div>
  );
}