"use client"

import Link from 'next/link';
import { Shield, Users, Landmark } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function Home() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <div className="max-w-4xl w-full space-y-8 text-center">
        <div className="space-y-4">
          <Landmark className="mx-auto h-20 w-20 text-primary" />
          <h1 className="text-5xl font-extrabold tracking-tight text-primary font-headline">
            Immune UERC
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Plateforme de gestion pour le Conseil des droits de l'homme des Nations Unies.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
          <Card className="hover:shadow-lg transition-shadow border-2 hover:border-primary/50">
            <CardHeader>
              <Shield className="h-12 w-12 text-primary mb-4 mx-auto" />
              <CardTitle>Portail Président</CardTitle>
              <CardDescription>
                Accès réservé au bureau de la présidence pour diriger les débats.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full bg-primary hover:bg-primary/90">
                <Link href="/president/login">Se connecter</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow border-2 hover:border-secondary/50">
            <CardHeader>
              <Users className="h-12 w-12 text-secondary mb-4 mx-auto" />
              <CardTitle>Espace Délégué</CardTitle>
              <CardDescription>
                Accès pour les pays membres pour participer et soumettre des résolutions.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" className="w-full border-secondary text-secondary hover:bg-secondary hover:text-white">
                <Link href="/delegate/login">Accès Délégué</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}