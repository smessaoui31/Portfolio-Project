# O'Frero Pizza : migration de la carte de ofreropizza.com (design)

Date : 2026-11-20
Statut : en attente de validation

## 1. Intention

Le site actuel (ofreropizza.com, WordPress + WooCommerce) doit être remplacé par la nouvelle app Next (`O-FreroApp/web`). Pour basculer, la nouvelle app doit proposer exactement ce que les clients commandent aujourd'hui : mêmes produits, mêmes prix, mêmes choix (taille, sauce, parfum, composition des menus), mêmes horaires et même zone de livraison. Les photos viendront plus tard, fournies par le client.

La carte a été relevée le 2026-11-20 via l'API publique WooCommerce (`/wp-json/wc/store/v1/products`) et les options des fiches produit (extension YITH Product Add-ons). L'annexe A est la référence.

## 2. Objectifs

1. Reprendre la carte en vente aujourd'hui (annexe A) dans le seed, qui remplit toute base neuve, locale ou de production.
2. Ajouter au nouveau site des **groupes de choix** avec prix : taille, sauce, parfum, composition des menus.
3. Aligner les règles métier sur la pizzeria :
   - livraison : frais fixes par commande et minimum de 14 € ;
   - fidélité : un tampon par commande à emporter ;
   - cuisson : les trois choix du site actuel.
4. Faire de La pizza de mémé l'édition en cours, à la place des éditions d'exemple.

## 3. Non-objectifs

- Photos des produits (le client les ajoutera dans l'admin).
- Supplément de prix par article en livraison (remplacé par des frais par commande, décision du client).
- Bouteille offerte ajoutée automatiquement : le site l'annonce seulement (décision du client).
- Reprise des clients, comptes et commandes WooCommerce : on repart de zéro, comme décidé à la refonte.
- Textes SEO longs des fiches WooCommerce : seule la liste des ingrédients est reprise.
- Produits encore publiés mais absents de la boutique actuelle (catégorie « autres » : donuts, tartelettes, brownies et muffins anciens, Brookie) et La Remix (ancienne pizza du moment, absente de sa catégorie).

## 4. Anti-objectifs

- Un prix calculé côté client qui ferait foi : le serveur recalcule toujours.
- Un client qui valide une commande sans avoir fait un choix obligatoire (taille, sauce, pizzas d'un menu).
- Changer le prix du Large en modifiant 26 fiches une par une.

## 5. Approches considérées

1. **Groupes de choix réutilisables (retenue).** Un groupe (« Taille », « Sauce tex-mex », « Pizza au choix ») est défini une fois avec ses options et leurs prix, puis rattaché à plusieurs produits. Un même groupe peut être rattaché plusieurs fois au même produit avec un libellé (« Pizza 1 », « Pizza 2 », « Pizza 3 »). Une seule mécanique couvre tailles, sauces, parfums et menus, et un prix se change à un seul endroit.
2. **Choix propres à chaque produit.** Plus simple en base, mais le prix du Large se répète sur 26 pizzas et la liste des 26 pizzas sur trois menus. Écartée (anti-objectif 3).
3. **Produits séparés** (« Reine Médium », « Reine Large », une ligne par parfum). Écartée par le client.

## 6. Ce qui change

### 6.1 Groupes de choix

- Un groupe a :
  - un nom ;
  - un minimum et un maximum d'options à cocher. 1/1 donne un choix unique obligatoire, 0/1 un choix unique facultatif ;
  - des options ordonnées, chacune avec un nom, un prix ajouté (0 possible) et un état actif ou inactif.
- Un produit porte une liste ordonnée de rattachements. Chaque rattachement indique son groupe et, au besoin, un libellé qui remplace le nom du groupe à l'affichage.
- La fiche produit affiche les groupes dans l'ordre :
  - un choix unique s'affiche en boutons ou en liste ;
  - un choix multiple s'affiche en cases à cocher.
  - Le bouton d'ajout reste désactivé tant qu'un groupe obligatoire n'est pas rempli.
- **Prix d'une unité** = prix du produit (remise comprise) + options choisies + suppléments.
- Le panier distingue deux lignes dès que leurs choix diffèrent.
- **Serveur :** la commande refuse une option inconnue, inactive ou hors du produit, ainsi qu'un groupe en dessous de son minimum ou au-dessus de son maximum. Le message nomme le produit.
- **Commande enregistrée :** pour chaque article, on garde les choix faits (libellé du groupe, nom de l'option, prix au moment de la commande), comme pour les suppléments.
- **Affichage des choix :** sur le panier, le récapitulatif de commande, la page de suivi, l'e-mail de confirmation, le détail admin et le ticket cuisine.
- **Admin :**
  - une page « Choix » pour créer et modifier les groupes et leurs options, sur le modèle de la page Suppléments ;
  - dans la fiche produit, ajouter, retirer, ordonner et nommer les rattachements.
- Les paniers enregistrés (comptes) et la recommande (« Recommander ») gardent les choix. Une option devenue inactive fait sauter la ligne, comme un produit indisponible.

### 6.2 Suppléments

- Les suppléments reçoivent une famille : Fromages, Viandes, Poissons, Légumes, Autres.
- La fiche produit les affiche par famille, dans cet ordre.
- L'admin permet de choisir la famille.

### 6.3 Cuisson

- Les trois valeurs deviennent : Bien cuite, Normale (par défaut), Pas trop cuite.
- « Extra croustillante » est renommée « Pas trop cuite ». La migration renomme la valeur, aucune donnée n'est perdue.
- La cuisson reste proposée pour les produits des catégories pizza.
- Les menus la proposent comme un groupe de choix « Cuisson », à 0 €.

### 6.4 Catégories et fidélité

- **Catégories pizza.** Elles sont marquées « pizza » : Collectors, Best-sellers, Prestiges, Calzones et Pizzaninis. Leurs produits :
  - ont la cuisson et les suppléments ;
  - peuvent être la pizza offerte ;
  - comptent pour le tampon.
- **Catégorie Menus.** Elle est marquée « menu » (nouveau marqueur) : elle compte pour le tampon, mais un menu ne peut pas être la pizza offerte.
- **Tampon.** Une commande à emporter terminée (COMPLETED) donne **un seul tampon** si elle contient au moins un article d'une catégorie pizza ou menu, quel que soit le nombre d'articles.
  - Une commande qui utilise la pizza offerte ne donne pas de tampon.
  - Une commande en livraison ne donne pas de tampon.
- **Pizza offerte.**
  - Elle n'est utilisable qu'à emporter. Au passage en livraison, le choix est retiré et le serveur refuse la combinaison.
  - Elle couvre une unité de la ligne choisie : prix du produit et options choisies (la taille). Les suppléments restent payés.
- 10 tampons donnent droit à la pizza offerte, réglable dans l'admin comme aujourd'hui.
- Les commandes invitées rattachées à un compte suivent la même règle de tampon.
- Les tampons déjà crédités ne sont pas recalculés : la base repart de zéro (section 7).

### 6.5 Livraison, horaires, contact

- **Zone « Toulouse » :**
  - codes postaux 31000, 31100, 31300 et 31400 (tout Toulouse sauf 31200 et 31500) ;
  - frais de 3 € par commande, minimum de 14 € d'articles ;
  - tout est réglable dans l'admin.
- **Horaires :**
  - lundi à vendredi de 18:00 à 22:00 ;
  - samedi et dimanche de 12:00 à 13:30 et de 18:00 à 22:00.
- **Livraison jusqu'à 21 h 30.**
  - Les créneaux de livraison s'arrêtent 30 minutes avant la fermeture de chaque service : dernier créneau à 21:30 le soir et à 13:00 le midi. C'est un nouveau réglage, 30 par défaut.
  - Le retrait garde ses créneaux jusqu'à la fermeture.
- **Contact :**
  - ajout du second numéro, 09 83 53 05 55, et de l'e-mail siteofreropizza@gmail.com, partout où le site affiche le contact (pied de page, mentions légales) ;
  - le numéro principal reste 06 15 80 51 47.
- **Mention de la bouteille offerte :** « 3 pizzas Large à emporter : une bouteille 1,5 L offerte ». Elle apparaît sur la carte, en tête des pizzas.

### 6.6 Éditions

- Les éditions d'exemple N°04 à N°07 et leurs produits sont retirés du seed.
- **Édition N°01 « La pizza de mémé »** :
  - du 2026-11-01 au 2026-12-31, à 10,00 € ;
  - ingrédients : crème fraîche et quatre fromages AOP (tomme de Cantal, saint-nectaire, fourme d'Ambert, bleu d'Auvergne) ;
  - mêmes taille, cuisson et suppléments qu'une pizza.
- « Le mot des frères », d'après le client : « Quatre fromages AOP, fraîchement sélectionnés et testés par nous pendant un mois. »
- Dans les menus, l'option s'appelle « Pizza du moment » (+1 €) et non par son nom, pour rester valable d'une édition à l'autre.

## 7. Données et bascule

- La carte de l'annexe A est écrite dans un fichier de données du seed. Le seed actuel (carte de démonstration, 5 suppléments, éditions d'exemple, faux service de midi en semaine, zone avec 31200 et 31500) est remplacé.
- Le seed reste idempotent et crée toujours le compte admin depuis `ADMIN_EMAIL` / `ADMIN_PASSWORD`.
- **Base locale `ofrero` :** elle est vidée, puis remplie par le seed. Les commandes de test et le compte `test@ofrero.test` disparaissent. On ne contourne pas la protection Prisma sur `migrate reset` : on vide les tables par script, comme pour les tests.
- **Base de tests :** les fixtures et les tests suivent les nouveaux noms, prix et règles.
- Les produits n'ont pas d'image : l'app affiche déjà un visuel par défaut quand `imageUrl` est vide.

## 8. Laissé au builder

- Les noms exacts des tables, champs et migrations, ainsi que la forme du choix dans la ligne de panier (identifiants de rattachement et d'option).
- Le rendu précis des groupes sur la fiche produit, dans le style actuel.
- La forme de la page admin « Choix ».
- L'endroit exact de la mention « bouteille offerte » sur la carte.

## 9. Mes décisions (à vérifier par le client)

- Les Pizzaninis sont une catégorie pizza : ils peuvent être la pizza offerte et ils comptent pour le tampon.
- Une commande sans pizza ni menu (boissons, desserts) ne donne pas de tampon.
- Une commande qui utilise la pizza offerte ne donne pas de tampon.
- Les créneaux de livraison s'arrêtent 30 minutes avant chaque fermeture, midi compris.
- Le mot des frères reprend la phrase du client sous la forme : « Quatre fromages AOP, fraîchement sélectionnés et testés par nous pendant un mois. »
- Orthographe corrigée de trois noms : « Méditerranéenne », « Sundae » et « Häagen-Dazs ».
- Une remise sur un produit s'applique à son prix de base, pas aux options ni aux suppléments.
- Les options de « Pizza au choix » sont de simples noms, non liées aux fiches pizza : retirer une pizza de la carte demande aussi de désactiver son option dans ce groupe.
- Le Häagen-Dazs 500 ml n'existe qu'en Macadamia dans la boutique actuelle : il devient un produit sans choix.
- Frais de livraison : 3 € par commande, valeur provisoire réglable dans l'admin.

## Annexe A. Carte en vente le 2026-11-20

Prix en euros. « Pizza » = taille (Médium 26 cm +0, Large 33 cm +2,00), cuisson, suppléments.

**Collectors, pizza, 9,00**
- Margarita : sauce tomate, mozzarella, emmental, olives
- La Vegan : sauce tomate, poivrons, champignons, oignons, tomates, aubergines, olives
- Chèvre-miel : crème fraîche, mozzarella, emmental, chèvre, miel, olives
- Savoyarde : crème fraîche, mozzarella, emmental, dés de jambon, reblochon, oignons, pommes de terre, persillade
- Cheezy : sauce tomate, mozzarella, emmental, provolone, gorgonzola, olives
- Napoli : sauce tomate, mozzarella, emmental, anchois, olives
- Classic'O : sauce tomate, mozzarella, emmental, viande hachée, oignons, tomates fraîches, olives
- Reine : sauce tomate, mozzarella, emmental, jambon, champignons, olives

**Best-sellers, pizza, 10,00**
- La Kebab : crème fraîche, mozzarella, emmental, oignons, pommes de terre, tomates, kebab, persil. Avec en plus le groupe Sauce kebab (Algérienne, Pita), obligatoire.
- Alaska : crème fraîche, mozzarella, emmental, saumon, persillade
- Curry : crème fraîche, mozzarella, emmental, poulet curry, oignons, poivrons, olives
- Croq Chicken : crème fraîche, mozzarella, emmental, poulet fumé, oignons, pommes de terre, fromage croq, persillade
- Végétarienne : sauce tomate, mozzarella, emmental, poivrons, champignons, oignons, tomates, aubergines, olives
- Méditerranéenne : sauce tomate, mozzarella, emmental, thon, poivrons, oignons, œuf
- Hot spicy : sauce tomate, mozzarella, emmental, poulet spicy, poivrons, oignons, olives
- Oriental : sauce tomate, mozzarella, emmental, merguez, oignons, poivrons, olives

**Prestiges, pizza, 12,00**
- O'Frero : crème fraîche, mozzarella, emmental, jambon, viande hachée, oignons, pommes de terre, cheddar, œuf, persil
- Chicken mix : crème fraîche, mozzarella, emmental, poulet curry, poulet spicy, oignons, poivrons, cheddar, olives
- Duchesse : crème fraîche, mozzarella, emmental, magret de canard, oignons, champignons, persillade
- Marina : sauce tomate, mozzarella, emmental, thon, saumon, crevettes, moules, persillade

**Calzones, pizza, 10,00**
- Garlic Gratinée : crème fraîche, poulet boursin, mozzarella, emmental, oignons, pommes de terre, champignons
- V.I.P : crème fraîche, mozzarella, emmental, jambon, viande hachée, oignons, pommes de terre, Vache qui rit
- Suprêm' : crème fraîche, mozzarella, emmental, jambon, chèvre, champignons, persillade
- Burger : sauce tomate, mozzarella, emmental, viande hachée, oignons, champignons, cheddar
- Xtrem' : sauce tomate, mozzarella, emmental, thon, olives vertes, poivrons, champignons, oignons

**Pizzaninis, pizza sans taille, 7,90**
- Le 4 fromages : crème fraîche, mozzarella, emmental, chèvre, provolone
- Le Tikka : crème fraîche, mozzarella, emmental, poulet curry, oignons, poivrons, olives vertes
- Le Parmentier : crème fraîche, mozzarella, emmental, viande hachée, pommes de terre, oignons, persillade
- Le Rustik : crème fraîche, mozzarella, emmental, poulet fumé, oignons, champignons, pommes de terre
- L'Istanbul : crème fraîche, mozzarella, emmental, kebab, pomme de terre, oignons, tomates. Avec en plus le groupe Sauce kebab, obligatoire.
- Le Royal : sauce tomate, mozzarella, emmental, jambon, champignons, Vache qui rit

**Menus, menu**

| Menu | Prix | Contenu | Groupes |
|---|---|---|---|
| Menu Solo | 17,50 | 1 pizza au choix, 1 boisson 33 cl, 1 dessert | Pizza au choix, Cuisson, Boisson du menu Solo, Dessert du menu Solo |
| Menu Tribu | 27,90 | 2 pizzas au choix, 1 bouteille 1,5 L | Pizza au choix (×2 : « Pizza 1 », « Pizza 2 »), Cuisson, Bouteille du menu |
| Menu Maxi | 38,90 | 3 pizzas au choix, 1 bouteille 1,5 L | Pizza au choix (×3 : « Pizza 1 » à « Pizza 3 »), Cuisson, Bouteille du menu |
| The Box | 9,90 | 1 pizza Margarita Médium, 4 onion rings, 3 nuggets, 1 sauce au choix | Sauce tex-mex |

**Tex-mex, autre**
- Onion rings x6 : 3,00, avec la Sauce tex-mex
- Nuggets x6 : 4,00, avec la Sauce tex-mex
- Wings x5 : 4,90, avec la Sauce tex-mex

**Desserts, autre**
- Häagen-Dazs 100 ml : 3,30, avec le groupe Parfum Häagen-Dazs (Dulce de leche, Macadamia), obligatoire
- Häagen-Dazs Macadamia 500 ml : 7,30
- Maxi muffin banoffee : 3,30
- Sundae fruits rouges : 3,60
- Brownie crémeux noisette : 3,30
- Maxi muffin choco beurre de cacahuète : 3,30

**Boissons, autre**
- Boisson 33 cl : 1,50, avec le groupe Canette 33 cl (Oasis tropical, Oasis pomme-cassis-framboise, Ice tea pêche, Fanta citron, Fanta orange, Coca cherry, Coca zéro, Coca, 7up mojito), obligatoire
- Bouteille 1,5 L : 3,00, avec le groupe Bouteille 1,5 L (Pepsi, Cristaline pêche, 7up, Eau pétillante), obligatoire
- Eau 50 cl : 1,00, avec le groupe Eau 50 cl (Eau plate, Eau pétillante), obligatoire

**Groupes de choix** (tous obligatoires, choix unique, sauf mention)

| Groupe | Options |
|---|---|
| Taille | Médium 26 cm +0 ; Large 33 cm +2,00 |
| Sauce kebab | Algérienne ; Pita |
| Sauce tex-mex | Algérienne ; Barbecue ; Blanche |
| Cuisson (menus) | Bien cuite ; Normale ; Pas trop cuite |
| Pizza au choix | Pizza du moment +1,00 ; les 8 Collectors +0 ; les 8 Best-sellers +1,00 ; les 5 Calzones +1,00 ; les 4 Prestiges +3,00 |
| Boisson du menu Solo | Fanta orange ; Coca ; Coca zéro ; Oasis tropical ; Oasis pomme-cassis-framboise ; Ice tea pêche ; 7up mojito ; Fanta citron ; Coca cherry ; Eau ; Eau pétillante |
| Dessert du menu Solo | Brownie crémeux noisette ; Maxi muffin choco beurre de cacahuète ; Sundae fruits rouges ; Maxi muffin banoffee |
| Bouteille du menu | Pepsi ; Cristaline tropical ; 7up ; Eau pétillante |
| Parfum Häagen-Dazs | Dulce de leche ; Macadamia |
| Canette 33 cl, Bouteille 1,5 L, Eau 50 cl | voir Boissons |

La taille s'applique aux Collectors, Best-sellers, Prestiges, Calzones et à la pizza du moment. Elle ne s'applique ni aux Pizzaninis ni aux menus.

**Suppléments** (sur toutes les pizzas, les pizzaninis et la pizza du moment)
- Fromages, 1,50 : Emmental et mozzarella, Chèvre, Provolone, Gorgonzola, Vache qui rit, Fromage croq, Cheddar
- Viandes, 1,90 : Viande hachée, Merguez, Poulet curry, Poulet spicy (mexicain), Dés de jambon, Poulet fumé, Jambon de dinde. Magret de canard à 2,90.
- Poissons, 1,90 : Moules, Crevettes, Thon, Anchois. Saumon à 2,50.
- Légumes, 0,90 : Champignons, Oignons, Poivrons, Pommes de terre, Tomates, Aubergines, Olives noires
- Autres : Miel 0,50, Persil 0,20, Persillade 0,20, Œuf 1,50

**Ordre des catégories sur la carte :** Collectors, Best-sellers, Prestiges, Calzones, Pizzaninis, Menus, Tex-mex, Desserts, Boissons.
