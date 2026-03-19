"use client"

import { useState } from 'react';
import Link from 'next/link';
import { Shield, Users, Settings, Globe, PlusCircle, ArrowRight, LayoutDashboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useCollection } from '@/firebase';
import { useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { useFirebase } from '@/firebase';

export default function MUNOSHome() {
  const { firestore: db } = useFirebase();
  
  const committeesQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, 'committees'), orderBy('created_at', 'desc'));
  }, [db]);

  const { data: committees, isLoading } = useCollection(committeesQuery);

  return (
    <div className="min-h-screen flex flex-col items-center justify-start p-6 pt-12 md:pt-20">
      <div className="max-w-6xl w-full space-y-12">
        <div className="space-y-4 text-center">
          <Badge variant="outline" className="px-6 py-1 border-primary/20 text-primary font-bold uppercase tracking-[0.4em] bg-white/50 backdrop-blur-sm shadow-sm">
            MUN Operating System
          </Badge>
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-gradient uppercase font-headline">
            MUN-OS
          </h1>
          <p className="text-base md:text-xl text-muted-foreground max-w-2xl mx-auto font-medium leading-relaxed">
            Plateforme centralisée de gestion pour vos simulations onusiennes.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {isLoading ? (
            Array(3).fill(0).map((_, i) => (
              <Card key={i} className="animate-pulse bg-white/50 border-none h-[220px] rounded-3xl" />
            ))
          ) : (
            committees?.map((committee) => (
              <Card key={committee.id} className="glass-card group hover:scale-[1.02] transition-all duration-300 rounded-3xl overflow-hidden">
                <CardHeader className="bg-gradient-to-b from-primary/5 to-transparent pb-4 pt-6">
                  <div className="flex justify-between items-start mb-3">
                    <div className="p-2.5 bg-white rounded-2xl shadow-sm border border-primary/10">
                      <Globe className="h-5 w-5 text-primary" />
                    </div>
                    <Badge className="bg-primary/10 text-primary border-primary/20 uppercase text-[9px] font-bold px-2.5 py-0.5">
                      {committee.language === 'en' ? 'Active' : 'Actif'}
                    </Badge>
                  </div>
                  <CardTitle className="text-xl font-black uppercase tracking-tight text-foreground/90">{committee.name}</CardTitle>
                </CardHeader>
                <CardContent className="pt-2 space-y-3">
                  <div className="grid grid-cols-1 gap-2.5">
                    <Button asChild className="w-full bg-primary hover:bg-primary/90 rounded-xl h-11 text-xs font-bold shadow-lg shadow-primary/20 group">
                      <Link href={`/committees/${committee.id}/delegate/login`} className="flex items-center justify-center">
                        <Users className="mr-2 h-4 w-4" /> {committee.language === 'en' ? 'Delegate Portal' : 'Portail Délégué'}
                        <ArrowRight className="ml-2 h-4 w-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                      </Link>
                    </Button>
                    <Button asChild variant="outline" className="w-full border-primary/20 text-primary font-bold rounded-xl h-11 text-xs hover:bg-primary/5">
                      <Link href={`/committees/${committee.id}/president/login`}>
                        <Shield className="mr-2 h-4 w-4" /> {committee.language === 'en' ? 'Presidential Office' : 'Bureau Présidence'}
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}

          {committees?.length === 0 && !isLoading && (
            <Card className="col-span-full py-12 border-dashed border-2 bg-white/30 rounded-3xl flex flex-col items-center justify-center text-muted-foreground">
              <PlusCircle size={40} className="mb-3 opacity-10" />
              <p className="italic text-base font-medium opacity-50 text-center px-6">En attente de la création des comités par l'administration.</p>
            </Card>
          )}
        </div>

        <div className="flex justify-center pt-8">
          <Button asChild variant="ghost" className="text-muted-foreground hover:text-destructive hover:bg-destructive/5 gap-2 font-bold uppercase tracking-widest text-[10px] px-8 py-3 rounded-full border border-transparent hover:border-destructive/10 h-auto transition-colors">
            <Link href="/admin">
              <Settings size={16} /> Console d'Administration
            </Link>
          </Button>
        </div>
      </div>
      
      <footer className="mt-auto py-12">
        <a 
          href="https://www.instagram.com/youssef_heidar/" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-primary font-black uppercase tracking-[0.3em] text-[10px] hover:opacity-70 transition-all duration-300 pb-1 border-b-2 border-primary/20 hover:border-primary"
        >
          Créé par Youssef Heidar
        </a>
      </footer>
    </div>
  );
}
