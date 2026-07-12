package com.project.code.Repo;

import com.project.code.Model.StockTransfer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface StockTransferRepository extends JpaRepository<StockTransfer, Long> {
    List<StockTransfer> findByFromStoreIdOrToStoreId(Long fromStoreId, Long toStoreId);
}
