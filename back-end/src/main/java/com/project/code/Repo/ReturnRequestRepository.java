package com.project.code.Repo;

import com.project.code.Model.ReturnRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ReturnRequestRepository extends JpaRepository<ReturnRequest, Long> {

    @org.springframework.data.jpa.repository.Query("SELECT r FROM ReturnRequest r WHERE r.orderItemId IN (SELECT oi.id FROM OrderItem oi WHERE oi.order.store.id IN :storeIds)")
    java.util.List<ReturnRequest> findByStoreIdIn(@org.springframework.data.repository.query.Param("storeIds") java.util.Collection<Long> storeIds);
}
