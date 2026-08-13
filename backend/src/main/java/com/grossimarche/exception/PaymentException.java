package com.grossimarche.exception;

/** A payment could not be completed. Never carries card data in its message. */
public class PaymentException extends BusinessException {

    public PaymentException(String message) {
        super(ErrorCode.PAYMENT_FAILED, message);
    }
}
