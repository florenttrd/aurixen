# Projets sur mesure dans AURIXEN

Objectif : créer autant de projets que vous voulez, chacun avec ses propres espaces (calendrier, écriture, fichiers, tableau de bord), son style graphique complet et sa présentation — comme Léo Valen et Danse du Lion, mais choisis par vous.

## 1. Création d'un projet en 3 écrans

Depuis le hub, « Ajouter un projet » ouvre un assistant :

1. **Identité** — nom, sous-titre, initiales du badge.
2. **Espaces** — cases à cocher : Tableau de bord, Calendrier, Écriture, Fichiers. Vous choisissez, et vous pouvez changer d'avis à tout moment dans les réglages du projet.
3. **Style** — couleur d'accent, seconde couleur, fond (noir profond, encre, clair), police des titres, police du texte, arrondi des cartes, intensité des effets (halo, grain, dégradés).

Le projet est créé immédiatement et apparaît dans le hub avec sa couleur et son badge.

## 2. Pages complètes par projet

Chaque projet créé obtient ses propres pages, comme les deux projets existants :

```text
/p/<projet>              accueil du projet
/p/<projet>/calendrier   si l'espace est activé
/p/<projet>/notes        si l'espace est activé
/p/<projet>/fichiers     si l'espace est activé
```

La barre de navigation du bas n'affiche que les espaces activés. Les données restent séparées par projet (vos notes, événements et fichiers de Léo Valen ne se mélangent pas avec un nouveau projet).

## 3. Personnalisation de la présentation

Dans « Réglages du projet », vous pouvez régler :

- l'ordre des espaces dans la barre du bas ;
- la disposition de l'accueil : grandes cartes, liste compacte, ou résumé chiffré en haut ;
- les blocs visibles sur l'accueil (prochains événements, dernières notes, derniers fichiers, notes épinglées) et leur ordre ;
- le style graphique complet (couleurs, polices, fond, arrondis, effets), avec aperçu en direct.

Tout est modifiable après coup, sans perdre les données.

## 4. Projets existants

Léo Valen et Danse du Lion gardent leurs pages spécifiques actuelles (pins, ventes, restaurants) et leurs URL. Rien n'est déplacé ni cassé.

## 5. Suppression

Le mécanisme de sécurité déjà en place (recopier le nom exact puis mot de passe) s'applique aussi à ces projets, et supprime leurs notes, événements et fichiers.

---

## Détails techniques

**Base de données** (une migration) : extension de `public.projects` avec `subtitle`, `initials`, `accent_secondary`, `surface` (dark/ink/light), `font_display`, `font_body`, `radius`, `effects`, `modules jsonb` (liste d'espaces activés), `layout jsonb` (disposition + ordre + blocs), `sort_order`. Valeurs par défaut compatibles avec les lignes existantes ; RLS/GRANT déjà en place sur la table, policies inchangées.

**Thème dynamique** : un composant `ProjectTheme` applique les tokens CSS (`--primary`, `--background`, `--radius`, `--font-display`…) en variables inline sur le conteneur du projet. Aucune couleur en dur dans les composants ; les tokens sémantiques de `src/styles.css` restent la seule source.

**Routes** : nouveau groupe `src/routes/_authenticated/p.$slug.*` — `route.tsx` (layout : charge le projet, applique le thème, construit la nav depuis `modules`), `index.tsx`, `calendrier.tsx`, `notes.tsx`, `fichiers.tsx`, chaque enfant renvoyant vers un espace non activé s'il est désactivé. Réutilisation directe de `CalendarBoard`, `NotesSpace` et `FileManager`, qui acceptent déjà `projectSlug`.

**Hub** : `src/routes/_authenticated/hub.tsx` — les projets personnalisés deviennent des liens vers `/p/$slug` avec leur couleur, et le bouton « Ajouter un projet » ouvre l'assistant (`ProjectWizard`). Nouvelle route `/p/$slug/reglages` pour l'édition du style et des espaces.

**Hooks** : ajout dans `src/hooks/useAurixen.ts` de `useProjects`, `useCreateProject`, `useUpdateProject`, `useDeleteProjectData` (nettoyage notes/events/files par `project_slug`).

Non inclus à cette étape : bases de données personnalisées par projet (type « restaurants ») et intégrations API par projet — à traiter séparément si besoin.
