package com.project.code.Model;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.project.code.Model.Product;
import com.project.code.Model.Store;
import jakarta.persistence.*;


@Entity
public class Inventory {


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

    private Integer lowStockThreshold = 10;

    public Inventory() {}

    public Integer getLowStockThreshold() { return lowStockThreshold; }

    public void setLowStockThreshold(Integer lowStockThreshold) { this.lowStockThreshold = lowStockThreshold; }

    public Inventory(Product product, Store store, Integer stockLevel) {
        this.product = product;
        this.store = store;
        this.stockLevel = stockLevel;
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