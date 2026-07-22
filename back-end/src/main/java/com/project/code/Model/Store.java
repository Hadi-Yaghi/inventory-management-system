package com.project.code.Model;


import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;

import java.util.List;
@Entity
public class Store extends TenantEntity {



    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private long id ;
    @NotNull(message = "store name cannot be empty")
    private String name;
    @NotNull(message = "store address cannot be empty")
    private String address;
    @OneToMany(mappedBy = "store")
    @JsonBackReference("inventory-store")
    private List<Inventory> inventoryList;

    public Store() {
    }

    public Store(String name, String address) {
        this.name = name;
        this.address = address;
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

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public List<Inventory> getInventoryList() {
        return inventoryList;
    }

    public void setInventoryList(List<Inventory> inventoryList) {
        this.inventoryList = inventoryList;
    }
}
