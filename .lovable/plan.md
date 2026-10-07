# Système de connecteurs AURIXEN

Les connecteurs deviennent une couche à part, indépendante des modules. Chaque projet choisit ses connecteurs et le compte utilisé, puis les gère depuis ses réglages.

## Ce qui est conservé, modifié et ajouté

J'ai vérifié comment Pinterest, Gumroad, les Fichiers et le Canvas fonctionnent aujourd'hui avant d'écrire ce plan.

- **Import Pinterest — conservé tel quel.** Le modèle de rapport, la lecture par IA et l'enregistrement des pins ne changent pas. La règle anti-doublon actuelle (un pin par titre) reste la même. Le nouveau système l'appelle simplement comme mode « Import de rapport ».
- **Gumroad — conservé tel quel.** Même jeton côté serveur et mêmes boutons Tester / Synchroniser / Déconnecter. Les ventes gardent leur règle anti-doublon par numéro de vente Gumroad. On ajoute seulement le rattachement au compte et au projet.
- **Fichiers Aurixen et Canvas — non modifiés.** Ils restent le stockage natif d'Aurixen. Les fichiers externes s'ajoutent à côté, sans rien remplacer.
- **Page Intégrations actuelle** : elle reste accessible et propose un lien vers le nouveau hub.
- **Modifications** : uniquement des ajouts (nouvelles tables, colonnes facultatives, nouvelles pages et étapes). Aucune suppression ni aucun changement des données existantes.

## Ce que vous verrez

1. **Hub des connecteurs** (Réglages → Connecteurs)
   - Les connecteurs sont rangés par catégorie : Données & Analytics, Fichiers & stockage, Organisation, Communication, Recherche, IA.
   - Pour chaque connecteur, vous verrez : son statut, les comptes connectés, les projets qui l'utilisent, la dernière synchronisation, le nombre d'éléments, les erreurs et ses permissions.
   - Les services non développés sont affichés en « Bientôt disponible ».
2. **Nouvelle étape « Connecteurs » à la création d'un projet**, après Design.
   - Vous pouvez sélectionner un connecteur sans le connecter tout de suite (« Connecter maintenant » ou « Plus tard »).
3. **Projet → Réglages → Connecteurs**
   - Deux sections : « Connectés » et « Disponibles ».
   - Actions possibles : Ajouter, Configurer (choisir le compte), Synchroniser maintenant, Retirer du projet.
   - Léo Valen et Danse du Lion reçoivent aussi cette gestion.
4. **Déconnexion protégée**
   - « Déconnecter » ne supprime aucune donnée.
   - « Supprimer les données synchronisées » est une action séparée, à confirmer en tapant SUPPRIMER.

## Les connecteurs réels

- **Gumroad** : fonctionne déjà, il est rattaché au nouveau système.
- **Pinterest** : le mode « Import de rapport » fonctionne. La « Connexion officielle » reste en « À configurer » tant que vous n'avez pas d'accès développeur Pinterest : pas de fausse connexion.
- **Google Drive** : aucun compte Google Drive n'est relié à ce projet aujourd'hui, j'ai vérifié.
  - Au moment de le brancher, une carte s'affichera pour connecter votre compte Google.
  - Tant que cette connexion n'est pas faite et qu'un vrai appel à Drive n'a pas réussi, Drive reste affiché en « À connecter ». Aucun statut « connecté » ne sera affiché à tort.
  - Une fois connecté, vous choisissez les dossiers autorisés ; rien n'est importé automatiquement. Vous ajoutez au projet des références vers des fichiers, sans les copier.

## Données : ce qui vient du service et ce qu'utilise Aurixen

Deux couches distinctes, pour ne pas finir avec un grand bloc de données inexploitable :

- **Couche Aurixen (normalisée)** : des champs clairs que l'application utilise directement.
  - Les pins et les ventes restent dans leurs tables actuelles, avec leurs vraies colonnes.
  - Les nouveaux types d'objets (fichier Drive, etc.) ont des colonnes communes : titre, type, lien, image, date, produit, projet, compte, source, identifiant externe.
- **Couche brute** : la réponse d'origine du service, conservée à part. Elle sert seulement à retraiter ou à vérifier, jamais à afficher directement.
- **Liens** : une table de liens relie proprement un objet à un projet, un module, un objet du Canvas, une entrée du Journal ou un produit. Il n'y a pas de liens cachés dans les données brutes.
- La recherche globale lit uniquement la couche Aurixen, limitée au projet concerné.

## Détails techniques

- `src/lib/connectors.ts` : catalogue où chaque connecteur déclare id, nom, catégorie, icône, description, fournisseur, type d'authentification, capacités, permissions, méthodes de synchro, entités et disponibilité.
- Migration additive, avec droits d'accès et règles « own » sur chaque table :
  - `connector_accounts` : comptes externes (service, libellé, statut, dernière synchro, nombre d'éléments, erreur, configuration non secrète). Aucun jeton.
  - `project_connectors` : projet ↔ connecteur ↔ compte (activé, configuration, permissions accordées, dossiers autorisés).
  - `connected_objects` : colonnes normalisées (`kind`, `title`, `url`, `image_url`, `mime_type`, `occurred_at`, `product`, `project_slug`, `account_id`, `source`, `external_id`, `last_synced_at`) avec une contrainte d'unicité sur (utilisateur, source, compte, identifiant externe).
  - `connected_object_raw` : réponse d'origine (`payload` JSON, `fetched_at`), liée en un-pour-un à l'objet.
  - `object_links` : liens typés (`object_type`/`object_id` → `target_type`/`target_id`, rôle), pour relier pins, ventes et objets connectés au Canvas, au Journal, aux modules et aux produits.
  - Colonnes facultatives `account_id` et `last_synced_at` ajoutées à `pins` et `sales`. Les champs actuels et leur règle anti-doublon ne changent pas.
- Fonctions serveur authentifiées dans `src/lib/connectors.functions.ts`. Le code Gumroad et Pinterest existant est appelé tel quel. Le code Drive passe par la connexion Google gérée par Lovable, uniquement côté serveur, et seulement après une vraie connexion.
- Interface :
  - `ConnectorsHub` (route `/parametres/connecteurs`) ;
  - onglet Connecteurs dans `p.$slug.reglages`, plus des pages pour Léo et Lion ;
  - étape 4 du `ProjectWizard` ;
  - références Drive dans `FileManager` ;
  - `GlobalSearch` étendue à `connected_objects`.

## Ordre de réalisation

1. Catalogue, tables et hub.
2. Étape de création de projet et onglet Réglages → Connecteurs.
3. Gumroad et Pinterest (import) rattachés, avec vérification que tout fonctionne comme avant.
4. Google Drive : carte de connexion, puis vérification réelle avant d'afficher « connecté ».
5. Recherche globale, puis test complet sur mobile.
