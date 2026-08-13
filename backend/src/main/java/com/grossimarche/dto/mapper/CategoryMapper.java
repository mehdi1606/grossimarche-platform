package com.grossimarche.dto.mapper;

import com.grossimarche.dto.catalog.CategoryResponse;
import com.grossimarche.entity.Category;
import org.springframework.stereotype.Component;

/**
 * Category entity → DTO. Hand-written (not MapStruct) to avoid Lombok/MapStruct
 * processor-ordering issues across IDEs. Pure translation, no business logic.
 */
@Component
public class CategoryMapper {

    public CategoryResponse toResponse(Category category, long productCount) {
        return new CategoryResponse(category.getId(), category.getName(), category.getSlug(),
                category.getIcon(), category.getDisplayOrder(), category.isActive(), productCount);
    }
}
