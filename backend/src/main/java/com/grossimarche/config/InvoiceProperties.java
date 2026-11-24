package com.grossimarche.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.bind.DefaultValue;

import java.math.BigDecimal;

/**
 * Who issues the invoices, and the legal identifiers printed on them.
 *
 * The seller block defaults to the details the storefront already shows (contact page, footer,
 * its own PDF), so the server's invoice and the website's agree out of the box.
 *
 * The legal identifiers (ICE, RC, IF, patente) are empty by default and printed only when set.
 * The invoice used to print "ICE 000000000000000 - RC 00000": a made-up number on an invoice is
 * worse than none, since it reads as the real one.
 *
 * {@code vatRate} is the TVA percentage the totals are broken down with (amounts are stored
 * TTC); 0 prints the total without a breakdown. Which rate applies is the accountant's call -
 * many basic foodstuffs are taxed at 7 or 10 %, or exempt, not 20 %.
 */
@ConfigurationProperties(prefix = "grossimarche.invoice")
public record InvoiceProperties(
        @DefaultValue("Market Food") String sellerName,
        @DefaultValue("Marché de gros en ligne") String tagline,
        @DefaultValue("EL Alia N 141, Mohammedia, Maroc") String address,
        @DefaultValue("+212 605 477 544") String phone,
        @DefaultValue("marketfood98@gmail.com") String email,
        @DefaultValue("") String ice,
        @DefaultValue("") String rc,
        @DefaultValue("") String fiscalId,
        @DefaultValue("") String patente,
        @DefaultValue("20") BigDecimal vatRate
) {
}
