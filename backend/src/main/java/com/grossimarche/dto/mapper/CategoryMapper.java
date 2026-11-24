package com.grossimarche.dto.mapper;

import com.grossimarche.dto.catalog.CategoryResponse;
import com.grossimarche.entity.Category;
import com.grossimarche.integration.storage.PublicMedia;
import org.springframework.stereotype.Component;

/**
 * Category entity → DTO. Hand-written (not MapStruct) to avoid Lombok/MapStruct
 * processor-ordering issues across IDEs. Pure translation, no business logic.
 *
 * The one thing it does change is the picture's address: stored relative, handed out absolute,
 * so a client with no origin of its own - a mobile app - can open it. The icon beside it is a
 * key ("bakery"), not a file, and is passed through untouched.
 */
@Component
public class CategoryMapper {

    private final PublicMedia media;

    public CategoryMapper(PublicMedia media) {
        this.media = media;
    }

    public CategoryResponse toResponse(Category category, long productCount) {
        return new CategoryResponse(category.getId(), category.getName(), category.getNameAr(),
                category.getSlug(),
                category.getIcon(), media.url(category.getImageUrl()), category.getDisplayOrder(),
                category.isActive(), productCount);
    }
}
