import {
  Document,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";
import dayjs from "dayjs";

import { statusLabel } from "@utils/orderStatus";
import { LOGO_PRIMARY_DATA_URI } from "@utils/brandLogo";

// IMPORTANT: nothing here is fetched. @react-pdf/renderer resolves any Font.register source
// and any <Image src> at render time; a slow or blocked one leaves PDFDownloadLink stuck on
// "Loading…" forever (this is what broke the download). The font is the built-in Helvetica and
// the logo is a data URI (see @utils/brandLogo), so generation stays fully local.

/** Who issues the invoice. Change it here and on the back-office copy of this file. */
const SELLER = {
  name: "Market Food",
  tagline: "Marché de gros en ligne",
  address: "EL Alia N 141, Mohammedia",
  phone: "+212 605 477 544",
  email: "Marketfood26@gmail.com",
};

const INK = "#111827";
const MUTED = "#6b7280";
const LINE = "#e5e7eb";
const BRAND = "#1a6a45";

const styles = StyleSheet.create({
  page: {
    paddingTop: 36,
    paddingHorizontal: 40,
    paddingBottom: 64,
    fontSize: 9,
    color: "#374151",
    lineHeight: 1.5,
  },

  /* A letterhead rule, repeated on every page. */
  topBar: { position: "absolute", top: 0, left: 0, right: 0, height: 4, backgroundColor: BRAND },

  /* Header: who issues it on the left, what it is on the right. */
  header: { flexDirection: "row", justifyContent: "space-between", marginTop: 10 },
  logo: { width: 86, marginBottom: 6 },
  seller: { fontSize: 9, color: MUTED },
  sellerName: { fontSize: 10, color: INK, marginBottom: 2 },
  title: {
    fontSize: 18,
    color: INK,
    letterSpacing: 2,
    textAlign: "right",
    marginBottom: 8,
  },
  metaLine: { flexDirection: "row", justifyContent: "flex-end", marginBottom: 2 },
  metaLabel: { fontSize: 8, color: MUTED, textTransform: "uppercase", marginRight: 8 },
  metaValue: { fontSize: 9, color: INK, minWidth: 96, textAlign: "right" },
  statusWrap: { flexDirection: "row", justifyContent: "flex-end", marginTop: 8 },
  statusPill: {
    fontSize: 8,
    color: BRAND,
    borderWidth: 0.8,
    borderColor: BRAND,
    borderRadius: 9,
    paddingVertical: 3,
    paddingHorizontal: 10,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },

  rule: { borderBottomWidth: 1, borderColor: LINE, marginTop: 18, marginBottom: 16 },

  /* Bill to */
  blockLabel: {
    fontSize: 8,
    color: MUTED,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 4,
  },
  customer: { fontSize: 10, color: INK },

  /* Items */
  table: { marginTop: 22 },
  tHead: {
    flexDirection: "row",
    backgroundColor: "#f9fafb",
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: LINE,
    paddingVertical: 7,
    paddingHorizontal: 6,
  },
  tRow: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderColor: "#f3f4f6",
    paddingVertical: 8,
    paddingHorizontal: 6,
  },
  tRowAlt: { backgroundColor: "#fcfcfd" },
  th: { fontSize: 8, color: MUTED, textTransform: "uppercase", letterSpacing: 0.5 },
  td: { fontSize: 9, color: "#374151" },
  colNum: { width: "6%" },
  colName: { width: "48%", paddingRight: 8 },
  colQty: { width: "12%", textAlign: "right" },
  colPrice: { width: "17%", textAlign: "right" },
  colAmount: { width: "17%", textAlign: "right", color: INK },

  /* Totals: a right-hand stack, the way an invoice is read. */
  totals: { marginTop: 18, flexDirection: "row", justifyContent: "flex-end" },
  totalsBox: { width: "48%" },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 3,
    paddingHorizontal: 8,
  },
  totalLabel: { fontSize: 9, color: MUTED },
  totalValue: { fontSize: 9, color: "#374151" },
  grandRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#f9fafb",
    borderTopWidth: 1,
    borderColor: LINE,
    marginTop: 6,
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  grandLabel: { fontSize: 10, color: INK, textTransform: "uppercase", letterSpacing: 1 },
  grandValue: { fontSize: 13, color: BRAND },

  payment: {
    marginTop: 26,
    flexDirection: "row",
    borderTopWidth: 0.5,
    borderColor: LINE,
    paddingTop: 12,
  },
  thanks: { marginTop: 28, fontSize: 9, color: MUTED },

  /* Page footer, repeated on every page. */
  footer: {
    position: "absolute",
    bottom: 28,
    left: 40,
    right: 40,
    borderTopWidth: 1,
    borderColor: LINE,
    paddingTop: 8,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  footerText: { fontSize: 7.5, color: "#9ca3af" },
});

const InvoiceForDownload = ({ data, currency, getNumberTwo, globalSetting }) => {
  const money = (v) => `${currency}${getNumberTwo(Number(v || 0))}`;
  const name = data?.user_info?.name || "Client";
  const seller = {
    ...SELLER,
    address: globalSetting?.address || SELLER.address,
    phone: globalSetting?.contact || SELLER.phone,
    email: globalSetting?.email || SELLER.email,
  };
  const city = [data?.user_info?.city, data?.user_info?.country]
    .filter(Boolean)
    .join(", ");

  const meta = [
    ["N° de facture", `#${data?.invoice || "-"}`],
    ["Date", dayjs(data?.createdAt).format("DD/MM/YYYY")],
  ];
  const status = statusLabel(data?.status);

  return (
    <Document
      title={`Facture ${data?.invoice || ""}`}
      author={SELLER.name}
      creator={SELLER.name}
    >
      <Page size="A4" style={styles.page}>
        <View style={styles.topBar} fixed />

        <View style={styles.header}>
          <View>
            <Image src={LOGO_PRIMARY_DATA_URI} style={styles.logo} />
            <Text style={styles.sellerName}>{seller.name}</Text>
            <Text style={styles.seller}>{seller.tagline}</Text>
            <Text style={styles.seller}>{seller.address}</Text>
            <Text style={styles.seller}>{seller.phone}</Text>
            <Text style={styles.seller}>{seller.email}</Text>
          </View>

          <View>
            <Text style={styles.title}>FACTURE</Text>
            {meta.map(([label, value]) => (
              <View key={label} style={styles.metaLine}>
                <Text style={styles.metaLabel}>{label}</Text>
                <Text style={styles.metaValue}>{value}</Text>
              </View>
            ))}
            <View style={styles.statusWrap}>
              <Text style={styles.statusPill}>{status}</Text>
            </View>
          </View>
        </View>

        <View style={styles.rule} />

        <View>
          <Text style={styles.blockLabel}>Facturé à</Text>
          <Text style={styles.customer}>{name}</Text>
          {data?.user_info?.contact ? (
            <Text style={styles.seller}>{data.user_info.contact}</Text>
          ) : null}
          {data?.user_info?.address ? (
            <Text style={styles.seller}>{data.user_info.address}</Text>
          ) : null}
          {city ? <Text style={styles.seller}>{city}</Text> : null}
        </View>

        <View style={styles.table}>
          {/* `fixed` so the header repeats when a long order runs onto a second page. */}
          <View style={styles.tHead} fixed>
            <Text style={[styles.th, styles.colNum]}>#</Text>
            <Text style={[styles.th, styles.colName]}>Produit</Text>
            <Text style={[styles.th, styles.colQty]}>Qté</Text>
            <Text style={[styles.th, styles.colPrice]}>Prix unitaire</Text>
            <Text style={[styles.th, styles.colAmount]}>Montant</Text>
          </View>

          {data?.cart?.map((item, i) => (
            <View
              key={i}
              style={[styles.tRow, i % 2 === 1 && styles.tRowAlt]}
              wrap={false}
            >
              <Text style={[styles.td, styles.colNum]}>{i + 1}</Text>
              <Text style={[styles.td, styles.colName]}>{item.title}</Text>
              <Text style={[styles.td, styles.colQty]}>{item.quantity}</Text>
              <Text style={[styles.td, styles.colPrice]}>{money(item.price)}</Text>
              <Text style={[styles.td, styles.colAmount]}>{money(item.itemTotal)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.totals}>
          <View style={styles.totalsBox}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Sous-total</Text>
              <Text style={styles.totalValue}>{money(data?.subTotal)}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Livraison</Text>
              <Text style={styles.totalValue}>
                {Number(data?.shippingCost) > 0 ? money(data?.shippingCost) : "Offerte"}
              </Text>
            </View>
            {Number(data?.discount) > 0 && (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Remise</Text>
                <Text style={styles.totalValue}>- {money(data?.discount)}</Text>
              </View>
            )}
            <View style={styles.grandRow}>
              <Text style={styles.grandLabel}>Total</Text>
              <Text style={styles.grandValue}>{money(data?.total)}</Text>
            </View>
          </View>
        </View>

        <View style={styles.payment}>
          <Text style={styles.blockLabel}>Mode de paiement</Text>
          <Text style={[styles.customer, { marginLeft: 10 }]}>
            {data?.paymentMethod === "Cash"
              ? "Paiement à la livraison"
              : data?.paymentMethod}
          </Text>
        </View>

        <Text style={styles.thanks}>
          Merci {name}, votre commande a bien été reçue.
        </Text>

        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>
            {seller.name} · {seller.address} · {seller.phone} · {seller.email}
          </Text>
          <Text
            style={styles.footerText}
            render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
          />
        </View>
      </Page>
    </Document>
  );
};

export default InvoiceForDownload;
