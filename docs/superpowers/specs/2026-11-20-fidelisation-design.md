# O'Frero Pizza : faire revenir les clients (design)

Date : 2026-11-20
Statut : en attente de validation

## 1. Intention

Le site prend déjà les commandes. Il doit maintenant donner envie de revenir. Deux leviers :
- supprimer les freins à la deuxième commande ;
- donner des raisons de revenir que les autres pizzerias n'ont pas, autour de la pizza du moment.

Toutes les idées proposées sont retenues sauf l'application installable et les notifications (décision du client).

## 2. Objectifs

1. Recommander sa dernière commande en deux touches, même sans compte.
2. Faire de l'édition un rendez-vous :
   - vote pour la suivante ;
   - révélation à date fixe ;
   - collection des éditions goûtées.
3. Rendre la fidélité visible : carte de tampons illustrée et progression dans le panier.
4. Parrainage : 1 tampon pour le parrain et 1 pour le filleul.
5. Payer en un geste avec Apple Pay et Google Pay.
6. Noter sa commande en une touche après le retrait.
7. Soirs de match : bandeau et commande du soir dès la veille.
8. Mesurer dans l'admin ce qui fait revenir.

## 3. Non-objectifs

- Application installable, notifications push, SMS.
- Cadeau d'anniversaire (décision du client) : on ne demande pas la date.
- Avis publics : les notes restent privées, visibles dans l'admin seulement.
- Limite de commandes par créneau, y compris les soirs de match (décision de la refonte).

## 4. Anti-objectifs

- Imposer un compte pour commander ou pour recommander.
- Une recommande qui passe des prix ou des produits périmés : le serveur revalide tout, comme pour une commande normale.
- Des tampons gagnés deux fois pour la même chose (parrainage, rattachement de commandes).
- Des données personnelles envoyées ailleurs que chez nous. La dernière commande d'un invité reste sur son téléphone.

## 5. Approches considérées

1. **Recommande d'un invité.**
   - Retenue : stocker sur le téléphone la dernière commande et les coordonnées saisies. Rien à créer côté serveur, aucune donnée nouvelle chez nous, et ça marche hors connexion.
   - Écartée : un cookie d'identité invité côté serveur. Il faudrait le lier aux commandes, et le client n'y gagnerait rien de plus.
2. **Vote.**
   - Retenue : un vote par compte, ce qui bloque le bourrage d'urne et donne une raison de créer un compte.
   - Écartée : un vote par appareil, trop facile à truquer (décision par défaut retenue, le client n'avait pas de préférence).
3. **Soir de match.**
   - Retenue : une soirée déclarée dans l'admin ouvre ses créneaux du soir dès la veille, en plus du service en cours.
   - Écartée : ouvrir la commande à l'avance pour tous les jours. Ce serait un autre produit, et les frères ne l'ont pas demandé.
4. **Paiement en un geste.**
   - Retenue : le bloc Express Checkout de Stripe (boutons Apple Pay et Google Pay) en tête de l'étape de paiement.
   - Écartée : compter seulement sur les moyens de paiement du Payment Element actuel, où les portefeuilles sont moins visibles.

## 6. Ce qui change

### 6.1 Recommander en deux touches

- **Ce que garde le téléphone.** Après chaque commande validée, le téléphone garde :
  - les lignes de la commande (produits, choix, suppléments, cuisson, quantités) ;
  - le mode, retrait ou livraison ;
  - les coordonnées saisies : prénom, téléphone, e-mail et adresse de livraison.
- **Une carte en tête de l'accueil**, quand une dernière commande existe sur le téléphone :
  - le résumé (« 2 × Reine · Taille : Large 33 cm, 1 × Boisson 33 cl ») ;
  - le total recalculé par le serveur ;
  - un bouton « Recommander ».
- **Le bouton remplit le panier et ouvre directement la commande.**
  - Les lignes qui ne sont plus commandables sont écartées, avec un message qui les nomme.
  - Le formulaire est prérempli avec les coordonnées gardées.
- Avec un compte, la carte utilise la dernière commande du compte si le téléphone n'en a pas.
- **Effacer.** Un lien « Oublier ces informations » vide ce que le téléphone garde.
- Une commande passée depuis une recommande est marquée comme telle, pour les mesures (6.8). Cela vaut aussi pour le bouton « Recommander » de l'historique du compte.

### 6.2 L'édition comme rendez-vous

- **Vote.**
  - L'admin ouvre un vote : un titre, trois pizzas candidates (nom, description) et une date de clôture.
  - Pendant le vote, l'accueil et la page Éditions affichent les trois candidates. Un compte vote une fois et ne peut pas changer son vote.
  - Après son vote, le client voit les pourcentages. Sans compte, il voit « Connecte-toi pour voter ».
  - Après la clôture, le résultat reste affiché avec la gagnante en tête, jusqu'au début de l'édition suivante.
- **Révélation.**
  - Quand une édition future existe (date de début à venir), l'accueil montre « Édition N°xx » avec un compte à rebours jusqu'à son début et une silhouette mystère.
  - Le nom, les ingrédients et le prix ne sont pas envoyés au navigateur avant le début.
- **Collection.**
  - La page Éditions et la page Compte affichent « X éditions goûtées sur Y ».
  - Les éditions goûtées restent en couleur (déjà en place).
  - La première visite après qu'une nouvelle édition a été goûtée la marque d'une petite animation « Nouvelle dans ta collection ».

### 6.3 Fidélité visible

- **La carte de tampons devient une pizza dessinée**, découpée en autant de parts que de tampons nécessaires (10 aujourd'hui).
  - Les parts gagnées sont garnies, et elles se remplissent une à une avec une animation à l'affichage.
  - La carte figure sur l'accueil et sur la page Compte.
- **Dans le panier et à l'étape coordonnées, pour un compte qui commande à emporter :**
  - « Cette commande te rapporte 1 tampon : plus que N commandes avant ta pizza offerte » ;
  - ou « Ta pizza offerte t'attend ».
- **Pour un invité à emporter :** « Avec un compte, cette commande te rapporterait 1 tampon », avec un lien vers l'inscription.
- **En livraison :** rien n'est affiché, puisque la livraison ne donne pas de tampon.

### 6.4 Parrainage

- **Le code.** Chaque compte a un code de parrainage court et unique.
  - La page Compte affiche le lien `/?parrain=CODE`, avec un bouton « Inviter un ami ». Il ouvre le partage natif du téléphone, ou copie le lien ailleurs.
  - Un visiteur arrivé par ce lien garde le code 30 jours sur son téléphone.
  - Le code est pré-rempli à l'inscription, et le champ reste modifiable et facultatif.
- **Qui est parrainé.** Un compte ne peut avoir qu'un parrain, fixé à l'inscription. On ne peut pas se parrainer soi-même.
- **La récompense.**
  - Quand la première commande à emporter du filleul passe en « Récupérée » (COMPLETED), le parrain et le filleul reçoivent chacun 1 tampon, une seule fois.
  - Ce bonus s'ajoute au tampon normal de la commande.
  - Le parrain voit dans son compte le nombre d'amis parrainés et de tampons gagnés ainsi.

### 6.5 Payer en un geste

- **À l'étape de paiement en ligne**, les boutons Apple Pay et Google Pay apparaissent en tête, au-dessus du formulaire de carte, quand l'appareil les propose.
  - Ils utilisent le même paiement que le formulaire de carte, et le retour suit le même chemin.
- **En production**, il faudra activer Apple Pay et Google Pay dans Stripe et y enregistrer le domaine. Le README le dira.
- En local sans clés Stripe, rien ne s'affiche : c'est le comportement actuel du paiement.

### 6.6 Note après le retrait

- **Sur la page de suivi** d'une commande terminée, la question « Alors, c'était comment ? » propose trois réponses en une touche : Bof, Bon, Excellent.
  - Un commentaire facultatif de 280 caractères au plus peut s'ajouter.
  - On note une fois par commande, via le lien privé de suivi, sans compte.
- **Dans l'admin :**
  - le détail de la commande montre la note ;
  - le tableau de bord montre la moyenne des 30 derniers jours et les derniers commentaires.

### 6.7 Soirs de match

- **Admin.** Une page « Soirées » pour déclarer une soirée : une date, un titre (« France – Angleterre ») et un message facultatif (« Coup d'envoi 21 h »).
- **Bandeau.** Il s'affiche sur tout le site client de 3 jours avant jusqu'à la fin de la soirée.
- **Commande à l'avance.**
  - La veille et le jour J, l'étape de commande propose en plus « Pour le match » : les créneaux du service du soir de ce jour-là.
  - Le serveur les accepte comme des créneaux valides, avec les mêmes règles de délai, de fermetures et de fin des livraisons.
  - Hors de ces deux jours, rien ne change.

### 6.8 Mesures dans l'admin

Le tableau de bord gagne un bloc « Clients qui reviennent », calculé sur 90 jours avec un client identifié par son e-mail. Il affiche :
- le nombre de clients, et la part de ceux qui ont commandé au moins deux fois ;
- le délai médian entre deux commandes d'un même client ;
- la part des commandes passées depuis une recommande ;
- le nombre de parrainages récompensés ;
- la note moyenne et le nombre de notes.

## 7. Contraintes

- **Comme aujourd'hui :**
  - le serveur recalcule les prix et valide les créneaux ;
  - rien n'est obligatoire pour commander ;
  - les animations respectent « réduire les animations » ;
  - aucun emoji ;
  - tutoiement.
- Le stockage sur le téléphone passe par `localStorage`, protégé par try/catch. Le site marche sans.
- Les données personnelles gardées sur le téléphone ne quittent pas le téléphone.
- Chaque nouvelle page admin vérifie le rôle admin, comme les autres.

## 8. Laissé au builder

- Les noms des tables et des champs.
- Le dessin exact de la pizza-carte de tampons et de la silhouette mystère, dans le style actuel.
- La forme du code de parrainage, à condition qu'il soit lisible et sans ambiguïté (pas de 0/O ni de 1/I).
- L'emplacement exact des blocs sur l'accueil.

## 9. Mes décisions (à vérifier par le client)

- Le vote est réservé aux comptes, et on ne peut pas changer son vote.
- Les pourcentages ne s'affichent qu'après avoir voté, pour ne pas influencer le vote.
- Le bonus de parrainage tombe à la première commande à emporter terminée du filleul, pas à l'inscription. On évite ainsi les faux comptes.
- Le bandeau des soirs de match apparaît 3 jours avant.
- La note offre trois niveaux (Bof, Bon, Excellent) plutôt que cinq étoiles : plus rapide, et plus honnête pour une pizzeria.
