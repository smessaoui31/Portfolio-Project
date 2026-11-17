# O'Frero Pizza : refonte complète (design)

Date : 2026-11-16
Statut : relu, en attente de validation du client

## 1. Intention

O'Frero est une pizzeria au feu de bois tenue par deux frères (288 rue Henri Desbals, 31100 Toulouse, 06 15 80 51 47). Le site sert à une seule chose : permettre à quelqu'un qui a faim de commander des pizzas, à emporter ou en livraison, le plus souvent depuis son téléphone.

La refonte remet le projet à jour de A à Z (stack, architecture, modèle de données) et refait entièrement l'interface. L'ambition visuelle est de proposer quelque chose qu'on n'a jamais vu sur un site de pizzeria, sans jamais ralentir le moment de la commande.

Ce qui rend O'Frero unique sur le site : **la pizza du moment**, une pizza événement qui dure deux mois. Elle est la star de l'accueil, qui pousse à la commander ou à appeler la pizzeria en cas de question.

## 2. Objectifs, non-objectifs, anti-objectifs

**Objectifs**
- Commander sans créer de compte.
- Un compte facultatif mais utile : carte de fidélité, historique des commandes, possibilité de recommander en un geste.
- La vente à emporter avec un créneau horaire, et la livraison dans une zone définie.
- Le paiement en ligne, ou au retrait pour la vente à emporter.
- Une page d'accueil construite autour de la pizza du moment, présentée comme une « édition limitée ».
- Un admin qui garde toutes ses fonctions actuelles, réhabillé avec le nouveau style, et qui gagne la gestion des éditions, des zones de livraison, des horaires et de la fidélité.
- Une stack entièrement à jour (versions vérifiées le 2026-11-16).

**Non-objectifs**
- Plusieurs restaurants, suivi GPS du livreur, avis clients, newsletter, intégration des réseaux sociaux.
- Une application mobile native.
- Plusieurs langues : le site est en français uniquement.
- Les tailles de pizza (absentes du modèle actuel, on ne les ajoute pas).

**Anti-objectifs** (ce qui ferait échouer la refonte même si tout fonctionne)
- Une animation ou un effet visuel qui retarde ou masque le bouton « Commander ».
- Obliger à créer un compte, ou insister lourdement pour qu'on en crée un.
- Une page d'accueil lente sur un téléphone en 4G.
- Un admin moins pratique qu'aujourd'hui pour les frères en plein service.

## 3. Contraintes

- Les versions sont vérifiées sur npm le 2026-11-16 : Next 16.4.6, React 19.3.1, Tailwind CSS 4.3.5, TypeScript 7.0.2, @prisma/client 7.10.1, Zod 4.6.7, Stripe 23.1.0, Better Auth 1.7.25, Motion 14.14.0, Vitest 5.1.0, Playwright 1.65.1, ESLint 10.15.0. Pour Prisma, le tag `latest` pointe sur `8.0.0-rc.33`, une version candidate. **On reste sur la 7.10.x stable**, que Better Auth prend en charge (peer `^5 || ^6 || ^7`). **TypeScript est figé en 6.0.3 et ESLint en 9.39.5.** La raison : TypeScript 7 ne fournit pas l'API JavaScript dont typescript-eslint a besoin (peer `<6.1.0`), et les plugins d'eslint-config-next 16.4.6 n'acceptent pas encore ESLint 10. Ces compatibilités ont été vérifiées le 2026-11-16.
- Node 24 (v24.22.1 installé dans `~/.local/node/bin`, qui n'est pas dans le PATH par défaut du shell).
- PostgreSQL. Docker est disponible sur la machine pour faire tourner la base en local.
- Stripe est déjà utilisé (PaymentIntent et Payment Element). On le garde.
- Le site est mobile d'abord. Il doit aussi être soigné sur ordinateur.
- Aucun emoji nulle part (code, contenu, commits).

## 4. Approches envisagées

1. **Une seule application Next.js** (retenue). L'API Express disparaît. La logique serveur vit dans Next : Server Components, Server Actions et Route Handlers, avec un accès direct à Prisma. Il n'y a qu'un seul déploiement, l'accueil est rendu côté serveur (rapide et bien référencé) et les types sont partagés. En contrepartie, les routes Express sont réécrites et la documentation Swagger disparaît.
2. **Deux applications à jour** (Express 5.3 et Next 16). Cette option garde l'architecture décrite dans la documentation Holberton (Stages 3 et 4) et une API réutilisable. En contrepartie, il y a deux déploiements, une configuration CORS et des types dupliqués, et l'API serait de toute façon réécrite en grande partie parce que le modèle de données change beaucoup.
3. **Un monorepo** (site, API, base et schémas partagés). C'est la séparation la plus propre, mais trop d'outillage pour une seule pizzeria.

**Choix du client : l'approche 1.** La refonte touche presque tout le serveur, et une seule application est beaucoup plus simple à faire vivre pour deux frères.

## 5. Décisions du client

- La commande ne demande pas de compte. Le compte apporte la fidélité et la traçabilité des commandes passées.
- L'accueil suit la **direction A, « l'édition limitée »**, sans le bandeau d'état en direct (ouvert ou fermé, délai) proposé dans la direction B.
- Les boutons « Commander » et « Appeler » sont toujours accessibles.
- Le paiement se fait en ligne, ou au retrait pour la vente à emporter.
- Les créneaux de retrait ne sont **jamais indisponibles** et n'ont pas de limite de capacité. La seule règle : le premier créneau proposé tombe au moins 15 minutes après la commande.
- Le site est une seule application Next.js.

## 6. Décisions du constructeur, à corriger si besoin

Chaque point ci-dessous a été proposé au client sans objection, ou bien relève d'un choix technique.

**Commande**
- Les créneaux durent 15 minutes et ne sont proposés que pendant les horaires d'ouverture. Le premier créneau correspond à l'heure de la commande plus 15 minutes, arrondie au quart d'heure suivant. Une option « Dès que possible » équivaut à ce premier créneau. Quand la pizzeria est fermée, on propose les créneaux du service suivant. On ne commande pas au-delà du service suivant.
- La livraison est assurée par la pizzeria elle-même. Les zones sont définies par des codes postaux, chacune avec ses frais et son minimum de commande, le tout réglable dans l'admin. Une adresse hors zone est refusée tout de suite avec un message clair qui propose la vente à emporter ou l'appel.
- La livraison se paie uniquement en ligne.
- Les horaires de livraison sont les mêmes que ceux d'ouverture. Le créneau de livraison est indicatif (« vers 20:30 »), avec un délai minimal de 30 minutes après la commande au lieu de 15. Ce délai est réglable.
- Les coordonnées demandées sont le prénom, le téléphone et l'e-mail, plus l'adresse en livraison. Avec un compte, tout est prérempli et les adresses enregistrées sont proposées.
- La personnalisation actuelle est conservée : la cuisson (normale, bien cuite, extra croustillante) et les suppléments par produit.
- Le panier vit dans le navigateur pour un invité et en base pour un compte. Les deux paniers sont fusionnés à la connexion.
- Les commandes à régler au retrait peuvent être marquées « non récupérée » dans l'admin.
- Toutes les heures sont calculées dans le fuseau `Europe/Paris`, quel que soit le fuseau du serveur.
- Sur l'accueil, « Commander » ouvre le panneau de personnalisation de la pizza du moment. Une fois la pizza ajoutée, le panier s'ouvre avec deux boutons : « Continuer » vers `/commande` et « Ajouter autre chose » vers `/carte`. Ailleurs, « Commander » mène à `/commande` si le panier contient quelque chose, et à `/carte` sinon. Le mode et le créneau se choisissent à la première étape de `/commande`, comme dans la maquette.
- Le stock est décompté à la création de la commande et rendu si elle est annulée ou si son paiement échoue.

**Suivi**
- Chaque commande a une page de suivi accessible par un lien privé (un jeton non devinable), sans connexion. Les étapes sont : reçue, au four, prête (ou en livraison), récupérée (ou livrée). C'est l'admin qui fait avancer ces étapes, et la page se rafraîchit toute seule.
- L'e-mail de confirmation contient ce lien. Il est envoyé via Resend si une clé `RESEND_API_KEY` est configurée. Sans clé, aucun e-mail ne part et le lien reste visible sur la page de confirmation.

**Compte et fidélité**
- La carte à tampons fonctionne ainsi : 1 pizza achetée donne 1 tampon (seuls les produits de la catégorie Pizzas comptent, quantités incluses). Au bout de 10 tampons, une pizza est offerte. Le nombre de tampons nécessaire est réglable dans l'admin.
- Les tampons sont crédités quand la commande est terminée (récupérée ou livrée), jamais à la simple création.
- La récompense est une pizza de la catégorie Pizzas au choix du client, appliquée à une ligne du panier au moment du paiement. Elle est utilisable en ligne comme au retrait. Les suppléments de la pizza offerte restent payants, et une pizza offerte ne rapporte pas de tampon.
- En développement, sans clé Resend, les liens de vérification et de suivi sont écrits dans la console du serveur pour pouvoir tester le parcours de bout en bout.
- La collection des éditions : chaque édition commandée par un compte s'affiche en couleur dans « Les éditions ».
- Le bouton « recommander pareil » est disponible depuis l'historique.
- Quand quelqu'un crée un compte avec un e-mail déjà utilisé pour des commandes passées sans compte, ces commandes s'y rattachent, avec les tampons et les éditions correspondants. Pour éviter qu'un inconnu récupère l'historique d'un autre, le rattachement n'a lieu qu'**après vérification de l'adresse e-mail**.
- L'authentification passe par Better Auth (e-mail et mot de passe, session dans un cookie httpOnly). Elle remplace le jeton JWT stocké dans le localStorage. Les rôles restent USER et ADMIN.

**Éditions**
- Une édition comprend un numéro, un produit, une date de début, une date de fin et un « mot des frères » (texte court). Elle se programme à l'avance dans l'admin et bascule automatiquement selon les dates.
- Entre deux éditions, l'affiche met en avant une pizza de la carte choisie dans l'admin, sans compte à rebours ni numéro.
- Le produit d'une édition est un produit normal de la catégorie Pizzas. Après la date de fin, il n'est plus commandable mais reste visible dans l'archive.

**Admin**
- Il garde toutes ses fonctions actuelles : tableau de bord avec statistiques et graphiques, commandes avec changement de statut et historique, son à chaque nouvelle commande, impression du ticket, produits avec stock, promotion et mise en avant, catégories avec ordre d'affichage, suppléments, utilisateurs.
- Il ajoute : les éditions, les zones de livraison, les horaires d'ouverture, les réglages de fidélité, le marquage « non récupérée », un filtre par mode et par créneau dans les commandes, et l'affichage du mode de paiement.
- Le ticket imprimé indique le mode (retrait ou livraison), le créneau, le mode de paiement (« À ENCAISSER » si le client paie au retrait), la cuisson et les suppléments.
- Il reprend le style du site (couleurs et typographies), avec une densité adaptée à un usage en service.

**Technique**
- La nouvelle application vit dans `O-FreroApp/web/`. Une fois la refonte vérifiée, `O-FreroApp/ofrero-webfront/` et `O-FreroApp/ofrero-api/` sont supprimés : l'historique Git les conserve. Le `package.json` qui traîne à la racine du dépôt (avec uniquement les dépendances Stripe) est supprimé.
- La base de données repart de zéro avec un nouvel historique de migrations Prisma. Aucune donnée n'est migrée. Le seed reprend la carte et les images actuelles.
- Les images produit restent des fichiers dans `public/` référencés par URL, comme aujourd'hui. L'envoi d'images depuis l'admin n'est pas inclus.
- Un `docker-compose.yml` lance PostgreSQL en local, et un `.env.example` documente toutes les variables.
- Le déploiement ne dépend d'aucun hébergeur. Le README documente un déploiement Vercel avec une base Postgres hébergée.
- Les tests : Vitest pour la logique métier (créneaux, zones, totaux, fidélité, bascule des éditions) et Playwright pour les parcours principaux (voir la section 10).
- Le README est réécrit. La documentation Holberton (Stages 1 à 4) reste intacte.

## 7. Direction visuelle

Elle s'appuie sur la maquette « Direction A » validée.

- **Couleurs** : un fond presque noir chaud `#0d0a08`, un texte crème `#f3e9d8`, du texte secondaire `#a8998a` et `#cbbfae`, des surfaces `#1a1410` et `#221a14`, des bordures `#241c16` et `#3a2e25`, et une seule couleur d'accent, braise `#ff5a1f`, réservée aux actions principales et à l'édition. La carte de fidélité est crème sur fond sombre.
- **Typographies** : Anton pour les titres d'affiche, en capitales très serrées, et Inter pour le texte et l'interface. Elles sont chargées avec `next/font`.
- **Signature** : un numéro d'édition, un nom de pizza énorme, une photo ronde qui tourne lentement (environ 40 s par tour), un compte à rebours en jours, heures et minutes, et une barre de progression sur la durée de l'édition. Les éditions passées apparaissent en archive : en gris si elles n'ont pas été goûtées, en couleur avec un anneau braise si elles l'ont été.
- **Mouvement** : les animations restent sobres et sont désactivées avec `prefers-reduced-motion`. Aucune animation ne bloque l'affichage du contenu ni l'interaction.
- **Barre d'action** : sur téléphone, une barre collée en bas de l'écran, sur toutes les pages publiques sauf le paiement, contient « Commander » (avec le prix de la pizza du moment sur l'accueil, puis le total du panier dès qu'il n'est plus vide) et un bouton « Appeler » (lien `tel:`).
- L'accessibilité doit au minimum garantir des contrastes AA, une navigation au clavier, des libellés sur les boutons-icônes et une langue `fr`.

## 8. Pages

**Site**
- `/` : l'accueil, dans cet ordre : l'affiche de l'édition, le mot des frères, un aperçu de la carte par catégorie avec ajout direct, l'archive des éditions, la carte de fidélité, puis les horaires, l'adresse et le téléphone.
- `/carte` : la carte complète par catégorie, avec l'ajout au panier et la personnalisation (cuisson et suppléments) dans un panneau.
- `/editions` : l'archive de toutes les éditions.
- `/commande` : le parcours en trois écrans de la maquette (mode et créneau, puis coordonnées et paiement, puis confirmation).
- `/suivi/[jeton]` : le suivi d'une commande, sans connexion.
- `/compte` : la connexion, l'inscription et la vérification de l'e-mail. Une fois connecté, le client y retrouve sa carte de fidélité, son historique avec « recommander pareil », sa collection d'éditions et ses adresses.
- Les pages légales : mentions légales et CGV, avec un contenu de base à compléter par le client.

**Admin** (`/admin`, rôle ADMIN)
- Tableau de bord, commandes (liste et détail), produits, catégories, suppléments, éditions, livraison (zones), horaires, fidélité, utilisateurs.

## 9. Modèle de données (évolutions)

Le constructeur fixe le schéma exact. Les changements nécessaires sont les suivants :
- **Order** : `userId` devient facultatif. On ajoute les coordonnées du client en copie figée (prénom, téléphone, e-mail), le mode (`PICKUP` ou `DELIVERY`), le créneau, le mode de paiement (`ONLINE` ou `AT_PICKUP`), les frais de livraison, la réduction de fidélité, le jeton de suivi et le numéro d'édition. L'adresse devient facultative et n'est obligatoire qu'en livraison. Les statuts deviennent : `PENDING_PAYMENT`, `RECEIVED`, `IN_OVEN`, `READY`, `OUT_FOR_DELIVERY`, `COMPLETED`, `NOT_COLLECTED`, `CANCELLED`, `FAILED`.
- **Edition** : numéro, produit, dates de début et de fin, mot des frères.
- **DeliveryZone** : codes postaux, frais, minimum de commande, statut actif ou non.
- **OpeningHours** : un ou plusieurs services par jour de la semaine, plus des fermetures exceptionnelles.
- **Settings** : un seul enregistrement, avec la pizza mise en avant entre deux éditions, le nombre de tampons pour une pizza offerte et les délais minimaux de retrait et de livraison.
- **Loyalty** : les tampons sont crédités et consommés par commande, et le solde est calculé à partir de ces mouvements.
- Les tables d'utilisateurs, de sessions et de vérification sont celles qu'exige Better Auth, avec le rôle en plus.

## 10. Vérification attendue

- Les commandes `lint`, `typecheck`, `test` (Vitest) et `build` passent.
- Les tests Playwright couvrent les parcours suivants :
  - un invité commande à emporter et paie au retrait ;
  - un invité commande en livraison et paie en ligne avec une carte de test Stripe ;
  - une adresse hors zone est refusée ;
  - un invité crée ensuite un compte avec le même e-mail, le vérifie, et retrouve sa commande et ses tampons ;
  - un compte utilise une pizza offerte ;
  - l'admin fait avancer une commande et le suivi se met à jour.
- La page d'accueil est contrôlée sur un téléphone (375 px) et sur ordinateur (1280 px), en mouvement normal et réduit.

## 11. Laissé au constructeur

La structure des dossiers dans `web/`, le découpage en composants, le choix entre Server Actions et Route Handlers selon les cas, la librairie de composants (shadcn/ui ou des composants faits main), la gestion du rafraîchissement du suivi (interrogation régulière suffit), le format du numéro de commande, le contenu par défaut des pages légales, et les données du seed.

## 12. Questions tranchées après relecture

1. **Données existantes** : il n'y a aucune donnée réelle à conserver (réponse du client). On repart d'une base vierge, avec un nouvel historique de migrations Prisma et un seed qui reprend la carte et les images actuelles, plus un compte admin créé à partir des variables d'environnement.

## 13. Remarque sur les photos

L'affiche de l'édition repose sur une photo ronde, vue de dessus, sur fond neutre. Les photos actuelles sont prises en biais avec un décor : elles fonctionnent pour démarrer, mais l'effet sera bien meilleur avec des photos dédiées que le client fournira. Ce point ne bloque pas la construction.
