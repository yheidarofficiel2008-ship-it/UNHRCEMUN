
"use client"

import Link from 'next/link';
import { Shield, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function Home() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <div className="max-w-4xl w-full space-y-8 text-center">
        <div className="space-y-4">
          <h1 className="text-6xl font-black tracking-tighter text-primary font-headline uppercase">
            EMUN UNHRC
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto font-medium">
            Plateforme de gestion officielle pour le Conseil des droits de l'homme des Nations Unies.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
          <Card className="hover:shadow-xl transition-all border-2 hover:border-primary/50 group">
            <CardHeader>
              <Shield className="h-12 w-12 text-primary mb-4 mx-auto group-hover:scale-110 transition-transform" />
              <CardTitle className="text-2xl">Portail Président</CardTitle>
              <CardDescription>
                Accès réservé au bureau de la présidence pour diriger les débats et superviser la session.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full bg-primary hover:bg-primary/90 h-12 text-lg font-bold">
                <Link href="/president/login">Accéder au Bureau</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-xl transition-all border-2 hover:border-secondary/50 group">
            <CardHeader>
              <Users className="h-12 w-12 text-secondary mb-4 mx-auto group-hover:scale-110 transition-transform" />
              <CardTitle className="text-2xl">Espace Délégué</CardTitle>
              <CardDescription>
                Accès pour les délégations membres pour voter, intervenir et soumettre des résolutions.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" className="w-full border-secondary text-secondary hover:bg-secondary hover:text-white h-12 text-lg font-bold">
                <Link href="/delegate/login">Se connecter</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
