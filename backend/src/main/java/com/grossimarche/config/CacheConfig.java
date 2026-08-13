package com.grossimarche.config;

import com.github.benmanes.caffeine.cache.Caffeine;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.caffeine.CaffeineCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Duration;

/**
 * Short-TTL caching for hot, rarely-changing catalogue reads (category list, product
 * detail). Writes evict via {@code @CacheEvict} in the admin services. In-JVM (Caffeine)
 * for predictability; a distributed Redis cache can replace this later.
 */
@Configuration
@EnableCaching
public class CacheConfig {

    public static final String CATEGORIES = "categories";
    public static final String PRODUCT_DETAIL = "productDetail";

    @Bean
    public CacheManager cacheManager() {
        CaffeineCacheManager manager = new CaffeineCacheManager(CATEGORIES, PRODUCT_DETAIL);
        manager.setCaffeine(Caffeine.newBuilder()
                .expireAfterWrite(Duration.ofSeconds(60))
                .maximumSize(1_000));
        return manager;
    }
}
