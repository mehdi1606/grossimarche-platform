import {
  Document,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";
import dayjs from "dayjs";

import { statusLabel } from "@utils/orderStatus";

// IMPORTANT: no remote fonts or images here. @react-pdf/renderer fetches any Font.register
// source and any <Image src> at render time; a slow/blocked CDN leaves PDFDownloadLink stuck
// on "Loading…" forever (this is what broke the download). Using the built-in Helvetica font
// and a text wordmark makes generation fully local and reliable.
const styles = StyleSheet.create({
  page: {
    paddingTop: 30,
    paddingHorizontal: 24,
    paddingBottom: 40,
    fontSize: 10,
    color: "#4b5563",
    lineHeight: 1.5,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderColor: "#f3f4f6",
  },
  brand: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#059669",
  },
  brandSub: { fontSize: 9, color: "#6b7280", marginTop: 2 },
  h1: { fontSize: 14, fontWeight: "bold", color: "#111827" },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 20,
    paddingBottom: 14,
  },
  label: {
    fontSize: 8,
    fontWeight: "bold",
    color: "#6b7280",
    textTransform: "uppercase",
    marginBottom: 3,
  },
  info: { fontSize: 9, color: "#6b7280" },
  right: { textAlign: "right" },
  table: {
    borderWidth: 0.5,
    borderColor: "#e5e7eb",
    borderRadius: 6,
    marginTop: 4,
  },
  tHead: {
    flexDirection: "row",
    backgroundColor: "#f9fafb",
    paddingVertical: 5,
    borderBottomWidth: 0.5,
    borderColor: "#e5e7eb",
  },
  tRow: {
    flexDirection: "row",
    paddingVertical: 5,
    borderBottomWidth: 0.5,
    borderColor: "#f3f4f6",
  },
  th: {
    fontSize: 8,
    fontWeight: "bold",
    color: "#6b7280",
    textTransform: "uppercase",
    paddingHorizontal: 8,
  },
  td: { fontSize: 9, color: "#374151", paddingHorizontal: 8 },
  colSr: { width: "8%" },
  colName: { width: "44%" },
  colQty: { width: "14%", textAlign: "center" },
  colPrice: { width: "17%", textAlign: "right" },
  colAmount: { width: "17%", textAlign: "right" },
  amount: { color: "#ef4444" },
  totals: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#f4f5f7",
    borderRadius: 8,
    padding: 14,
    marginTop: 16,
  },
  totalValue: { fontSize: 12, fontWeight: "bold", color: "#ef4444", marginTop: 2 },
  thanks: {
    textAlign: "center",
    fontSize: 11,
    color: "#374151",
    paddingTop: 40,
  },
});

const InvoiceForDownload = ({ data, currency, getNumberTwo }) => {
  const money = (v) => `${currency}${getNumberTwo(Number(v || 0))}`;
  const name = data?.user_info?.name || "Client";

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.h1}>FACTURE</Text>
            <Text style={styles.info}>Statut : {statusLabel(data?.status)}</Text>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={styles.brand}>Grossimarché</Text>
            <Text style={styles.brandSub}>Marché de gros en ligne - Maroc</Text>
          </View>
        </View>

        {/* Meta */}
        <View style={styles.metaRow}>
          <View>
            <Text style={styles.label}>Date</Text>
            <Text style={styles.info}>
              {dayjs(data?.createdAt).format("D MMMM YYYY")}
            </Text>
          </View>
          <View>
            <Text style={styles.label}>N° de facture</Text>
            <Text style={styles.info}>#{data?.invoice}</Text>
          </View>
          <View style={{ maxWidth: "40%" }}>
            <Text style={[styles.label, styles.right]}>Facturer à</Text>
            <Text style={[styles.info, styles.right]}>{name}</Text>
            <Text style={[styles.info, styles.right]}>
              {data?.user_info?.address}
            </Text>
            <Text style={[styles.info, styles.right]}>
              {[data?.user_info?.city, data?.user_info?.country]
                .filter(Boolean)
                .join(", ")}
            </Text>
          </View>
        </View>

        {/* Items */}
        <View style={styles.table}>
          <View style={styles.tHead}>
            <Text style={[styles.th, styles.colSr]}>#</Text>
            <Text style={[styles.th, styles.colName]}>Produit</Text>
            <Text style={[styles.th, styles.colQty]}>Qté</Text>
            <Text style={[styles.th, styles.colPrice]}>Prix</Text>
            <Text style={[styles.th, styles.colAmount]}>Montant</Text>
          </View>
          {data?.cart?.map((item, i) => (
            <View key={i} style={styles.tRow}>
              <Text style={[styles.td, styles.colSr]}>{i + 1}</Text>
              <Text style={[styles.td, styles.colName]}>{item.title}</Text>
              <Text style={[styles.td, styles.colQty]}>{item.quantity}</Text>
              <Text style={[styles.td, styles.colPrice]}>{money(item.price)}</Text>
              <Text style={[styles.td, styles.colAmount, styles.amount]}>
                {money(item.itemTotal)}
              </Text>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={styles.totals}>
          <View>
            <Text style={styles.label}>Mode de paiement</Text>
            <Text style={styles.info}>
              {data?.paymentMethod === "Cash" ? "Paiement à la livraison" : data?.paymentMethod}
            </Text>
          </View>
          <View>
            <Text style={styles.label}>Livraison</Text>
            <Text style={styles.info}>
              {Number(data?.shippingCost) > 0 ? money(data?.shippingCost) : "Offerte"}
            </Text>
          </View>
          <View>
            <Text style={styles.label}>Remise</Text>
            <Text style={styles.info}>{money(data?.discount)}</Text>
          </View>
          <View>
            <Text style={styles.label}>Total</Text>
            <Text style={styles.totalValue}>{money(data?.total)}</Text>
          </View>
        </View>

        <Text style={styles.thanks}>
          Merci {name} - votre commande a bien été reçue !
        </Text>
      </Page>
    </Document>
  );
};

export default InvoiceForDownload;
