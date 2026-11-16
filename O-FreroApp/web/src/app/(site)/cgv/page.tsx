import type { Metadata } from "next";
import { LegalPage, ToComplete } from "@/components/site/LegalPage";
import { SITE } from "@/lib/site";

export const metadata: Metadata = { title: "Conditions générales de vente" };

export default function CgvPage() {
  return (
    <LegalPage title="Conditions générales de vente" updated="16 novembre 2026">
      <section>
        <h2>1. Objet</h2>
        <p>
          Les présentes conditions encadrent les commandes passées sur ce site auprès de {SITE.name}, {SITE.address},{" "}
          {SITE.postalCity}, à emporter ou en livraison.
        </p>
      </section>
      <section>
        <h2>2. Commande</h2>
        <p>
          La commande est possible sans compte. Elle est confirmée à l&apos;écran et par e-mail, avec un lien de suivi.
          Le créneau de retrait choisi est au plus tôt 15 minutes après la commande ; l&apos;heure de livraison est
          indicative.
        </p>
      </section>
      <section>
        <h2>3. Prix et paiement</h2>
        <p>
          Les prix sont indiqués en euros toutes taxes comprises. La livraison est facturée selon la zone, avec un
          minimum de commande affiché avant validation. Le paiement se fait en ligne par carte (via Stripe), ou sur
          place au moment du retrait pour les commandes à emporter. La livraison se paie uniquement en ligne.
        </p>
      </section>
      <section>
        <h2>4. Fidélité</h2>
        <p>
          Avec un compte, chaque pizza récupérée ou livrée rapporte un tampon. Une fois le nombre de tampons atteint,
          une pizza de la carte est offerte (hors suppléments). Une pizza offerte ne rapporte pas de tampon.
        </p>
      </section>
      <section>
        <h2>5. Annulation et droit de rétractation</h2>
        <p>
          Conformément à l&apos;article L221-28 du Code de la consommation, le droit de rétractation ne s&apos;applique
          pas aux denrées alimentaires susceptibles de se détériorer rapidement. Pour toute modification ou annulation,
          appelez la pizzeria au {SITE.phoneDisplay} avant la préparation.
        </p>
      </section>
      <section>
        <h2>6. Réclamations et médiation</h2>
        <p>
          Pour toute réclamation, contactez la pizzeria. Médiateur de la consommation :{" "}
          <ToComplete>nom et coordonnées du médiateur</ToComplete>
        </p>
      </section>
    </LegalPage>
  );
}
