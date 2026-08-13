package com.grossimarche.integration.pdf;

import com.grossimarche.entity.Order;
import com.grossimarche.entity.OrderItem;

import java.util.List;

/** Renders an order invoice as a PDF byte array. */
public interface InvoiceGenerator {

    byte[] generate(Order order, List<OrderItem> items);
}
