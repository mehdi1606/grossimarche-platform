package com.grossimarche.integration.pdf;

import com.grossimarche.entity.Order;
import com.grossimarche.entity.OrderItem;
import com.grossimarche.exception.BusinessException;
import com.grossimarche.exception.ErrorCode;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.pdmodel.font.Standard14Fonts;
import org.springframework.stereotype.Component;

import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.List;

/**
 * PDF invoice via Apache PDFBox: store legal details, order header, line items, and the
 * VAT breakdown (Moroccan TVA 20%). All amounts are read from the order's stored snapshots.
 */
@Component
public class PdfBoxInvoiceGenerator implements InvoiceGenerator {

    private static final DateTimeFormatter DATE =
            DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm").withZone(ZoneId.of("Africa/Casablanca"));
    private static final BigDecimal VAT_DIVISOR = new BigDecimal("1.20");

    @Override
    public byte[] generate(Order order, List<OrderItem> items) {
        try (PDDocument doc = new PDDocument(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            PDPage page = new PDPage(PDRectangle.A4);
            doc.addPage(page);

            PDType1Font bold = new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD);
            PDType1Font regular = new PDType1Font(Standard14Fonts.FontName.HELVETICA);

            try (PDPageContentStream cs = new PDPageContentStream(doc, page)) {
                float y = 800;
                y = line(cs, bold, 16, 50, y, "GROSSIMARCHÉ");
                y = line(cs, regular, 9, 50, y, "Vente en gros - Cash & Carry");
                y = line(cs, regular, 9, 50, y, "ICE 000000000000000 · RC 00000 · Casablanca, Maroc");
                y -= 10;
                y = line(cs, bold, 13, 50, y, "FACTURE " + order.getOrderNumber());
                y = line(cs, regular, 10, 50, y, "Date : " + DATE.format(order.getCreatedAt()));
                y = line(cs, regular, 10, 50, y, "Statut paiement : " + order.getPaymentStatus());
                y -= 8;

                y = line(cs, bold, 10, 50, y, String.format("%-40s %6s %12s %12s",
                        "Article", "Qté", "P.U.", "Total"));
                for (OrderItem item : items) {
                    String name = truncate(item.getProductNameSnapshot(), 40);
                    y = line(cs, regular, 10, 50, y, String.format("%-40s %6d %12s %12s",
                            name, item.getQuantity(), item.getUnitPrice().toPlainString(),
                            item.getLineTotal().toPlainString()));
                    if (y < 120) {
                        break; // single-page invoice for the scope of this build
                    }
                }
                y -= 10;

                BigDecimal ttc = order.getTotal();
                BigDecimal ht = ttc.divide(VAT_DIVISOR, 2, RoundingMode.HALF_UP);
                BigDecimal tva = ttc.subtract(ht);
                y = line(cs, regular, 10, 350, y, "Sous-total : " + order.getSubtotal().toPlainString() + " DH");
                y = line(cs, regular, 10, 350, y, "Remise : -" + order.getDiscountTotal().toPlainString() + " DH");
                y = line(cs, regular, 10, 350, y, "Livraison : " + order.getDeliveryFee().toPlainString() + " DH");
                y = line(cs, regular, 10, 350, y, "Total HT : " + ht.toPlainString() + " DH");
                y = line(cs, regular, 10, 350, y, "TVA 20% : " + tva.toPlainString() + " DH");
                line(cs, bold, 12, 350, y, "TOTAL TTC : " + ttc.toPlainString() + " DH");
            }

            doc.save(out);
            return out.toByteArray();
        } catch (Exception e) {
            throw new BusinessException(ErrorCode.INTERNAL_ERROR, "Échec de génération de la facture.");
        }
    }

    private float line(PDPageContentStream cs, PDType1Font font, float size, float x, float y, String text)
            throws java.io.IOException {
        cs.beginText();
        cs.setFont(font, size);
        cs.newLineAtOffset(x, y);
        cs.showText(sanitize(text));
        cs.endText();
        return y - (size + 6);
    }

    private String truncate(String s, int max) {
        if (s == null) {
            return "";
        }
        return s.length() <= max ? s : s.substring(0, max - 1) + "…";
    }

    /** PDFBox Standard14 fonts use WinAnsi; drop anything it cannot encode. */
    private String sanitize(String s) {
        return s.replace("…", "...").replaceAll("[^\\x20-\\xFF]", "?");
    }
}
