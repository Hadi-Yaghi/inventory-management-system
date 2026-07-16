package com.project.code;

import com.project.code.Model.Category;
import com.project.code.Model.Product;
import com.project.code.Repo.CategoryRepository;
import com.project.code.Repo.ProductRepository;
import com.project.code.Controller.CategoryController;
import com.project.code.Controller.ProductController;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;

import java.security.SecureRandom;
import java.util.Base64;
import java.util.List;
import java.util.Map;

@SpringBootTest
public class CacheIntegrationTest {

    private static final String TEST_JWT_SECRET = generateTestSecret();

    @DynamicPropertySource
    static void configureTestProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", () -> "jdbc:h2:mem:cache_test;MODE=MySQL;DATABASE_TO_LOWER=TRUE;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE");
        registry.add("spring.datasource.driver-class-name", () -> "org.h2.Driver");
        registry.add("spring.datasource.username", () -> "sa");
        registry.add("spring.datasource.password", () -> "");
        registry.add("spring.jpa.database-platform", () -> "org.hibernate.dialect.H2Dialect");
        registry.add("spring.jpa.hibernate.ddl-auto", () -> "create-drop");
        registry.add("spring.data.mongodb.uri", () -> "mongodb://localhost:27017/cache_test");
        registry.add("jwt.secret", () -> TEST_JWT_SECRET);
        registry.add("spring.cache.type", () -> "redis");
        registry.add("spring.data.redis.host", () -> "localhost");
        registry.add("spring.data.redis.port", () -> "6379");
    }

    @Autowired
    private CacheManager cacheManager;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private CategoryController categoryController;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private ProductController productController;

    @Test
    void testRedisCacheWorkflow() {
        // --- 1. Category Cache Verification ---
        Cache categoriesCache = cacheManager.getCache("categories");
        Assertions.assertNotNull(categoriesCache, "Categories cache should be configured");
        
        // Evict any leftovers
        categoriesCache.clear();

        // Perform read
        List<Category> allCategories1 = categoryRepository.findAll();
        
        // Verify entry is cached in Redis
        Cache.ValueWrapper cachedValue = categoriesCache.get("all");
        Assertions.assertNotNull(cachedValue, "Categories should be cached under 'all'");
        
        // Mutate category via controller (should trigger evict)
        Category dummy = new Category();
        dummy.setName("Test Caching Category");
        categoryController.createCategory(dummy);

        // Verify entry is evicted
        cachedValue = categoriesCache.get("all");
        Assertions.assertNull(cachedValue, "Categories cache 'all' should be evicted after mutation");

        // --- 2. Product Cache Verification ---
        Cache productsCache = cacheManager.getCache("products");
        Assertions.assertNotNull(productsCache, "Products cache should be configured");
        
        // Evict any leftovers
        productsCache.clear();

        // Setup product
        Product product = new Product();
        product.setName("Cached Product Test");
        product.setSku("CACHE-SKU-999");
        product.setPrice(150.0);
        product = productRepository.save(product);

        // Retrieve product by id (hits controller, populating cache)
        Map<String, Object> response1 = productController.getProductbyId(product.getId());
        Assertions.assertNotNull(response1);

        // Verify cached in Redis
        cachedValue = productsCache.get(product.getId());
        Assertions.assertNotNull(cachedValue, "Product should be cached in Redis");

        // Mutate product details (triggers @CacheEvict)
        Product updateDto = new Product();
        updateDto.setId(product.getId());
        updateDto.setName("Cached Product Test Updated");
        updateDto.setSku("CACHE-SKU-999");
        updateDto.setPrice(160.0);
        productController.updateProduct(updateDto);

        // Verify entry is evicted from Redis
        cachedValue = productsCache.get(product.getId());
        Assertions.assertNull(cachedValue, "Product cache should be evicted after product update");
    }

    private static String generateTestSecret() {
        byte[] secret = new byte[64];
        new SecureRandom().nextBytes(secret);
        return Base64.getEncoder().encodeToString(secret);
    }
}
