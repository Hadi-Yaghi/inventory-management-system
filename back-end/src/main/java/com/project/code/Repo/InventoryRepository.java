package com.project.code.Repo;

import com.project.code.Model.Inventory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Repository
public interface InventoryRepository extends JpaRepository<Inventory,Long> {
// 1. Add the repository interface:
//    - Extend JpaRepository<Inventory, Long> to inherit basic CRUD functionality.
//    - This allows the repository to perform operations like save, delete, update, and find without having to implement these methods manually.

// Example: public interface InventoryRepository extends JpaRepository<Inventory, Long> {}

// 2. Add custom query methods:
//    - **findByProductIdandStoreId**:
//      - This method will allow you to find an inventory record by its product ID and store ID.
//      - Return type: Inventory
//      - Parameters: Long productId, Long storeId
      
// Example: public Inventory findByProductIdandStoreId(Long productId, Long storeId);

//    - **findByStore_Id**:
//      - This method will allow you to find a list of inventory records for a specific store.
//      - Return type: List<Inventory>
//      - Parameter: Long storeId
      
// Example: public List<Inventory> findByStore_Id(Long storeId);

//    - **deleteByProductId**:
//      - This method will allow you to delete all inventory records related to a specific product ID.
//      - Return type: void
//      - Parameter: Long productId
//      - Use @Modifying and @Transactional annotations to ensure the database is modified correctly.
    public Inventory findByProductIdAndStoreId(Long productId,Long storeId);
    public List<Inventory> findByStoreId(Long storeId);
    @Modifying
    @Transactional
    public void deleteByProductId(Long productId);

    @org.springframework.data.jpa.repository.Query("SELECT i FROM Inventory i WHERE i.store.id = :storeId AND i.stockLevel <= i.lowStockThreshold")
    public List<Inventory> findLowStockByStoreId(Long storeId);

    @org.springframework.data.jpa.repository.Query("SELECT i FROM Inventory i WHERE i.stockLevel <= i.lowStockThreshold")
    public List<Inventory> findAllLowStock();
}
