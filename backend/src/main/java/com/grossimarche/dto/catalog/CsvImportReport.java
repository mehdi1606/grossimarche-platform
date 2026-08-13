package com.grossimarche.dto.catalog;

import java.util.List;

/** Result of a bulk product CSV import: how many rows were committed, or the row errors. */
public record CsvImportReport(
        boolean success,
        int imported,
        List<RowError> errors
) {

    public record RowError(int row, String message) {
    }
}
