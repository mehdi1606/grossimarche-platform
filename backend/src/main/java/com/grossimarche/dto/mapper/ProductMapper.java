package com.grossimarche.dto.mapper;

import com.grossimarche.dto.catalog.AdminProductSummaryResponse;
import com.grossimarche.dto.catalog.PriceTierResponse;
import com.grossimarche.dto.catalog.ProductAttributeResponse;
import com.grossimarche.dto.catalog.ProductDetailResponse;
import com.grossimarche.dto.catalog.ProductSummaryResponse;
import com.grossimarche.entity.Product;
import com.grossimarche.entity.ProductAttribute;
import com.grossimarche.entity.ProductPriceTier;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Product entity → DTO. Hand-written (not MapStruct) so it is immune to Lombok/MapStruct
 * annotation-processor ordering differences between IDEs. Pure translation, no business
 * logic; computed flags (stock, discount) are passed in by the service. Called within a
 * transaction, so the lazy {@code category} association resolves.
 */
@Component
public class ProductMapper {

    public ProductSummaryResponse toSummary(Product product, boolean inStock, boolean hasQuantityDiscount) {
        return new ProductSummaryResponse(product.getId(), product.getName(), product.getSlug(),
                product.getPrice(), product.getUnit(), product.getImageUrl(), inStock, hasQuantityDiscount);
    }

    /** Back-office list row (exposes stock/active/category; called within a transaction). */
    public AdminProductSummaryResponse toAdminSummary(Product product) {
        return new AdminProductSummaryResponse(product.getId(), product.getName(), product.getSlug(),
                product.getDescription(), product.getPrice(), product.getUnit(), product.getImageUrl(),
                product.getStockQuantity(), product.getMinOrderQuantity(), product.isActive(),
                product.getCategory().getId(), product.getCategory().getName());
    }

    public ProductDetailResponse toDetail(Product product, List<PriceTierResponse> priceTiers,
                                          List<ProductAttributeResponse> attributes,
                                          double averageRating, long reviewCount) {
        return new ProductDetailResponse(product.getId(), product.getName(), product.getSlug(),
                product.getDescription(), product.getPrice(), product.getUnit(), product.getStockQuantity(),
                product.getMinOrderQuantity(), product.getImageUrl(), product.isActive(),
                product.getCategory().getId(), product.getCategory().getName(), priceTiers, attributes,
                averageRating, reviewCount);
    }

    public ProductAttributeResponse toAttribute(ProductAttribute a) {
        return new ProductAttributeResponse(a.getId(), a.getName(), a.getValue(), a.getDisplayOrder());
    }

    public List<ProductAttributeResponse> toAttributes(List<ProductAttribute> attributes) {
        return attributes.stream().map(this::toAttribute).toList();
    }

    public PriceTierResponse toTier(ProductPriceTier tier) {
        return new PriceTierResponse(tier.getId(), tier.getMinQuantity(), tier.getUnitPrice());
    }

    public List<PriceTierResponse> toTiers(List<ProductPriceTier> tiers) {
        return tiers.stream().map(this::toTier).toList();
    }
}
