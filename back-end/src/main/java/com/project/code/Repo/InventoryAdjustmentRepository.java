package com.project.code.Repo;

import com.project.code.Model.InventoryAdjustment;
import com.project.code.Model.AdjustmentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;

@Repository
public interface InventoryAdjustmentRepository extends JpaRepository<InventoryAdjustment, Long> {

    List<InventoryAdjustment> findByStatus(AdjustmentStatus status);

    @Query("SELECT a FROM InventoryAdjustment a WHERE a.store.id IN :storeIds")
    List<InventoryAdjustment> findByStoreIdIn(@Param("storeIds") Collection<Long> storeIds);

    @Query("SELECT a FROM InventoryAdjustment a WHERE a.status = :status AND a.store.id IN :storeIds")
    List<InventoryAdjustment> findByStatusAndStoreIdIn(@Param("status") AdjustmentStatus status, @Param("storeIds") Collection<Long> storeIds);
}
