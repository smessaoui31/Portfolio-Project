import type { Metadata } from "next";
import { LegalPage, ToComplete } from "@/components/site/LegalPage";
import { SITE } from "@/lib/site";

export const metadata: Metadata = { title: "Mentions légales" };

export default function MentionsLegalesPage() {
  return (
    <LegalPage title="Mentions légales" updated="16 novembre 2026">
      <section>
        <h2>Éditeur du site</h2>
        <p>
          <strong>{SITE.name}</strong>, <ToComplete>forme juridique et capital social</ToComplete>
          <br />
          {SITE.address}, {SITE.postalCity}
          <br />
          Téléphone : {SITE.phoneDisplay}
          <br />
          SIRET : <ToComplete>numéro SIRET</ToComplete>
          <br />
          Responsable de la publication : <ToComplete>nom du gérant</ToComplete>
        </p>
      </section>
      <section>
        <h2>Hébergement</h2>
        <p>
          <ToComplete>nom, adresse et téléphone de l&apos;hébergeur</ToComplete>
        </p>
      </section>
      <section>
        <h2>Données personnelles</h2>
        <p>
          Les informations saisies lors d&apos;une commande (prénom, téléphone, e-mail, adresse de livraison) servent
          uniquement à préparer, livrer et suivre la commande. Le compte client, facultatif, conserve l&apos;historique
          des commandes et la carte de fidélité. Les paiements en ligne sont traités par Stripe : O&apos;Frero ne voit
          ni ne conserve les numéros de carte.
        </p>
        <p className="mt-3">
          Vous pouvez demander l&apos;accès, la rectification ou la suppression de vos données en appelant la
          pizzeria ou par e-mail à <ToComplete>adresse e-mail de contact</ToComplete>.
        </p>
      </section>
      <section>
        <h2>Cookies</h2>
        <p>
          Le site utilise uniquement des cookies nécessaires à son fonctionnement (session de connexion) et le
          stockage local du navigateur pour garder le panier. Aucun cookie publicitaire ni de mesure d&apos;audience.
        </p>
      </section>
    </LegalPage>
  );
}
