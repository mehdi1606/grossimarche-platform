package com.grossimarche.exception;

/** A line cannot be fulfilled because available stock is below the requested quantity. */
public class InsufficientStockException extends BusinessException {

    public InsufficientStockException(String message) {
        super(ErrorCode.INSUFFICIENT_STOCK, message);
    }
}
