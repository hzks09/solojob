import type { Metadata } from "next";
import Link from "next/link";
import { LegalLayout, LegalSection } from "@/components/legal/legal-layout";

export const metadata: Metadata = { title: "Politique de confidentialité — NextWatch" };

export default function ConfidentialitePage() {
  return (
    <LegalLayout title="Politique de confidentialité">
      <LegalSection title="Responsable de traitement">
        <p>
          Le responsable du traitement des données personnelles collectées via NextWatch est [NOM DE
          L&apos;ÉDITEUR], [ADRESSE COMPLÈTE], joignable à [EMAIL DE CONTACT].
        </p>
      </LegalSection>

      <LegalSection title="Données collectées">
        <p>Lors de l&apos;utilisation de NextWatch, nous collectons :</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>les données de compte : e-mail, mot de passe (chiffré), nom ;</li>
          <li>
            tes préférences de visionnage : vidéos aimées ou passées, catégories choisies à l&apos;inscription,
            vidéos sauvegardées dans ta liste ;
          </li>
          <li>les données d&apos;abonnement, traitées par Stripe (nous ne stockons jamais de numéro de carte bancaire).</li>
        </ul>
      </LegalSection>

      <LegalSection title="Finalités">
        <p>
          Ces données sont utilisées pour te proposer des vidéos qui correspondent à tes goûts (les swipes affinent
          les recommandations) et gérer ton abonnement, et à aucune autre fin commerciale.
        </p>
      </LegalSection>

      <LegalSection title="Base légale">
        <p>
          Le traitement repose sur l&apos;exécution du contrat qui nous lie à l&apos;utilisateur (fourniture du
          service NextWatch) et sur ton consentement pour l&apos;apprentissage de tes préférences (swipes).
        </p>
      </LegalSection>

      <LegalSection title="Destinataires et sous-traitants">
        <p>Les données sont hébergées et traitées par les prestataires suivants, dans le cadre strict du service :</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Supabase (base de données, authentification) ;</li>
          <li>Vercel (hébergement de l&apos;application) ;</li>
          <li>Stripe (paiement des abonnements NextWatch) ;</li>
          <li>Google / YouTube (recommandation et lecture des vidéos — voir ci-dessous).</li>
        </ul>
        <p>Ces données ne sont jamais vendues ni transmises à des fins publicitaires.</p>
      </LegalSection>

      <LegalSection title="Service tiers — YouTube">
        <p>
          NextWatch s&apos;appuie sur l&apos;API YouTube Data pour recommander des vidéos. Aucune préférence
          individuelle (swipes, tags appris) n&apos;est transmise à Google — seules des requêtes de recherche
          génériques par catégorie sont effectuées, indépendamment de tes données personnelles. L&apos;usage de
          l&apos;API YouTube est soumis aux{" "}
          <Link href="https://www.youtube.com/t/terms" target="_blank" rel="noopener noreferrer" className="underline">
            conditions d&apos;utilisation de YouTube
          </Link>{" "}
          et à la{" "}
          <Link href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="underline">
            politique de confidentialité de Google
          </Link>
          .
        </p>
      </LegalSection>

      <LegalSection title="Transferts hors Union européenne">
        <p>
          Certains de nos prestataires (Vercel, Supabase, Stripe, Google/YouTube) sont susceptibles de traiter des
          données en dehors de l&apos;Union européenne, notamment aux États-Unis. Ces transferts sont encadrés par
          les clauses contractuelles types de la Commission européenne ou un mécanisme équivalent.
        </p>
      </LegalSection>

      <LegalSection title="Durée de conservation">
        <p>
          Les données sont conservées pendant toute la durée d&apos;utilisation du compte, puis supprimées dans un
          délai raisonnable après suppression du compte.
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
          NextWatch utilise uniquement des cookies strictement nécessaires au fonctionnement du service (maintien de
          la session de connexion via Supabase Auth). Aucun cookie publicitaire ou de mesure d&apos;audience tiers
          n&apos;est utilisé à ce jour.
        </p>
      </LegalSection>
    </LegalLayout>
  );
}
