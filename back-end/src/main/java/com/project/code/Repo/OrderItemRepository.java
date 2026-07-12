package com.project.code.Repo;


import com.project.code.Model.OrderItem;
import org.springframework.data.jpa.repository.JpaRepository;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface OrderItemRepository extends JpaRepository<OrderItem,Long> {

    @Query("SELECT COUNT(oi) > 0 FROM OrderItem oi WHERE oi.order.customer.id = :customerId AND oi.product.id = :productId AND oi.order.store.id = :storeId")
    boolean existsByCustomerAndProductAndStore(@Param("customerId") Long customerId, @Param("productId") Long productId, @Param("storeId") Long storeId);
}


