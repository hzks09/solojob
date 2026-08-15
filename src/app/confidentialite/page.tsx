import type { Metadata } from "next";
import { LegalLayout, LegalSection } from "@/components/legal/legal-layout";

export const metadata: Metadata = { title: "Politique de confidentialité — SoloJob" };

export default function ConfidentialitePage() {
  return (
    <LegalLayout title="Politique de confidentialité">
      <LegalSection title="Responsable de traitement">
        <p>
          Le responsable du traitement des données personnelles collectées via SoloJob est [NOM DE
          L&apos;ÉDITEUR], [ADRESSE COMPLÈTE], joignable à [EMAIL DE CONTACT].
        </p>
      </LegalSection>

      <LegalSection title="Données collectées">
        <p>Lors de l&apos;utilisation de SoloJob, nous collectons :</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>les données de compte : e-mail, mot de passe (chiffré), nom ;</li>
          <li>
            les données professionnelles renseignées volontairement : nom d&apos;entreprise, SIRET, adresse, régime
            de TVA, IBAN, pseudo PayPal.me, logo ;
          </li>
          <li>
            les données saisies concernant les clients de l&apos;utilisateur : nom, e-mail, téléphone, adresse ;
          </li>
          <li>les données de facturation : devis, factures, montants, statuts de paiement ;</li>
          <li>les données d&apos;abonnement, traitées par Stripe (nous ne stockons jamais de numéro de carte bancaire).</li>
        </ul>
      </LegalSection>

      <LegalSection title="Finalités">
        <p>
          Ces données sont utilisées pour fournir le service (création de devis/factures, envoi de relances de
          paiement par e-mail, gestion de l&apos;abonnement), et à aucune autre fin commerciale.
        </p>
      </LegalSection>

      <LegalSection title="Base légale">
        <p>
          Le traitement repose sur l&apos;exécution du contrat qui nous lie à l&apos;utilisateur (fourniture du
          service SoloJob) et, pour les relances automatiques, sur l&apos;intérêt légitime de l&apos;utilisateur à
          se faire payer.
        </p>
      </LegalSection>

      <LegalSection title="Destinataires et sous-traitants">
        <p>Les données sont hébergées et traitées par les prestataires suivants, dans le cadre strict du service :</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Supabase (base de données, authentification, stockage des logos) ;</li>
          <li>Vercel (hébergement de l&apos;application) ;</li>
          <li>Stripe (paiement des abonnements SoloJob) ;</li>
          <li>Resend (envoi des e-mails de relance) ;</li>
          <li>PayPal, si l&apos;utilisateur configure un lien PayPal.me pour encaisser ses factures.</li>
        </ul>
        <p>Ces données ne sont jamais vendues ni transmises à des fins publicitaires.</p>
      </LegalSection>

      <LegalSection title="Transferts hors Union européenne">
        <p>
          Certains de nos prestataires (Vercel, Supabase, Stripe, Resend) sont susceptibles de traiter des données
          en dehors de l&apos;Union européenne, notamment aux États-Unis. Ces transferts sont encadrés par les
          clauses contractuelles types de la Commission européenne ou un mécanisme équivalent.
        </p>
      </LegalSection>

      <LegalSection title="Durée de conservation">
        <p>
          Les données sont conservées pendant toute la durée d&apos;utilisation du compte, puis supprimées dans un
          délai raisonnable après suppression du compte, sous réserve des obligations légales de conservation
          des documents comptables (factures notamment).
        </p>
      </LegalSection>

      <LegalSection title="Vos droits">
        <p>
          Conformément au RGPD, vous disposez d&apos;un droit d&apos;accès, de rectification, d&apos;effacement, de
          limitation, de portabilité et d&apos;opposition sur vos données. Vous pouvez exercer ces droits en nous
          contactant à [EMAIL DE CONTACT]. Vous disposez également du droit d&apos;introduire une réclamation
          auprès de la CNIL (cnil.fr).
        </p>
      </LegalSection>

      <LegalSection title="Cookies">
        <p>
          SoloJob utilise uniquement des cookies strictement nécessaires au fonctionnement du service (maintien de
          la session de connexion via Supabase Auth). Aucun cookie publicitaire ou de mesure d&apos;audience tiers
          n&apos;est utilisé à ce jour.
        </p>
      </LegalSection>
    </LegalLayout>
  );
}
