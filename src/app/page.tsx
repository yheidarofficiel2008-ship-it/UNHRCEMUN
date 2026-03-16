
"use client"

import { useState } from 'react';
import Link from 'next/link';
import { Shield, Users, Settings, Globe, PlusCircle, ArrowRight } from 'lucide-react';
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
    <div className="min-h-screen bg-background flex flex-col items-center justify-start p-6 pt-12">
      <div className="max-w-5xl w-full space-y-12">
        <div className="space-y-4 text-center">
          <Badge variant="outline" className="px-4 py-1 border-primary text-primary font-black uppercase tracking-[0.3em]">System Engine</Badge>
          <h1 className="text-7xl font-black tracking-tighter text-primary font-headline uppercase">
            MUN-OS
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto font-medium">
            Le système d'exploitation centralisé pour la gestion de vos comités de simulation des Nations Unies.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            Array(3).fill(0).map((_, i) => (
              <Card key={i} className="animate-pulse bg-muted h-[200px]" />
            ))
          ) : (
            committees?.map((committee) => (
              <Card key={committee.id} className="group hover:shadow-2xl transition-all border-2 hover:border-primary overflow-hidden">
                <CardHeader className="bg-muted/30 pb-4">
                  <div className="flex justify-between items-start">
                    <Globe className="h-8 w-8 text-primary opacity-50 group-hover:opacity-100 transition-opacity" />
                    <Badge className="bg-green-500">Actif</Badge>
                  </div>
                  <CardTitle className="text-2xl font-black uppercase tracking-tight mt-2">{committee.name}</CardTitle>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  <div className="grid grid-cols-2 gap-2">
                    <Button asChild variant="outline" className="w-full border-primary text-primary font-bold">
                      <Link href={`/committees/${committee.id}/president/login`}>
                        <Shield className="mr-2 h-4 w-4" /> Bureau
                      </Link>
                    </Button>
                    <Button asChild className="w-full bg-primary font-bold">
                      <Link href={`/committees/${committee.id}/delegate/login`}>
                        <Users className="mr-2 h-4 w-4" /> Délégué
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}

          {committees?.length === 0 && !isLoading && (
            <Card className="col-span-full py-12 border-dashed border-2 flex flex-col items-center justify-center text-muted-foreground">
              <PlusCircle size={40} className="mb-4 opacity-20" />
              <p className="italic">Aucun comité n'a encore été créé par l'administration.</p>
            </Card>
          )}
        </div>

        <div className="flex justify-center pt-12">
          <Button asChild variant="ghost" className="text-muted-foreground hover:text-primary gap-2">
            <Link href="/admin">
              <Settings size={18} /> Gérer les Comités (Accès Admin)
            </Link>
          </Button>
        </div>
      </div>
      
      <footer className="mt-auto py-8 text-[10px] text-muted-foreground uppercase tracking-[0.5em] opacity-30">
        MUN Operating System v2.0
      </footer>
    </div>
  );
}
