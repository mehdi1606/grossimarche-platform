package com.grossimarche.exception;

import org.springframework.http.HttpStatus;

/**
 * The single catalogue of business error codes. Every thrown {@link BusinessException}
 * references one of these — never an ad-hoc string at the throw site. Each code carries
 * its HTTP status and a default French message shown to the end user.
 */
public enum ErrorCode {

    OTP_INVALID(HttpStatus.UNPROCESSABLE_ENTITY, "Le code saisi est incorrect."),
    OTP_EXPIRED(HttpStatus.GONE, "Le code a expiré. Veuillez en demander un nouveau."),
    OTP_RATE_LIMITED(HttpStatus.TOO_MANY_REQUESTS, "Trop de tentatives. Veuillez réessayer plus tard."),
    TOKEN_INVALID(HttpStatus.UNAUTHORIZED, "Authentification requise ou jeton invalide."),
    FORBIDDEN(HttpStatus.FORBIDDEN, "Vous n'êtes pas autorisé à effectuer cette action."),
    RESOURCE_NOT_FOUND(HttpStatus.NOT_FOUND, "Ressource introuvable."),
    INSUFFICIENT_STOCK(HttpStatus.CONFLICT, "Stock insuffisant pour un ou plusieurs articles."),
    PRICE_CHANGED(HttpStatus.CONFLICT, "Le prix d'un ou plusieurs articles a changé."),
    CART_EMPTY(HttpStatus.UNPROCESSABLE_ENTITY, "Votre panier est vide."),
    DUPLICATE_REQUEST(HttpStatus.CONFLICT, "Cette requête a déjà été traitée."),
    PAYMENT_FAILED(HttpStatus.PAYMENT_REQUIRED, "Le paiement a échoué."),
    COUPON_INVALID(HttpStatus.UNPROCESSABLE_ENTITY, "Code promo invalide."),
    COUPON_EXPIRED(HttpStatus.GONE, "Ce code promo a expiré."),
    COUPON_NOT_APPLICABLE(HttpStatus.UNPROCESSABLE_ENTITY, "Ce code promo ne s'applique pas à votre panier."),
    COUPON_USAGE_EXCEEDED(HttpStatus.CONFLICT, "Ce code promo a atteint sa limite d'utilisation."),
    VALIDATION_FAILED(HttpStatus.UNPROCESSABLE_ENTITY, "La requête contient des champs invalides."),
    INTERNAL_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "Une erreur interne est survenue.");

    private final HttpStatus status;
    private final String defaultMessage;

    ErrorCode(HttpStatus status, String defaultMessage) {
        this.status = status;
        this.defaultMessage = defaultMessage;
    }

    public HttpStatus getStatus() {
        return status;
    }

    public String getDefaultMessage() {
        return defaultMessage;
    }
}
