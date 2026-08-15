import type { Metadata } from "next";
import { LegalLayout, LegalSection } from "@/components/legal/legal-layout";

export const metadata: Metadata = { title: "Conditions générales d'utilisation — SoloJob" };

export default function CguPage() {
  return (
    <LegalLayout title="Conditions générales d'utilisation">
      <LegalSection title="1. Objet">
        <p>
          Les présentes conditions générales d&apos;utilisation (CGU) régissent l&apos;accès et l&apos;utilisation
          du service SoloJob, un outil en ligne de création de devis, de facturation et de relance de paiement
          destiné aux artisans et indépendants solos, édité par [NOM DE L&apos;ÉDITEUR].
        </p>
      </LegalSection>

      <LegalSection title="2. Accès au service">
        <p>
          L&apos;accès à SoloJob nécessite la création d&apos;un compte avec une adresse e-mail valide. L&apos;usage
          du service est réservé aux professionnels (artisans, indépendants, micro-entrepreneurs).
        </p>
      </LegalSection>

      <LegalSection title="3. Compte utilisateur">
        <p>
          L&apos;utilisateur est seul responsable de la confidentialité de ses identifiants de connexion et de
          l&apos;exactitude des informations qu&apos;il renseigne (informations d&apos;entreprise, mentions légales
          de facturation, données clients).
        </p>
      </LegalSection>

      <LegalSection title="4. Forfaits et tarifs">
        <p>
          SoloJob propose un forfait gratuit limité et des forfaits payants dont le détail et les tarifs sont
          affichés sur la page tarifs du site. Les paiements d&apos;abonnement sont traités par Stripe. L&apos;
          utilisateur peut résilier son abonnement à tout moment depuis son espace de gestion.
        </p>
      </LegalSection>

      <LegalSection title="5. Encaissement des factures">
        <p>
          SoloJob permet à l&apos;utilisateur de générer des liens de paiement vers des services tiers qu&apos;il
          contrôle lui-même (par exemple PayPal.me). SoloJob n&apos;encaisse, ne détient et ne reverse à aucun
          moment les sommes payées par les clients de l&apos;utilisateur.
        </p>
      </LegalSection>

      <LegalSection title="6. Obligations de l'utilisateur">
        <p>
          L&apos;utilisateur s&apos;engage à utiliser le service conformément à la loi, à ne pas l&apos;employer à
          des fins frauduleuses, et à respecter les droits des tiers (notamment les données personnelles de ses
          propres clients qu&apos;il saisit dans l&apos;application).
        </p>
      </LegalSection>

      <LegalSection title="7. Responsabilité">
        <p>
          SoloJob est un outil d&apos;aide à la gestion administrative. L&apos;utilisateur reste seul responsable de
          la conformité fiscale et légale des documents (devis, factures) qu&apos;il émet via le service.
        </p>
      </LegalSection>

      <LegalSection title="8. Résiliation">
        <p>
          L&apos;utilisateur peut supprimer son compte à tout moment. L&apos;éditeur se réserve le droit de suspendre
          un compte en cas d&apos;usage abusif ou frauduleux du service.
        </p>
      </LegalSection>

      <LegalSection title="9. Modification des CGU">
        <p>
          L&apos;éditeur peut modifier les présentes CGU à tout moment. Les utilisateurs seront informés de tout
          changement substantiel.
        </p>
      </LegalSection>

      <LegalSection title="10. Droit applicable et contact">
        <p>Les présentes CGU sont soumises au droit français. Pour toute question : [EMAIL DE CONTACT].</p>
      </LegalSection>
    </LegalLayout>
  );
}
