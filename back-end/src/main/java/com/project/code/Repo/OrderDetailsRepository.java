package com.project.code.Repo;


import com.project.code.Model.OrderDetails;
import org.springframework.data.jpa.repository.JpaRepository;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface OrderDetailsRepository extends JpaRepository<OrderDetails,Long> {

    @Query("SELECT COALESCE(SUM(o.totalPrice), 0.0) FROM OrderDetails o WHERE o.date BETWEEN :startDate AND :endDate AND o.orderStatus <> 'CANCELLED'")
    Double getTotalRevenue(@Param("startDate") java.time.LocalDateTime startDate, @Param("endDate") java.time.LocalDateTime endDate);

    @Query("SELECT o.orderStatus, COUNT(o) FROM OrderDetails o GROUP BY o.orderStatus")
    List<Object[]> getOrderCountsByStatus();

    org.springframework.data.domain.Page<OrderDetails> findByStoreIdIn(java.util.Collection<Long> storeIds, org.springframework.data.domain.Pageable pageable);

    @Query("SELECT COALESCE(SUM(o.totalPrice), 0.0) FROM OrderDetails o WHERE o.date BETWEEN :startDate AND :endDate AND o.orderStatus <> 'CANCELLED' AND o.store.id IN :storeIds")
    Double getTotalRevenueForStores(@Param("startDate") java.time.LocalDateTime startDate, @Param("endDate") java.time.LocalDateTime endDate, @Param("storeIds") java.util.Collection<Long> storeIds);

    @Query("SELECT o.orderStatus, COUNT(o) FROM OrderDetails o WHERE o.store.id IN :storeIds GROUP BY o.orderStatus")
    List<Object[]> getOrderCountsByStatusForStores(@Param("storeIds") java.util.Collection<Long> storeIds);
}

