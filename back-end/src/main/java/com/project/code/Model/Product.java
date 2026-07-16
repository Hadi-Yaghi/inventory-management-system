package com.project.code.Model;


import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import jakarta.persistence.ManyToOne;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.CascadeType;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import java.util.List;
@Entity
@Table(name = "product", uniqueConstraints = @UniqueConstraint(columnNames = "sku"))
public class Product {



    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private long id;
    @NotNull(message ="product name cannot be empty")
    private String name;
    @ManyToOne
    @JoinColumn(name = "category_id")
    private Category category;

    @ManyToOne
    @JoinColumn(name = "supplier_id")
    private Supplier supplier;

    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @JsonManagedReference("product-images")
    private List<ProductImage> images;
    @NotNull(message = "price cannot be empty")
    @Positive(message = "price must be a positive number")
    private Double price;
    @NotNull(message = "Sku cannot be empty")
    private String sku;
    @OneToMany(mappedBy = "product", fetch = FetchType.EAGER)
    @JsonBackReference("inventory-product")
    private List<Inventory> inventoryList;

    @com.fasterxml.jackson.annotation.JsonProperty("availableQuantity")
    public int getAvailableQuantity() {
        if (inventoryList == null) return 0;
        java.util.Set<Long> storeIds = com.project.code.security.SecurityUtils.getCurrentUserStoreIds();
        return inventoryList.stream()
                .filter(i -> storeIds == null || (i.getStore() != null && storeIds.contains(i.getStore().getId())))
                .mapToInt(i -> i.getAvailableQuantity())
                .sum();
    }

    @com.fasterxml.jackson.annotation.JsonProperty("reservedQuantity")
    public int getReservedQuantity() {
        if (inventoryList == null) return 0;
        java.util.Set<Long> storeIds = com.project.code.security.SecurityUtils.getCurrentUserStoreIds();
        return inventoryList.stream()
                .filter(i -> storeIds == null || (i.getStore() != null && storeIds.contains(i.getStore().getId())))
                .mapToInt(i -> i.getReservedQuantity())
                .sum();
    }

    @com.fasterxml.jackson.annotation.JsonProperty("stockLevel")
    public int getStockLevel() {
        if (inventoryList == null) return 0;
        java.util.Set<Long> storeIds = com.project.code.security.SecurityUtils.getCurrentUserStoreIds();
        return inventoryList.stream()
                .filter(i -> storeIds == null || (i.getStore() != null && storeIds.contains(i.getStore().getId())))
                .mapToInt(i -> i.getStockLevel() != null ? i.getStockLevel() : 0)
                .sum();
    }

    public long getId() {
        return id;
    }

    public void setId(long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public Category getCategory() {
        return category;
    }

    public void setCategory(Category category) {
        this.category = category;
    }

    public Supplier getSupplier() {
        return supplier;
    }

    public void setSupplier(Supplier supplier) {
        this.supplier = supplier;
    }

    public List<ProductImage> getImages() {
        return images;
    }

    public void setImages(List<ProductImage> images) {
        this.images = images;
    }

    public Double getPrice() {
        return price;
    }

    public void setPrice(Double price) {
        this.price = price;
    }

    public String getSku() {
        return sku;
    }

    public void setSku(String sku) {
        this.sku = sku;
    }

    public List<Inventory> getInventoryList() {
        return inventoryList;
    }

    public void setInventoryList(List<Inventory> inventoryList) {
        this.inventoryList = inventoryList;
    }
}


