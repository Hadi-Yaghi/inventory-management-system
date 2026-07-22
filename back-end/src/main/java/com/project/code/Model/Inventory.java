package com.project.code.Model;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.project.code.Model.Product;
import com.project.code.Model.Store;
import jakarta.persistence.*;


@Entity
public class Inventory extends TenantEntity {


    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "product_id")
    @JsonBackReference("inventory-product")
    private Product product;

    @ManyToOne
    @JoinColumn(name = "store_id")
    @JsonBackReference("inventory-store")
    private Store store;

    private Integer stockLevel;

    @Column(name = "reserved_quantity", nullable = false)
    private Integer reservedQuantity = 0;

    private Integer lowStockThreshold = 10;

    public Inventory() {}

    public Integer getReservedQuantity() {
        return reservedQuantity != null ? reservedQuantity : 0;
    }

    public void setReservedQuantity(Integer reservedQuantity) {
        this.reservedQuantity = reservedQuantity;
    }

    public Integer getAvailableQuantity() {
        return (stockLevel != null ? stockLevel : 0) - getReservedQuantity();
    }


    public Integer getLowStockThreshold() { return lowStockThreshold; }

    public void setLowStockThreshold(Integer lowStockThreshold) { this.lowStockThreshold = lowStockThreshold; }

    public Inventory(Product product, Store store, Integer stockLevel) {
        this.product = product;
        this.store = store;
        this.stockLevel = stockLevel;
        this.reservedQuantity = 0;
    }


    public Long getId() { return id; }

    public void setId(Long id) { this.id = id; }

    public Product getProduct() { return product; }

    public void setProduct(Product product) { this.product = product; }

    public Store getStore() { return store; }

    public void setStore(Store store) { this.store = store; }

    public Integer getStockLevel() { return stockLevel; }

    public void setStockLevel(Integer stockLevel) { this.stockLevel = stockLevel; }
}
