package com.project.code.specification;

import com.project.code.Model.Product;
import com.project.code.Model.Inventory;
import jakarta.persistence.criteria.*;
import org.springframework.data.jpa.domain.Specification;

public class ProductSpecification {

    public static Specification<Product> hasSkuLike(String sku) {
        return (root, query, cb) -> sku == null || sku.trim().isEmpty() ? null : cb.like(cb.lower(root.get("sku")), "%" + sku.toLowerCase() + "%");
    }

    public static Specification<Product> hasCategoryId(Long categoryId) {
        return (root, query, cb) -> categoryId == null ? null : cb.equal(root.get("category").get("id"), categoryId);
    }

    public static Specification<Product> hasPriceBetween(Double minPrice, Double maxPrice) {
        return (root, query, cb) -> {
            if (minPrice == null && maxPrice == null) return null;
            if (minPrice != null && maxPrice != null) return cb.between(root.get("price"), minPrice, maxPrice);
            if (minPrice != null) return cb.greaterThanOrEqualTo(root.get("price"), minPrice);
            return cb.lessThanOrEqualTo(root.get("price"), maxPrice);
        };
    }

    public static Specification<Product> isAvailableInStore(Long storeId) {
        return (root, query, cb) -> {
            if (storeId == null) return null;
            query.distinct(true);
            Join<Product, Inventory> inventoryJoin = root.join("inventoryList", JoinType.INNER);
            return cb.and(
                cb.equal(inventoryJoin.get("store").get("id"), storeId),
                cb.greaterThan(inventoryJoin.get("stockLevel"), 0)
            );
        };
    }
}
