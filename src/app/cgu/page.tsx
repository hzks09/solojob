import type { Metadata } from "next";
import Link from "next/link";
import { LegalLayout, LegalSection } from "@/components/legal/legal-layout";

export const metadata: Metadata = { title: "Conditions générales d'utilisation — NextWatch" };

export default function CguPage() {
  return (
    <LegalLayout title="Conditions générales d'utilisation">
      <LegalSection title="1. Objet">
        <p>
          Les présentes conditions générales d&apos;utilisation (CGU) régissent l&apos;accès et l&apos;utilisation du
          service NextWatch, un outil en ligne de découverte de vidéos YouTube par swipe, édité par [NOM DE
          L&apos;ÉDITEUR].
        </p>
      </LegalSection>

      <LegalSection title="2. Accès au service">
        <p>
          L&apos;accès à NextWatch nécessite la création d&apos;un compte avec une adresse e-mail valide. L&apos;
          utilisation du service implique l&apos;acceptation des{" "}
          <Link href="https://www.youtube.com/t/terms" target="_blank" rel="noopener noreferrer" className="underline">
            conditions d&apos;utilisation de YouTube
          </Link>
          , les vidéos recommandées restant hébergées et lues sur YouTube.
        </p>
      </LegalSection>

      <LegalSection title="3. Compte utilisateur">
        <p>
          L&apos;utilisateur est seul responsable de la confidentialité de ses identifiants de connexion et de
          l&apos;exactitude des informations qu&apos;il renseigne.
        </p>
      </LegalSection>

      <LegalSection title="4. Forfaits et tarifs">
        <p>
          NextWatch propose un forfait gratuit limité en nombre de découvertes par jour et un forfait payant illimité,
          dont le détail et les tarifs sont affichés sur la page tarifs du site. Les paiements d&apos;abonnement sont
          traités par Stripe. L&apos;utilisateur peut résilier son abonnement à tout moment depuis son espace de
          gestion.
        </p>
      </LegalSection>

      <LegalSection title="5. Contenu des vidéos">
        <p>
          NextWatch ne fait que recommander des vidéos publiées par des tiers sur YouTube — il n&apos;héberge, ne
          modifie ni ne contrôle leur contenu. L&apos;éditeur n&apos;est pas responsable du contenu des vidéos
          recommandées.
        </p>
      </LegalSection>

      <LegalSection title="6. Obligations de l'utilisateur">
        <p>
          L&apos;utilisateur s&apos;engage à utiliser le service conformément à la loi et à ne pas l&apos;employer à
          des fins frauduleuses (automatisation abusive, contournement des limites de forfait, etc.).
        </p>
      </LegalSection>

      <LegalSection title="7. Résiliation">
        <p>
          L&apos;utilisateur peut supprimer son compte à tout moment. L&apos;éditeur se réserve le droit de suspendre
          un compte en cas d&apos;usage abusif ou frauduleux du service.
        </p>
      </LegalSection>

      <LegalSection title="8. Modification des CGU">
        <p>
          L&apos;éditeur peut modifier les présentes CGU à tout moment. Les utilisateurs seront informés de tout
          changement substantiel.
        </p>
      </LegalSection>

      <LegalSection title="9. Droit applicable et contact">
        <p>Les présentes CGU sont soumises au droit français. Pour toute question : [EMAIL DE CONTACT].</p>
      </LegalSection>
    </LegalLayout>
  );
}
