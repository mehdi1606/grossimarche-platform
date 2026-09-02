package com.grossimarche.dto.dashboard;

/**
 * One bar or slice: a label and how many things carry it. Shared by the dashboard breakdowns
 * (orders per city, customers per trade) rather than a DTO per chart — the shape is the same
 * and the charts only differ in how they draw it.
 */
public record LabelCountResponse(String label, long count) {
}
