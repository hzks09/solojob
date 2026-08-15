import type { Metadata } from "next";
import Link from "next/link";
import { LegalLayout, LegalSection } from "@/components/legal/legal-layout";

export const metadata: Metadata = { title: "Mentions légales — NextWatch" };

export default function MentionsLegalesPage() {
  return (
    <LegalLayout title="Mentions légales">
      <LegalSection title="Éditeur du site">
        <p>
          Le site NextWatch (accessible à l&apos;adresse solojob.vercel.app) est édité par [NOM DE L&apos;ÉDITEUR],
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
        <p>La base de données et le service d&apos;authentification sont hébergés par Supabase Inc. (supabase.com).</p>
      </LegalSection>

      <LegalSection title="Propriété intellectuelle">
        <p>
          L&apos;ensemble des éléments du site NextWatch (textes, logo, charte graphique, code source) est protégé
          par le droit de la propriété intellectuelle. Toute reproduction non autorisée est interdite.
        </p>
        <p>
          Les vidéos proposées appartiennent à leurs créateurs respectifs et restent hébergées sur YouTube — NextWatch
          n&apos;héberge, ne stocke ni ne reproduit aucun contenu vidéo, il ne fait qu&apos;aider à en découvrir.
        </p>
      </LegalSection>

      <LegalSection title="Service tiers — YouTube">
        <p>
          NextWatch utilise l&apos;API YouTube Data pour recommander des vidéos hébergées sur YouTube. L&apos;usage
          de ce service est soumis aux{" "}
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

      <LegalSection title="Responsabilité">
        <p>
          NextWatch est un outil de découverte de vidéos. L&apos;éditeur ne saurait être tenu responsable du contenu
          des vidéos recommandées, celui-ci relevant de la seule responsabilité de leurs créateurs et de YouTube.
        </p>
      </LegalSection>

      <LegalSection title="Droit applicable">
        <p>Le présent site est soumis au droit français. En cas de litige, les tribunaux français sont compétents.</p>
      </LegalSection>
    </LegalLayout>
  );
}
