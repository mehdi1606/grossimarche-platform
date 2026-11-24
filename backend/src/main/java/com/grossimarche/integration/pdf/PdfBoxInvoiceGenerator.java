package com.grossimarche.integration.pdf;

import com.grossimarche.config.InvoiceProperties;
import com.grossimarche.entity.Order;
import com.grossimarche.entity.OrderItem;
import com.grossimarche.entity.User;
import com.grossimarche.exception.BusinessException;
import com.grossimarche.exception.ErrorCode;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.pdmodel.font.Standard14Fonts;
import org.apache.pdfbox.pdmodel.graphics.image.PDImageXObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.text.DecimalFormat;
import java.text.DecimalFormatSymbols;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

/**
 * The PDF invoice, in Market Food's colours - the same document the website downloads and the
 * app opens.
 *
 * Built with PDFBox and its standard Helvetica: nothing is fetched or embedded beyond the logo,
 * so generation cannot stall on a font download. Helvetica covers French accents; a character
 * it cannot draw (Arabic in a product name, an emoji in a note) becomes "?" rather than
 * failing the whole invoice.
 *
 * Every amount is read from the order's stored snapshots, never recomputed from today's prices:
 * an invoice states what was agreed. Long orders flow onto further pages, the table header
 * repeated, each page numbered.
 */
@Component
public class PdfBoxInvoiceGenerator implements InvoiceGenerator {

    private static final Logger log = LoggerFactory.getLogger(PdfBoxInvoiceGenerator.class);

    private static final DateTimeFormatter DATE =
            DateTimeFormatter.ofPattern("dd/MM/yyyy 'à' HH:mm").withZone(ZoneId.of("Africa/Casablanca"));

    // The storefront's palette (tailwind.config.js).
    private static final Color FOREST = new Color(0x2F, 0x5B, 0x43);
    private static final Color FOREST_LIGHT = new Color(0xE1, 0xED, 0xE4);
    private static final Color BRASS = new Color(0xAC, 0x85, 0x3B);
    private static final Color SAND = new Color(0xF4, 0xF1, 0xEA);
    private static final Color LINE = new Color(0xE8, 0xE3, 0xD8);
    private static final Color INK = new Color(0x15, 0x15, 0x0F);
    private static final Color MUTED = new Color(0x6B, 0x6B, 0x63);

    private static final float PAGE_W = PDRectangle.A4.getWidth();
    private static final float PAGE_H = PDRectangle.A4.getHeight();
    private static final float LEFT = 40;
    private static final float RIGHT = PAGE_W - 40;
    private static final float BOTTOM = 70; // above the footer

    // Item table columns: x of the left edge (#, name) or right edge (numbers).
    private static final float COL_NUM = LEFT + 10;
    private static final float COL_NAME = LEFT + 34;
    private static final float NAME_WIDTH = 250;
    private static final float COL_QTY_R = LEFT + 360;
    private static final float COL_PRICE_R = LEFT + 440;
    private static final float COL_TOTAL_R = RIGHT - 10;

    private final InvoiceProperties seller;
    private final ObjectMapper objectMapper;
    private final byte[] logo;

    public PdfBoxInvoiceGenerator(InvoiceProperties seller, ObjectMapper objectMapper) {
        this.seller = seller;
        this.objectMapper = objectMapper;
        this.logo = readLogo();
    }

    @Override
    public byte[] generate(Order order, List<OrderItem> items) {
        try (PDDocument doc = new PDDocument(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            new Writer(doc, order, items).write();
            doc.save(out);
            return out.toByteArray();
        } catch (IOException | RuntimeException e) {
            log.error("Invoice generation failed for order {}", order.getOrderNumber(), e);
            throw new BusinessException(ErrorCode.INTERNAL_ERROR, "Échec de génération de la facture.");
        }
    }

    /** One invoice being drawn: the document, the current page and the pen position. */
    private final class Writer {

        private final PDDocument doc;
        private final Order order;
        private final List<OrderItem> items;
        private final PDType1Font regular = new PDType1Font(Standard14Fonts.FontName.HELVETICA);
        private final PDType1Font bold = new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD);
        private final List<PDPage> pages = new ArrayList<>();
        private PDPageContentStream cs;
        private float y;

        Writer(PDDocument doc, Order order, List<OrderItem> items) {
            this.doc = doc;
            this.order = order;
            this.items = items;
        }

        void write() throws IOException {
            newPage();
            header();
            customer();
            table();
            totals();
            closing();
            cs.close();
            footers();
        }

        // ---- Sections ----------------------------------------------------------------------

        private void header() throws IOException {
            float top = PAGE_H - 40;

            // Seller, on the left, under the logo.
            float sy = top;
            if (logo != null) {
                // The logo carries the name already; written again under it, it reads twice.
                PDImageXObject image = PDImageXObject.createFromByteArray(doc, logo, "logo");
                float w = 92;
                float h = w * image.getHeight() / image.getWidth();
                cs.drawImage(image, LEFT, top - h, w, h);
                sy = top - h - 16;
            } else {
                text(bold, 13, LEFT, sy - 10, seller.sellerName(), FOREST);
                sy -= 24;
            }
            text(regular, 8.5f, LEFT, sy, seller.tagline(), BRASS);
            sy -= 12;
            text(regular, 8.5f, LEFT, sy, seller.address(), MUTED);
            sy -= 11;
            text(regular, 8.5f, LEFT, sy, seller.phone() + "  ·  " + seller.email(), MUTED);
            String legal = legalLine();
            if (!legal.isEmpty()) {
                sy -= 11;
                text(regular, 8, LEFT, sy, legal, MUTED);
            }

            // The invoice's own facts, on the right.
            float ry = top - 22;
            textRight(bold, 26, RIGHT, ry, "FACTURE", FOREST);
            ry -= 26;
            ry = meta(ry, "N°", order.getOrderNumber());
            ry = meta(ry, "Date", DATE.format(order.getCreatedAt()));
            ry = meta(ry, "Paiement", paymentMethod());
            ry -= 4;
            pill(RIGHT, ry, paymentStatus());

            y = Math.min(sy, ry) - 26;
        }

        private float meta(float at, String label, String value) throws IOException {
            float valueWidth = width(bold, 9.5f, value);
            textRight(bold, 9.5f, RIGHT, at, value, INK);
            textRight(regular, 9.5f, RIGHT - valueWidth - 8, at, label, MUTED);
            return at - 15;
        }

        /** A rounded-looking status tag: forest text on pale green, right-aligned at [right]. */
        private void pill(float right, float baseline, String label) throws IOException {
            float w = width(bold, 8.5f, label) + 16;
            fill(FOREST_LIGHT, right - w, baseline - 5, w, 16);
            textRight(bold, 8.5f, right - 8, baseline, label, FOREST);
        }

        private void customer() throws IOException {
            User user = order.getUser();
            List<String> lines = new ArrayList<>();
            String business = blankToNull(user.getBusinessName());
            String name = blankToNull(user.getFullName());
            lines.add(business != null ? business : (name != null ? name : "Client"));
            if (business != null && name != null) {
                lines.add(name);
            }
            String contact = String.join("  ·  ", nonBlank(user.getPhone(), user.getEmail()));
            if (!contact.isEmpty()) {
                lines.add(contact);
            }
            lines.addAll(address());

            float height = 26 + lines.size() * 13;
            fill(SAND, LEFT, y - height, RIGHT - LEFT, height);
            fill(FOREST, LEFT, y - height, 3, height);
            float cy = y - 16;
            text(bold, 7.5f, LEFT + 14, cy, "FACTURÉ À", BRASS);
            cy -= 14;
            for (int i = 0; i < lines.size(); i++) {
                text(i == 0 ? bold : regular, i == 0 ? 10.5f : 9, LEFT + 14, cy, lines.get(i),
                        i == 0 ? INK : MUTED);
                cy -= 13;
            }
            y -= height + 24;
        }

        private void table() throws IOException {
            tableHeader();
            int n = 0;
            for (OrderItem item : items) {
                List<String> name = wrap(regular, 9.5f, safe(item.getProductNameSnapshot()), NAME_WIDTH);
                float rowHeight = 12 + name.size() * 12;
                if (y - rowHeight < BOTTOM + 20) {
                    newPage();
                    y = PAGE_H - 50;
                    tableHeader();
                }
                n++;
                if (n % 2 == 0) {
                    fill(SAND, LEFT, y - rowHeight, RIGHT - LEFT, rowHeight);
                }
                float baseline = y - 15;
                text(regular, 9, COL_NUM, baseline, String.valueOf(n), MUTED);
                float ny = baseline;
                for (String part : name) {
                    text(regular, 9.5f, COL_NAME, ny, part, INK);
                    ny -= 12;
                }
                String unit = blankToNull(item.getUnitSnapshot());
                textRight(regular, 9.5f, COL_QTY_R, baseline,
                        item.getQuantity() + (unit == null ? "" : " " + unit), INK);
                textRight(regular, 9.5f, COL_PRICE_R, baseline, money(item.getUnitPrice()), INK);
                textRight(bold, 9.5f, COL_TOTAL_R, baseline, money(item.getLineTotal()), INK);
                y -= rowHeight;
            }
            stroke(LINE, LEFT, y, RIGHT, y);
            y -= 20;
        }

        private void tableHeader() throws IOException {
            fill(FOREST, LEFT, y - 22, RIGHT - LEFT, 22);
            float b = y - 14.5f;
            text(bold, 8.5f, COL_NUM, b, "#", Color.WHITE);
            text(bold, 8.5f, COL_NAME, b, "PRODUIT", Color.WHITE);
            textRight(bold, 8.5f, COL_QTY_R, b, "QTÉ", Color.WHITE);
            textRight(bold, 8.5f, COL_PRICE_R, b, "PRIX UNITAIRE", Color.WHITE);
            textRight(bold, 8.5f, COL_TOTAL_R, b, "MONTANT", Color.WHITE);
            y -= 22;
        }

        private void totals() throws IOException {
            List<String[]> rows = new ArrayList<>();
            rows.add(new String[] {"Sous-total", money(order.getSubtotal())});
            if (positive(order.getDiscountTotal())) {
                rows.add(new String[] {"Remise paniers", "- " + money(order.getDiscountTotal())});
            }
            if (positive(order.getCouponDiscount())) {
                String code = blankToNull(order.getCouponCode());
                rows.add(new String[] {code == null ? "Code promo" : "Code promo " + code,
                        "- " + money(order.getCouponDiscount())});
            }
            rows.add(new String[] {"Livraison",
                    positive(order.getDeliveryFee()) ? money(order.getDeliveryFee()) : "Offerte"});

            BigDecimal ttc = order.getTotal();
            BigDecimal rate = seller.vatRate() == null ? BigDecimal.ZERO : seller.vatRate();
            boolean vat = rate.signum() > 0;
            if (vat) {
                BigDecimal ht = ttc.multiply(BigDecimal.valueOf(100))
                        .divide(BigDecimal.valueOf(100).add(rate), 2, RoundingMode.HALF_UP);
                rows.add(new String[] {"Total HT", money(ht)});
                rows.add(new String[] {"TVA " + rate.stripTrailingZeros().toPlainString() + " %",
                        money(ttc.subtract(ht))});
            }

            float needed = rows.size() * 17 + 44;
            if (y - needed < BOTTOM) {
                newPage();
                y = PAGE_H - 50;
            }
            float boxLeft = RIGHT - 230;
            for (String[] row : rows) {
                text(regular, 9.5f, boxLeft + 10, y - 12, row[0], MUTED);
                textRight(regular, 9.5f, RIGHT - 10, y - 12, row[1], INK);
                y -= 17;
            }
            y -= 6;
            fill(FOREST, boxLeft, y - 30, RIGHT - boxLeft, 30);
            text(bold, 11, boxLeft + 10, y - 19.5f, vat ? "TOTAL TTC" : "TOTAL", Color.WHITE);
            textRight(bold, 13, RIGHT - 10, y - 20, money(ttc), Color.WHITE);
            y -= 52;
        }

        private void closing() throws IOException {
            if (y < BOTTOM + 40) {
                newPage();
                y = PAGE_H - 50;
            }
            String note = blankToNull(order.getNote());
            if (note != null) {
                for (String part : wrap(regular, 9, "Note : " + safe(note), RIGHT - LEFT)) {
                    text(regular, 9, LEFT, y, part, MUTED);
                    y -= 12;
                }
                y -= 6;
            }
            text(bold, 10, LEFT, y, "Merci pour votre confiance.", FOREST);
            y -= 13;
            text(regular, 8.5f, LEFT, y,
                    "Pour toute question sur cette facture : " + seller.phone() + " - " + seller.email(),
                    MUTED);
        }

        /** Footer and page numbers, once the number of pages is known. */
        private void footers() throws IOException {
            int total = pages.size();
            for (int i = 0; i < total; i++) {
                try (PDPageContentStream f = new PDPageContentStream(doc, pages.get(i),
                        PDPageContentStream.AppendMode.APPEND, true, true)) {
                    PDPageContentStream saved = cs;
                    cs = f;
                    stroke(LINE, LEFT, 48, RIGHT, 48);
                    text(regular, 7.5f, LEFT, 34, seller.sellerName() + "  ·  " + seller.address()
                            + "  ·  " + seller.phone() + "  ·  " + seller.email(), MUTED);
                    textRight(regular, 7.5f, RIGHT, 34, (i + 1) + " / " + total, MUTED);
                    cs = saved;
                }
            }
        }

        // ---- Order facts in words --------------------------------------------------------------

        private String paymentMethod() {
            if (order.getPaymentMethod() == null) {
                return "-";
            }
            return switch (order.getPaymentMethod()) {
                case COD -> "À la livraison";
                case CARD -> "Carte bancaire";
            };
        }

        private String paymentStatus() {
            if (order.getPaymentStatus() == null) {
                return "-";
            }
            return switch (order.getPaymentStatus()) {
                case PENDING_ON_DELIVERY -> "À RÉGLER À LA LIVRAISON";
                case AWAITING_PAYMENT -> "EN ATTENTE DE PAIEMENT";
                case PAID -> "PAYÉE";
                case FAILED -> "PAIEMENT ÉCHOUÉ";
                case REFUNDED -> "REMBOURSÉE";
            };
        }

        private List<String> address() {
            List<String> lines = new ArrayList<>();
            try {
                JsonNode node = objectMapper.readTree(order.getAddressSnapshot());
                String line = text(node, "addressLine");
                String city = text(node, "city");
                if (line != null) {
                    lines.add(line);
                }
                if (city != null) {
                    lines.add(city);
                }
            } catch (RuntimeException e) {
                // A snapshot that cannot be read leaves the address out, not the invoice.
            }
            return lines;
        }

        private String text(JsonNode node, String field) {
            JsonNode value = node.get(field);
            return value == null || value.isNull() ? null : blankToNull(value.asString());
        }

        // ---- Drawing -------------------------------------------------------------------------

        private void newPage() throws IOException {
            if (cs != null) {
                cs.close();
            }
            PDPage page = new PDPage(PDRectangle.A4);
            doc.addPage(page);
            pages.add(page);
            cs = new PDPageContentStream(doc, page);
            // The website header's green, as a thin band across the top of every page.
            fill(FOREST, 0, PAGE_H - 6, PAGE_W, 6);
        }

        private void text(PDType1Font font, float size, float x, float baseline, String value, Color colour)
                throws IOException {
            cs.beginText();
            cs.setFont(font, size);
            cs.setNonStrokingColor(colour);
            cs.newLineAtOffset(x, baseline);
            cs.showText(encodable(font, value));
            cs.endText();
        }

        private void textRight(PDType1Font font, float size, float right, float baseline, String value,
                               Color colour) throws IOException {
            text(font, size, right - width(font, size, value), baseline, value, colour);
        }

        private void fill(Color colour, float x, float y0, float w, float h) throws IOException {
            cs.setNonStrokingColor(colour);
            cs.addRect(x, y0, w, h);
            cs.fill();
        }

        private void stroke(Color colour, float x1, float y1, float x2, float y2) throws IOException {
            cs.setStrokingColor(colour);
            cs.setLineWidth(0.8f);
            cs.moveTo(x1, y1);
            cs.lineTo(x2, y2);
            cs.stroke();
        }

        private float width(PDType1Font font, float size, String value) throws IOException {
            return font.getStringWidth(encodable(font, value)) / 1000 * size;
        }

        /** Words into lines no wider than [max]; a single overlong word is cut. */
        private List<String> wrap(PDType1Font font, float size, String value, float max) throws IOException {
            List<String> lines = new ArrayList<>();
            StringBuilder current = new StringBuilder();
            for (String word : value.split("\\s+")) {
                String candidate = current.isEmpty() ? word : current + " " + word;
                if (width(font, size, candidate) <= max) {
                    current = new StringBuilder(candidate);
                    continue;
                }
                if (!current.isEmpty()) {
                    lines.add(current.toString());
                }
                String rest = word;
                while (width(font, size, rest) > max && rest.length() > 1) {
                    int cut = rest.length() - 1;
                    while (cut > 1 && width(font, size, rest.substring(0, cut)) > max) {
                        cut--;
                    }
                    lines.add(rest.substring(0, cut));
                    rest = rest.substring(cut);
                }
                current = new StringBuilder(rest);
            }
            if (!current.isEmpty() || lines.isEmpty()) {
                lines.add(current.toString());
            }
            return lines;
        }
    }

    // ---- Helpers -----------------------------------------------------------------------------

    /** 1 250,00 DH - the storefront's and the app's format. */
    private static String money(BigDecimal amount) {
        DecimalFormatSymbols symbols = new DecimalFormatSymbols(Locale.FRANCE);
        symbols.setGroupingSeparator(' ');
        symbols.setDecimalSeparator(',');
        DecimalFormat format = new DecimalFormat("#,##0.00", symbols);
        return format.format(amount == null ? BigDecimal.ZERO : amount) + " DH";
    }

    private static boolean positive(BigDecimal amount) {
        return amount != null && amount.signum() > 0;
    }

    private String legalLine() {
        List<String> parts = new ArrayList<>();
        if (blankToNull(seller.ice()) != null) {
            parts.add("ICE " + seller.ice().trim());
        }
        if (blankToNull(seller.rc()) != null) {
            parts.add("RC " + seller.rc().trim());
        }
        if (blankToNull(seller.fiscalId()) != null) {
            parts.add("IF " + seller.fiscalId().trim());
        }
        if (blankToNull(seller.patente()) != null) {
            parts.add("Patente " + seller.patente().trim());
        }
        return String.join("  ·  ", parts);
    }

    private static String blankToNull(String s) {
        return s == null || s.isBlank() ? null : s.trim();
    }

    private static List<String> nonBlank(String... values) {
        List<String> out = new ArrayList<>();
        for (String v : values) {
            if (blankToNull(v) != null) {
                out.add(v.trim());
            }
        }
        return out;
    }

    private static String safe(String s) {
        return s == null ? "" : s.replace("…", "...");
    }

    /** Helvetica draws WinAnsi only; anything else becomes "?" instead of failing the invoice. */
    private static String encodable(PDType1Font font, String value) {
        StringBuilder out = new StringBuilder(value.length());
        value.codePoints().forEach(cp -> {
            String ch = new String(Character.toChars(cp));
            try {
                font.encode(ch);
                out.append(ch);
            } catch (IllegalArgumentException | IOException e) {
                out.append('?');
            }
        });
        return out.toString();
    }

    private static byte[] readLogo() {
        try (InputStream in = new ClassPathResource("invoice/logo.png").getInputStream()) {
            return in.readAllBytes();
        } catch (IOException e) {
            log.warn("Invoice logo missing; invoices are drawn without it.");
            return null;
        }
    }
}
