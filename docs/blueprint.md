# **App Name**: Immune UERC

## Core Features:

- Gestion de l'Accès (Président & Délégué): Système d'authentification pour les deux types d'utilisateurs: standard email/mot de passe pour le président et authentification simplifiée (nom de pays/mot de passe) pour les délégués, tous deux gérés par Supabase.
- Création et Lancement d'Actions (Président): Le président peut définir des actions avec leur nom, durée totale, possibilité de participation des délégués et description. Il peut ensuite les lancer pour démarrer la phase de participation.
- Interface Délégué des Actions & Participation: Les délégués peuvent visualiser les détails de l'action en cours, interagir pour indiquer leur participation ou leur refus, et voir le décompte du minuteur global en temps réel.
- Contrôle en Temps Réel et Suspension (Président): Le président observe en direct les réponses des délégués à l'action. Il dispose d'un bouton pour suspendre la séance, modifiant visuellement l'interface pour tous les utilisateurs vers une teinte rouge et affichant un message de suspension.
- Soumission de Résolutions (Délégué): Les délégués peuvent créer et soumettre leurs propositions de résolution via un formulaire incluant le nom de leur pays, les sponsors et un champ de texte pour le contenu détaillé de la résolution.
- Validation et Suivi des Résolutions (Président): Le président peut examiner chaque proposition de résolution soumise, et a la possibilité de l'approuver, de la rejeter ou de demander des modifications. Le statut de chaque résolution est visible pour les délégués.
- Outil d'Analyse des Résolutions (Président - IA): Un outil intelligent basé sur l'IA est fourni au président pour l'aider à extraire rapidement les points clés et à obtenir une synthèse concise des propositions de résolution soumises, facilitant leur évaluation.

## Style Guidelines:

- Palette lumineuse et professionnelle. La couleur primaire (actions, titres) est un bleu profond et serein (#2E5D9E) qui évoque la confiance et l'officialité. Le fond utilise une nuance de bleu-blanc très légère et apaisante (#F7F7F8).
- La couleur d'accent pour les éléments interactifs et les notifications est un teal clair mais affirmé (#2EADC4), apportant une touche de modernité et de clarté.
- En cas de suspension de séance, l'interface affichera une superposition rouge (#CC1414) discrète mais clairement visible pour signaler l'état d'urgence à tous les utilisateurs.
- Toutes les typographies (titres, corps de texte, éléments d'interface) utiliseront la police sans-serif 'Inter' pour sa clarté, sa lisibilité et son allure moderne et objective, essentielle pour un contenu factuel.
- Les icônes seront épurées, modernes et fonctionnelles, privilégiant la simplicité pour une navigation intuitive et un aspect sérieux, aligné avec les standards des interfaces des Nations Unies.
- Une disposition claire et hiérarchisée, divisant l'écran en panneaux dédiés pour le président et les délégués. L'accent est mis sur la visibilité immédiate de l'action en cours et du minuteur global. La gestion de l'espace blanc contribuera à une sensation d'ouverture et de professionnalisme.
- Des animations subtiles et fluides seront utilisées pour les mises à jour en temps réel (minuteurs, réponses de participation) et les transitions d'état de l'interface (mode suspension), garantissant une expérience utilisateur réactive et agréable sans distractions inutiles.