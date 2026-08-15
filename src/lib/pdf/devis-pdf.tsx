import { Document, Page, Text, View, Image, StyleSheet } from "@react-pdf/renderer";
import type { Client, Devis, DevisLigne, Profile } from "@/lib/db/schema";

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: "Helvetica", color: "#1c1a17" },
  header: { flexDirection: "row", justifyContent: "space-between", marginBottom: 30 },
  logo: { width: 60, height: 60, objectFit: "contain" },
  companyName: { fontSize: 14, fontWeight: 700, marginBottom: 4 },
  title: { fontSize: 20, fontWeight: 700, marginBottom: 2 },
  muted: { color: "#6b6459" },
  section: { marginBottom: 20 },
  row: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  table: { marginTop: 10, borderTop: "1 solid #e8e2d9" },
  tableRow: { flexDirection: "row", paddingVertical: 8, borderBottom: "1 solid #e8e2d9" },
  tableHeader: { flexDirection: "row", paddingVertical: 6, backgroundColor: "#f5f2ee", fontWeight: 700 },
  colDesc: { flex: 3 },
  colQty: { flex: 1, textAlign: "right" },
  colPrice: { flex: 1, textAlign: "right" },
  colTotal: { flex: 1, textAlign: "right" },
  totalRow: { flexDirection: "row", justifyContent: "flex-end", marginTop: 16, paddingTop: 10, borderTop: "2 solid #1c1a17" },
  totalLabel: { fontSize: 12, marginRight: 20 },
  totalValue: { fontSize: 14, fontWeight: 700 },
});

export function DevisPdf({
  devis,
  lignes,
  client,
  profile,
}: {
  devis: Devis;
  lignes: DevisLigne[];
  client: Client;
  profile: Profile | null;
}) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.companyName}>{profile?.companyName || profile?.fullName || "Indépendant"}</Text>
            {profile?.fullName && profile.companyName && <Text style={styles.muted}>{profile.fullName}</Text>}
            {profile?.adresse && <Text style={styles.muted}>{profile.adresse}</Text>}
            {(profile?.codePostal || profile?.ville) && (
              <Text style={styles.muted}>
                {[profile?.codePostal, profile?.ville].filter(Boolean).join(" ")}
              </Text>
            )}
            {profile?.siret && <Text style={styles.muted}>SIRET : {profile.siret}</Text>}
            <Text style={styles.muted}>
              {profile?.tvaApplicable && profile.numeroTva
                ? `TVA intracommunautaire : ${profile.numeroTva}`
                : "TVA non applicable, art. 293B du CGI"}
            </Text>
          </View>
          {/* eslint-disable-next-line jsx-a11y/alt-text -- composant @react-pdf/renderer, pas une <img> HTML */}
          {profile?.logoUrl && <Image src={profile.logoUrl} style={styles.logo} />}
        </View>

        <View style={styles.section}>
          <Text style={styles.title}>Devis {devis.numero}</Text>
        </View>

        <View style={styles.section}>
          <Text style={{ fontWeight: 700, marginBottom: 4 }}>Pour</Text>
          <Text>{client.nom}</Text>
          {client.adresse && <Text style={styles.muted}>{client.adresse}</Text>}
          {client.email && <Text style={styles.muted}>{client.email}</Text>}
        </View>

        <View style={styles.row}>
          <Text style={styles.muted}>Valable jusqu&apos;au</Text>
          <Text>{devis.dateValidite ?? "—"}</Text>
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.colDesc}>Description</Text>
            <Text style={styles.colQty}>Qté</Text>
            <Text style={styles.colPrice}>Prix unit.</Text>
            <Text style={styles.colTotal}>Total</Text>
          </View>
          {lignes.map((l) => (
            <View key={l.id} style={styles.tableRow}>
              <Text style={styles.colDesc}>{l.description}</Text>
              <Text style={styles.colQty}>{l.quantite}</Text>
              <Text style={styles.colPrice}>{Number(l.prixUnitaire).toFixed(2)} €</Text>
              <Text style={styles.colTotal}>{(Number(l.quantite) * Number(l.prixUnitaire)).toFixed(2)} €</Text>
            </View>
          ))}
        </View>

        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total du devis</Text>
          <Text style={styles.totalValue}>{Number(devis.montantTotal).toFixed(2)} €</Text>
        </View>
      </Page>
    </Document>
  );
}
