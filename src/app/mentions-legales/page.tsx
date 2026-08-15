import type { Metadata } from "next";
import { LegalLayout, LegalSection } from "@/components/legal/legal-layout";

export const metadata: Metadata = { title: "Mentions légales — SoloJob" };

export default function MentionsLegalesPage() {
  return (
    <LegalLayout title="Mentions légales">
      <LegalSection title="Éditeur du site">
        <p>
          Le site SoloJob (accessible à l&apos;adresse solojob.vercel.app) est édité par [NOM DE L&apos;ÉDITEUR],
          [STATUT JURIDIQUE — ex. entrepreneur individuel], immatriculé sous le numéro SIRET [SIRET], dont le siège
          est situé [ADRESSE COMPLÈTE].
        </p>
        <p>Numéro de TVA intracommunautaire : [NUMÉRO DE TVA, ou &laquo; non applicable, art. 293B du CGI &raquo;]</p>
        <p>Contact : [EMAIL DE CONTACT]</p>
        <p>Directeur de la publication : [NOM DU DIRECTEUR DE PUBLICATION]</p>
      </LegalSection>

      <LegalSection title="Hébergement">
        <p>
          L&apos;application est hébergée par Vercel Inc., 340 S Lemon Ave #4133, Walnut, CA 91789, États-Unis
          (vercel.com).
        </p>
        <p>
          La base de données et le service d&apos;authentification sont hébergés par Supabase Inc.
          (supabase.com).
        </p>
      </LegalSection>

      <LegalSection title="Propriété intellectuelle">
        <p>
          L&apos;ensemble des éléments du site SoloJob (textes, logo, charte graphique, code source) est protégé par
          le droit de la propriété intellectuelle. Toute reproduction non autorisée est interdite.
        </p>
      </LegalSection>

      <LegalSection title="Responsabilité">
        <p>
          SoloJob est un outil de facturation mis à disposition des artisans et indépendants. L&apos;éditeur ne
          saurait être tenu responsable des informations saisies par les utilisateurs (devis, factures, données
          clients) ni de leur usage.
        </p>
      </LegalSection>

      <LegalSection title="Droit applicable">
        <p>Le présent site est soumis au droit français. En cas de litige, les tribunaux français sont compétents.</p>
      </LegalSection>
    </LegalLayout>
  );
}
