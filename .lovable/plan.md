# Système de connecteurs AURIXEN

Les connecteurs deviennent une couche à part, indépendante des modules. Chaque projet choisit ses connecteurs et le compte utilisé, puis les gère depuis ses réglages. Rien d'existant n'est supprimé : Gumroad, l'import Pinterest, les fichiers Aurixen et le Canvas continuent de marcher.

## Ce que vous verrez

1. **Hub des connecteurs** (Réglages → Connecteurs)
   - Les connecteurs sont rangés par catégorie : Données & Analytics, Fichiers & stockage, Organisation, Communication, Recherche, IA.
   - Pour chaque connecteur, vous verrez :
     - son statut : non connecté, connecté, synchronisation, synchronisé, erreur ou reconnexion requise ;
     - les comptes connectés ;
     - les projets qui l'utilisent ;
     - la dernière synchronisation, le nombre d'éléments et les erreurs ;
     - ses permissions.
   - Les services pas encore développés (Google Analytics, YouTube, Instagram, Shopify, Gmail, OpenAI, etc.) sont affichés en « Bientôt disponible ». Aucune fausse connexion n'est créée.
2. **Nouvelle étape « Connecteurs » à la création d'un projet**, après Design.
   - Vous pouvez sélectionner un connecteur sans le connecter tout de suite, avec les choix « Connecter maintenant » ou « Plus tard ».
3. **Projet → Réglages → Connecteurs** (nouvel onglet)
   - Deux sections : « Connectés » et « Disponibles ».
   - Actions possibles : Ajouter, Configurer (choisir le compte), Synchroniser maintenant, Retirer du projet.
   - Léo Valen et Danse du Lion reçoivent aussi cette gestion.
4. **Déconnexion protégée**
   - « Déconnecter » ne supprime aucune donnée.
   - « Supprimer les données synchronisées » est une action séparée, à confirmer en tapant SUPPRIMER.

## Les trois premiers connecteurs réels

- **Gumroad** : la connexion actuelle est reprise telle quelle. Les ventes sont rattachées au compte et au projet, sans doublons.
- **Pinterest**, avec deux modes :
  - « Import de rapport » : fonctionne dès maintenant, c'est le système actuel.
  - « Connexion officielle » : la structure est prête, mais elle reste « À configurer » tant que vous n'avez pas votre accès développeur Pinterest. Aucune clé ne sera inventée.
- **Google Drive** : connexion de votre compte Google.
  - Vous choisissez les dossiers autorisés ; rien n'est importé automatiquement.
  - Vous ajoutez au projet des « références » vers des fichiers (nom, type, lien vers l'original) sans les copier.
  - Ces références apparaissent dans Fichiers, à côté des vrais fichiers Aurixen, avec un badge « Drive ».

## Préparé pour la suite

- Les données externes deviennent des « objets connectés » liés à leur source : un Pin, une vente, un fichier Drive.
- Ils apparaissent dans la recherche globale, toujours limités au projet concerné.
- Leur structure permet de les ajouter plus tard au Canvas.
- Plusieurs comptes peuvent exister pour un même service ; chaque projet choisit le sien.
- Un même compte peut servir à plusieurs projets, sans que les données de l'un deviennent visibles dans l'autre.

## Détails techniques

- **Catalogue** dans `src/lib/connectors.ts` : chaque connecteur déclare id, nom, catégorie, icône, description, fournisseur, type d'authentification, capacités, permissions, méthodes de synchro, entités prises en charge et disponibilité. Aucun cas particulier codé en dur dans l'interface.
- **Base de données** (migration additive, sans rien supprimer) :
  - `connector_accounts` : comptes externes par utilisateur (service, libellé, statut, dernière synchro, nombre d'éléments, erreur, configuration non secrète). Pas de jetons dans cette table.
  - `project_connectors` : lien projet ↔ connecteur ↔ compte (activé, configuration, permissions accordées, dossiers autorisés).
  - `connected_objects` : objets externes (source, compte, projet, identifiant externe, titre, URL, image, données JSON, date de dernière synchro). Une contrainte d'unicité empêche les doublons.
  - Ajout aux tables `sales` et `pins` de colonnes facultatives `account_id`, `project_slug` et `last_synced_at`.
  - Chaque table a ses droits d'accès et ses règles « own ».
- **Secrets** : le jeton Gumroad reste uniquement côté serveur. Pour Pinterest officiel, `PINTEREST_CLIENT_ID` et `PINTEREST_CLIENT_SECRET` ne seront demandés que lorsque vous aurez l'accès. Les identifiants Google Drive passent par la connexion Google gérée par Lovable (votre propre compte). Aucun jeton ne passe par le navigateur.
- **Fonctions serveur** dans `src/lib/connectors.functions.ts`, authentifiées : statut, lier ou retirer un connecteur d'un projet, synchroniser, déconnecter, purger. Pour Drive : lister les dossiers et fichiers, ajouter une référence.
- **Interface** :
  - `ConnectorsHub` (route `/parametres/connecteurs`) ;
  - `ProjectConnectors` (onglet dans `p.$slug.reglages`, plus une page pour Léo et Lion) ;
  - étape 4 du `ProjectWizard` ;
  - références Drive affichées dans `FileManager` ;
  - `GlobalSearch` étendue à `connected_objects`.
- L'ancienne page Intégrations reste accessible et renvoie vers le nouveau hub.

## Ordre de réalisation

1. Catalogue, tables et hub.
2. Étape de création de projet et onglet Réglages → Connecteurs.
3. Gumroad et Pinterest (import) rattachés au nouveau système.
4. Google Drive (connexion, dossiers autorisés, références).
5. Recherche globale, puis test complet sur mobile.
