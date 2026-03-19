
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
    <div className="min-h-screen flex flex-col items-center justify-start p-4 md:p-12 lg:p-20 pt-10 md:pt-20">
      <div className="max-w-6xl w-full space-y-8 md:space-y-12">
        <div className="space-y-3 md:space-y-4 text-center">
          <Badge variant="outline" className="px-4 md:px-6 py-1 border-primary/20 text-primary font-bold uppercase tracking-[0.2em] md:tracking-[0.4em] bg-white/50 backdrop-blur-sm shadow-sm text-[8px] md:text-[10px]">
            MUN Operating System
          </Badge>
          <h1 className="text-5xl md:text-8xl font-black tracking-tighter text-gradient uppercase font-headline leading-none">
            MUN-OS
          </h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {isLoading ? (
            Array(3).fill(0).map((_, i) => (
              <Card key={i} className="animate-pulse bg-white/50 border-none h-[180px] md:h-[220px] rounded-2xl md:rounded-3xl" />
            ))
          ) : (
            committees?.map((committee) => (
              <Card key={committee.id} className="glass-card group hover:scale-[1.02] transition-all duration-300 rounded-[1.5rem] md:rounded-3xl overflow-hidden">
                <CardHeader className="bg-gradient-to-b from-primary/5 to-transparent pb-4 pt-5 md:pt-6">
                  <div className="flex justify-between items-start mb-2 md:mb-3">
                    <div className="p-2 md:p-2.5 bg-white rounded-xl md:rounded-2xl shadow-sm border border-primary/10">
                      <Globe className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                    </div>
                    <Badge className="bg-primary/10 text-primary border-primary/20 uppercase text-[8px] md:text-[9px] font-bold px-2 py-0.5">
                      {committee.language === 'en' ? 'Active' : 'Actif'}
                    </Badge>
                  </div>
                  <CardTitle className="text-lg md:text-xl font-black uppercase tracking-tight text-foreground/90">{committee.name}</CardTitle>
                </CardHeader>
                <CardContent className="pt-1 md:pt-2 space-y-2.5 md:space-y-3">
                  <div className="grid grid-cols-1 gap-2 md:gap-2.5">
                    <Button asChild className="w-full bg-primary hover:bg-primary/90 rounded-xl h-10 md:h-11 text-[10px] md:text-xs font-bold shadow-lg shadow-primary/20 group">
                      <Link href={`/committees/${committee.id}/delegate/login`} className="flex items-center justify-center">
                        <Users className="mr-2 h-4 w-4" /> {committee.language === 'en' ? 'Delegate Portal' : 'Portail Délégué'}
                        <ArrowRight className="ml-2 h-4 w-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                      </Link>
                    </Button>
                    <Button asChild variant="outline" className="w-full border-primary/20 text-primary font-bold rounded-xl h-10 md:h-11 text-[10px] md:text-xs hover:bg-primary/5">
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
            <Card className="col-span-full py-12 md:py-20 border-dashed border-2 bg-white/30 rounded-2xl md:rounded-3xl flex flex-col items-center justify-center text-muted-foreground">
              <PlusCircle size={32} className="md:size-10 mb-3 opacity-10" />
              <p className="italic text-sm md:text-base font-medium opacity-50 text-center px-6">En attente de la création des comités par l'administration.</p>
            </Card>
          )}
        </div>

        <div className="flex justify-center pt-2 md:pt-4">
          <Button asChild variant="ghost" className="text-muted-foreground hover:text-red-600 hover:bg-red-50 gap-2 font-bold uppercase tracking-widest text-[8px] md:text-[10px] px-6 md:px-8 py-2 md:py-3 rounded-full border border-transparent hover:border-red-100 h-auto transition-colors">
            <Link href="/admin">
              <Settings className="size-3 md:size-4" /> Console d'Administration
            </Link>
          </Button>
        </div>
      </div>
      
      <footer className="mt-6 md:mt-8 py-4 mb-4">
        <a 
          href="https://www.instagram.com/youssef_heidar/" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-primary font-black uppercase tracking-[0.2em] md:tracking-[0.3em] text-[8px] md:text-[10px] hover:opacity-70 transition-all duration-300 pb-1 border-b-2 border-primary/20 hover:border-primary"
        >
          Créé par Youssef Heidar
        </a>
      </footer>
    </div>
  );
}
