package com.project.code.Repo;


import com.project.code.Model.OrderItem;
import org.springframework.data.jpa.repository.JpaRepository;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import org.springframework.data.domain.Pageable;
import java.util.List;

import org.springframework.data.jpa.repository.Modifying;
import org.springframework.transaction.annotation.Transactional;

public interface OrderItemRepository extends JpaRepository<OrderItem,Long> {

    @Modifying
    @Transactional
    @Query("DELETE FROM OrderItem oi WHERE oi.product.id = :productId")
    void deleteByProductId(@Param("productId") Long productId);

    @Query("SELECT COUNT(oi) > 0 FROM OrderItem oi WHERE oi.order.customer.id = :customerId AND oi.product.id = :productId AND oi.order.store.id = :storeId")
    boolean existsByCustomerAndProductAndStore(@Param("customerId") Long customerId, @Param("productId") Long productId, @Param("storeId") Long storeId);

    @Query("SELECT oi.product.id, oi.product.name, SUM(oi.quantity) as totalQty FROM OrderItem oi WHERE oi.order.orderStatus <> 'CANCELLED' GROUP BY oi.product.id, oi.product.name ORDER BY totalQty DESC")
    List<Object[]> getTopSellingProductsByQuantity(Pageable pageable);

    @Query("SELECT oi.product.id, oi.product.name, SUM(oi.price) as totalRev FROM OrderItem oi WHERE oi.order.orderStatus <> 'CANCELLED' GROUP BY oi.product.id, oi.product.name ORDER BY totalRev DESC")
    List<Object[]> getTopSellingProductsByRevenue(Pageable pageable);

    @Query("SELECT oi.product.id, oi.product.name, SUM(oi.quantity) as totalQty FROM OrderItem oi WHERE oi.order.orderStatus <> 'CANCELLED' AND oi.order.store.id IN :storeIds GROUP BY oi.product.id, oi.product.name ORDER BY totalQty DESC")
    List<Object[]> getTopSellingProductsByQuantityForStores(@Param("storeIds") java.util.Collection<Long> storeIds, org.springframework.data.domain.Pageable pageable);

    @Query("SELECT oi.product.id, oi.product.name, SUM(oi.price) as totalRev FROM OrderItem oi WHERE oi.order.orderStatus <> 'CANCELLED' AND oi.order.store.id IN :storeIds GROUP BY oi.product.id, oi.product.name ORDER BY totalRev DESC")
    List<Object[]> getTopSellingProductsByRevenueForStores(@Param("storeIds") java.util.Collection<Long> storeIds, org.springframework.data.domain.Pageable pageable);
}


